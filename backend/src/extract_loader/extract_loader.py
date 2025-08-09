import os
import json
import boto3
import tempfile
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import docx
import textract

# Set Tesseract binary path for Lambda Layer
pytesseract.pytesseract.tesseract_cmd = "/opt/bin/tesseract"

s3 = boto3.client('s3')

def extract_text_from_file(bucket, file_key):
    ext = os.path.splitext(file_key)[1].lower()
    text_key = file_key.replace('uploads/', 'texts/').rsplit('.', 1)[0] + '.txt'
    text = ""

    with tempfile.NamedTemporaryFile(suffix=ext) as tmp_file:
        s3.download_fileobj(bucket, file_key, tmp_file)
        tmp_file.seek(0)
        if ext == '.pdf':
            doc = fitz.open(tmp_file.name)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                if page_text and page_text.strip():
                    text += page_text
                else:
                    # Fallback to OCR using Tesseract
                    pix = page.get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img)
                    text += ocr_text
        elif ext == '.docx':
            doc = docx.Document(tmp_file.name)
            text = '\n'.join([para.text for para in doc.paragraphs])
        elif ext == '.txt':
            text = tmp_file.read().decode('utf-8')
        else:
            # Fallback to textract for other types (e.g., .doc, .rtf, .odt, etc.)
            try:
                text = textract.process(tmp_file.name).decode('utf-8')
            except Exception as e:
                text = f"[Error extracting text: {str(e)}]"

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
        # S3 event structure
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        file_key = record['s3']['object']['key']
        
        # Extract text from uploaded file
        text_key = extract_text_from_file(bucket, file_key)
        
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