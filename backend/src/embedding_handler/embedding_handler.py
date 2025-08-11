import boto3
import json
import os
import uuid
import chromadb
import requests
import math

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# ChromaDB persistent storage in Lambda's /tmp
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="documents")

# Gemini API setup
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"

def chunk_text_by_tokens(text, max_tokens=1800):
    """
    Splits text into chunks that are under the token limit.
    Roughly assumes 1 token ~ 4 characters.
    """
    max_chars = max_tokens * 4
    return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]

def get_embedding(text):
    """
    Calls Gemini's embedContent for a single chunk.
    Returns the embedding vector.
    """
    try:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]}
        }

        response = requests.post(
            GEMINI_EMBED_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json"
            },
            json=payload
        )
        response.raise_for_status()

        data = response.json()
        return data["embedding"]["values"]  # embedding vector

    except Exception as e:
        raise RuntimeError(f"Gemini embedding API failed: {str(e)}")

def lambda_handler(event, context):
    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        text_key = record['s3']['object']['key']

        file_key = text_key.replace('texts/', 'uploads/').replace('.txt', '')
        doc_id = str(uuid.uuid4())

        obj = s3.get_object(Bucket=bucket, Key=text_key)
        extracted_text = obj["Body"].read().decode('utf-8')

        # Token-safe chunking
        chunks = chunk_text_by_tokens(extracted_text, max_tokens=1800)

        # Sequentially embed each chunk
        chunks_ingested = 0
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            metadata = {
                "file_key": file_key,
                "chunk_id": i,
                "doc_id": doc_id
            }
            collection.add(
                ids=[f"{doc_id}_{i}"],
                documents=[chunk],
                embeddings=[embedding],
                metadatas=[metadata]
            )
            chunks_ingested += 1

        return {
            "statusCode": 200,
            "body": json.dumps({
                "doc_id": doc_id,
                "file_key": file_key,
                "chunks_ingested": chunks_ingested,
                "total_chunks": len(chunks),
                "message": "Text embedded with Gemini and stored in ChromaDB"
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to embed text and store vectors"
            })
        }
