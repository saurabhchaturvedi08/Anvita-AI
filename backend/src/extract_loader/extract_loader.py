import os
import json
import boto3
import tempfile
import fitz
from PyPDF2 import PdfReader
import pytesseract
from PIL import Image
import docx

# Set Tesseract binary path for Lambda Layer
pytesseract.pytesseract.tesseract_cmd = "/opt/bin/tesseract"
# pytesseract.pytesseract.tesseract_cmd = "path to your tesseract exe in your machine"

s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

EMBEDDING_LAMBDA = os.environ.get("EMBEDDING_LAMBDA_NAME")

def extract_text_from_file(bucket, file_key):
    ext = os.path.splitext(file_key)[1].lower()
    text_key = file_key.replace('uploads/', 'texts/').rsplit('.', 1)[0] + '.txt'
    text = ""

    with tempfile.NamedTemporaryFile(suffix=ext) as tmp_file:
        s3.download_fileobj(bucket, file_key, tmp_file)
        tmp_file.seek(0)

        if ext == '.pdf':
            try:
                reader = PdfReader(tmp_file.name)
                text = "\n".join(page.extract_text() or "" for page in reader.pages)

                if not text.strip():
                    text_parts = []
                    pdf_doc = fitz.open(tmp_file.name)
                    for page_num in range(len(pdf_doc)):
                        page = pdf_doc[page_num]
                        pix = page.get_pixmap()
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        text_parts.append(pytesseract.image_to_string(img))
                    text = "\n".join(text_parts) or "[No text found in scanned PDF]"
            except Exception as e:
                text = f"[Error extracting text from PDF: {str(e)}]"

        elif ext == '.docx':
            try:
                doc = docx.Document(tmp_file.name)
                text = '\n'.join([para.text for para in doc.paragraphs])
            except Exception as e:
                text = f"[Error extracting text from DOCX: {str(e)}]"

        elif ext == '.txt':
            try:
                text = tmp_file.read().decode('utf-8')
            except Exception as e:
                text = f"[Error reading TXT: {str(e)}]"

        else:
            text = "[Unsupported file type]"

    s3.put_object(
        Bucket=bucket,
        Key=text_key,
        Body=text,
        ContentType='text/plain'
    )

    return text_key


def lambda_handler(event, context):
    """Lambda handler triggered when files are uploaded to S3"""
    try:
        body = json.loads(event["body"])
        bucket = body.get("bucket") or os.environ.get("BUCKET_NAME")
        file_key = body.get("fileKey")

        if not bucket or not file_key:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing bucket or fileKey"})
            }
        
        text_key = extract_text_from_file(bucket, file_key)

        if EMBEDDING_LAMBDA:
            lambda_client.invoke(
                FunctionName=EMBEDDING_LAMBDA,
                # InvocationType="Event",
                InvocationType="RequestResponse",
                Payload=json.dumps({
                    "bucket": bucket,
                    "text_key": text_key,
                    "file_key": file_key
                })
            )
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "text_key": text_key,
                "file_key": file_key,
                "message": "Text extracted and saved. Vector embedding will be triggered automatically."
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to extract text from file"
            })
        }


# To test in your local
if __name__ == "__main__":
    mock_event = {
        "body": json.dumps({
            "bucket": "anvita-s3-bucket",
            "fileKey": "uploads/1754921165_fa63225d-ab4e-40c9-8beb-8378c3af52a8_test.pdf"
        })
    }
    print(lambda_handler(mock_event, None))