import os
from extract_loader.extract_text import extract_text_from_file

def lambda_handler(event, context):
    # S3 event structure
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    file_key = record['s3']['object']['key']
    text_key = extract_text_from_file(bucket, file_key)
    return {
        "statusCode": 200,
        "text_key": text_key,
        "message": "Text extracted and saved."
    } 