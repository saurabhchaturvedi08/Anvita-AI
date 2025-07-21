from utils.embedding import get_embedding
from common.opensearch_utils import query_vector_db
from utils.prompts import get_qa_prompt
import json
import boto3
import os

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
    body = json.loads(event['body'])
    file_key = body['file_key']
    question = body['question']
    question_embedding = get_embedding(question)
    relevant_chunks = query_vector_db(question_embedding, filter={"file_key": file_key})
    prompt = get_qa_prompt(question, relevant_chunks)
    answer = call_bedrock_llm(prompt)
    return {
        "statusCode": 200,
        "body": json.dumps({"answer": answer})
    } 