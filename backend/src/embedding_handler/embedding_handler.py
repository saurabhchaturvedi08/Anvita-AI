import boto3
import os
from utils.chunking import chunk_text
from utils.embedding import get_embedding
from common.opensearch_utils import store_embedding

s3 = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        text_key = record['s3']['object']['key']
        # Derive original file key (assume .pdf, .docx, etc. as needed)
        file_key = text_key.replace('texts/', 'uploads/').rsplit('.', 1)[0] + '.pdf'
        obj = s3.get_object(Bucket=bucket, Key=text_key)
        extracted_text = obj['Body'].read().decode('utf-8')
        chunks = chunk_text(extracted_text)
        for idx, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            store_embedding(embedding, chunk, metadata={"file_key": file_key, "chunk_id": idx})
    return {"status": "embedded"} 