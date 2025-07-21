import boto3
import os
from utils.prompts import get_summary_prompt
import json

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')
BEDROCK_LLM_MODEL = os.environ.get('BEDROCK_LLM_MODEL', 'anthropic.claude-3-sonnet-20240229-v1:0')

def call_bedrock_llm(prompt, max_tokens=512):
    response = bedrock.invoke_model(
        modelId=BEDROCK_LLM_MODEL,
        body=json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": max_tokens,
            "temperature": 0.7,
            "top_k": 250,
            "top_p": 1.0,
            "stop_sequences": ["\n\nHuman:"]
        }),
        contentType="application/json",
        accept="application/json"
    )
    model_output = json.loads(response['body'].read())
    return model_output.get('completion', '').strip()

def lambda_handler(event, context):
    bucket = event['queryStringParameters']['bucket']
    file_key = event['queryStringParameters']['file_key']
    text_key = file_key.replace("uploads/", "texts/").rsplit('.', 1)[0] + ".txt"
    obj = s3.get_object(Bucket=bucket, Key=text_key)
    extracted_text = obj['Body'].read().decode('utf-8')
    prompt = get_summary_prompt(extracted_text)
    summary = call_bedrock_llm(prompt)
    return {
        "statusCode": 200,
        "body": json.dumps({"summary": summary})
    } 