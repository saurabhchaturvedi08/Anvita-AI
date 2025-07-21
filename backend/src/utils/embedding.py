import boto3
import os
import json

bedrock = boto3.client('bedrock-runtime')

BEDROCK_EMBEDDING_MODEL = os.environ.get('BEDROCK_EMBEDDING_MODEL', 'amazon.titan-embed-text-v1')

def get_embedding(text):
    response = bedrock.invoke_model(
        modelId=BEDROCK_EMBEDDING_MODEL,
        body=json.dumps({"inputText": text}),
        contentType="application/json",
        accept="application/json"
    )
    result = json.loads(response['body'].read())
    return result['embedding']
