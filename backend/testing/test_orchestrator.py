import os
import json
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
# Import your handlers directly
from src.extract_loader.extract_loader import lambda_handler as extract_handler
from src.embedding_handler.embedding_handler import lambda_handler as embed_handler
from src.summarizer_handler.summarizer import lambda_handler as summarizer_handler


def run_pipeline(bucket, file_key):
    print("=== STEP 1: Extract Text ===")
    extract_event = {
        "body": json.dumps({
            "bucket": bucket,
            "fileKey": file_key
        })
    }
    extract_response = extract_handler(extract_event, None)
    extract_body = json.loads(extract_response["body"])
    print(json.dumps(extract_body, indent=2))

    if "text_key" not in extract_body:
        print("❌ Extraction failed. Stopping pipeline.")
        return

    text_key = extract_body["text_key"]

    print("\n=== STEP 2: Embed Text ===")
    embed_event = {
        "bucket": bucket,
        "text_key": text_key,
        "file_key": file_key
    }
    embed_response = embed_handler(embed_event, None)
    embed_body = json.loads(embed_response["body"])
    print(json.dumps(embed_body, indent=2))

    if embed_response["statusCode"] != 200:
        print("❌ Embedding failed. Stopping pipeline.")
        return

    print("\n=== STEP 3: Summarize Document ===")
    summarizer_event = {
        "queryStringParameters": {
            "file_key": file_key
        }
    }
    summarizer_response = summarizer_handler(summarizer_event, None)
    summarizer_body = json.loads(summarizer_response["body"])
    print(json.dumps(summarizer_body, indent=2))


if __name__ == "__main__":
    # configure env to persist Chroma locally
    os.environ["CHROMA_PATH"] = "./chromadb_local"

    # Replace with your test values
    TEST_BUCKET = "anvita-s3-bucket"
    TEST_FILE_KEY = "uploads/1755365257_7babd472-1423-40ce-b9dd-b0716290031e_example.pdf"

    run_pipeline(TEST_BUCKET, TEST_FILE_KEY)
