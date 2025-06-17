import boto3
import json
import os
import uuid
import requests
from utils.chunking import chunk_text

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

VECTOR_DB_API = os.environ.get("VECTOR_DB_API")
EMBEDDING_MODEL_ID = os.environ.get("BEDROCK_EMBEDDING_MODEL", "amazon.titan-embed-text-v1")

def get_embeddings(texts):
    """Call Bedrock embedding model in batch (or loop if needed)."""
    embeddings = []

    for text in texts:
        response = bedrock.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            body=json.dumps({
                "inputText": text
            }),
            contentType="application/json",
            accept="application/json"
        )
        result = json.loads(response['body'].read())
        embeddings.append(result.get("embedding", []))

    return embeddings

def lambda_handler(event, context):
    bucket = event["bucket"]
    key = event["transcript_key"]
    doc_id = event.get("doc_id", str(uuid.uuid4()))

    # 1. Load transcript from S3
    obj = s3.get_object(Bucket=bucket, Key=key)
    data = json.loads(obj["Body"].read())
    transcript = data.get("transcript", "")

    # 2. Chunk transcript into segments
    chunks = chunk_text(transcript, max_tokens=300)

    # 3. Generate vector embeddings
    embeddings = get_embeddings(chunks)

    # 4. Format for vector DB (OpenSearch / FAISS)
    items = []
    for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        items.append({
            "id": f"{doc_id}-{i}",
            "embedding": vector,
            "metadata": {
                "chunk_index": i,
                "text": chunk,
                "source": key
            }
        })

    # 5. Upload to vector DB
    response = requests.post(
        VECTOR_DB_API,
        json={"documents": items}
    )

    return {
        "statusCode": 200,
        "doc_id": doc_id,
        "chunks_ingested": len(items),
        "vector_db_status": response.status_code
    }
