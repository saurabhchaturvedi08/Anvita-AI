import boto3
import json
import os
import uuid
import chromadb
from chromadb.config import Settings

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# Initialize ChromaDB client in /tmp (ephemeral Lambda storage)
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Ensure collection exists
collection = chroma_client.get_or_create_collection(name="documents")

# Bedrock setup
bedrock = boto3.client('bedrock-runtime')
BEDROCK_EMBEDDING_MODEL = os.environ.get("BEDROCK_EMBEDDING_MODEL", "amazon.titan-embed-text-v1")

def chunk_text(text, max_tokens=300):
    """
    Splits a long string into smaller chunks (~max_tokens words).
    Approximate: assumes 1 word ~ 1 token.
    """
    words = text.split()
    chunks = [
        " ".join(words[i:i+max_tokens])
        for i in range(0, len(words), max_tokens)
    ]
    return chunks

def get_embedding(text: str) -> list[float]:
    """
    Generate an embedding for the given text using Amazon Bedrock (Titan model).
    Returns the embedding as a list of floats.
    """
    try:
        body = json.dumps({ "inputText": text })

        response = bedrock.invoke_model(
            modelId=BEDROCK_EMBEDDING_MODEL,
            body=body,
            contentType="application/json"
        )

        response_body = json.loads(response["body"].read())

        # Titan returns {"embedding": [...], "inputTextTokenCount": ...}
        return response_body["embedding"]

    except Exception as e:
        raise RuntimeError(f"Failed to generate embedding: {str(e)}")

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
