import boto3
import json
import os
import uuid
from utils.chunking import chunk_text
from utils.embedding import get_embedding
from common.opensearch_utils import store_embedding, create_index

s3 = boto3.client('s3')

BUCKET_NAME = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    """Lambda handler triggered when text files are uploaded to S3"""
    try:
        # Get S3 event details
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        text_key = record['s3']['object']['key']
        
        # Extract file key from text key (remove texts/ prefix and .txt suffix)
        file_key = text_key.replace('texts/', 'uploads/').replace('.txt', '')
        
        # Generate document ID
        doc_id = str(uuid.uuid4())
        
        # 1. Load extracted text from S3
        obj = s3.get_object(Bucket=bucket, Key=text_key)
        extracted_text = obj["Body"].read().decode('utf-8')
        
        # 2. Chunk text into segments
        chunks = chunk_text(extracted_text, max_tokens=300)
        
        # 3. Create OpenSearch index if it doesn't exist
        create_index()
        
        # 4. Generate vector embeddings and store in OpenSearch
        chunks_ingested = 0
        for i, chunk in enumerate(chunks):
            try:
                # Generate embedding for this chunk
                embedding = get_embedding(chunk)
                
                # Store in OpenSearch
                metadata = {
                    "file_key": file_key,
                    "chunk_id": i,
                    "doc_id": doc_id
                }
                store_embedding(embedding, chunk, metadata)
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
                "message": "Text embedded and vectors stored successfully in OpenSearch"
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