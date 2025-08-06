# File: src/embedding_handler/embedding_handler.py

import boto3
import json
import os
import uuid
from utils.chunking import chunk_text
from utils.embedding import get_embedding
import chromadb
from chromadb.config import Settings

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# Initialize ChromaDB client in /tmp (ephemeral Lambda storage)
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Ensure collection exists
collection = chroma_client.get_or_create_collection(name="documents")

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

        chunks_ingested = 0
        for i, chunk in enumerate(chunks):
            try:
                embedding = get_embedding(chunk)

                # Store in ChromaDB
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

            except Exception as e:
                print(f"Error processing chunk {i}: {str(e)}")
                continue

        return {
            "statusCode": 200,
            "body": json.dumps({
                "doc_id": doc_id,
                "file_key": file_key,
                "chunks_ingested": chunks_ingested,
                "total_chunks": len(chunks),
                "message": "Text embedded and vectors stored in ChromaDB"
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to embed text and create vectors"
            })
        }
