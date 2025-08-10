import boto3
import json
import os
import uuid
import chromadb
import requests

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# ChromaDB persistent storage in Lambda's /tmp
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="documents")

# Gemini API setup
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"

def chunk_text(text, max_tokens=300):
    words = text.split()
    return [
        " ".join(words[i:i+max_tokens])
        for i in range(0, len(words), max_tokens)
    ]

def get_embeddings_for_chunks(chunks):
    """
    Calls Gemini's embedContent for multiple chunks in one API request.
    Returns a list of embeddings (one per chunk).
    """
    try:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": [{"parts": [{"text": chunk}]} for chunk in chunks]
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
        # Gemini returns embeddings under embeddings[] for each input
        return [item["embedding"] for item in data.get("embedding", [])]

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

        chunks = chunk_text(extracted_text, max_tokens=300)
        embeddings = get_embeddings_for_chunks(chunks)

        chunks_ingested = 0
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
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
