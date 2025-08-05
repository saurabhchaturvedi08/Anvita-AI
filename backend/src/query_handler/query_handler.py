import boto3
import json
import os
from utils.embedding import get_embedding
from utils.prompts import get_qa_prompt
from common.opensearch_utils import query_vector_db

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

BEDROCK_LLM_MODEL = os.environ.get('BEDROCK_LLM_MODEL', 'anthropic.claude-3-sonnet-20240229-v1:0')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def call_bedrock_llm(prompt, max_tokens=512):
    """Call Bedrock LLM for text generation"""
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
    """Lambda handler for Q&A functionality"""
    try:
        body = json.loads(event['body'])
        file_key = body.get('file_key')
        question = body.get('question')
        
        if not file_key or not question:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Missing file_key or question"
                })
            }
        
        # 1. Generate embedding for the question
        question_embedding = get_embedding(question)
        
        # 2. Search for relevant chunks in vector database
        relevant_chunks = query_vector_db(
            question_embedding, 
            filter={"file_key": file_key},
            top_k=5
        )
        
        if not relevant_chunks:
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "answer": "I couldn't find any relevant information in the uploaded document to answer your question. Please try rephrasing your question or check if the document contains the information you're looking for.",
                    "sources": [],
                    "confidence": 0.0
                })
            }
        
        # 3. Create prompt with context and question
        prompt = get_qa_prompt(question, relevant_chunks)
        
        # 4. Generate answer using LLM
        answer = call_bedrock_llm(prompt)
        
        # 5. Format sources for response
        sources = []
        for i, chunk in enumerate(relevant_chunks):
            sources.append({
                "content": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                "similarity": 0.9 - (i * 0.1),  # Approximate similarity score
                "chunk_index": i
            })
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "answer": answer,
                "sources": sources,
                "confidence": 0.85,
                "queryId": f"query_{os.urandom(8).hex()}",
                "timestamp": str(os.urandom(8).hex())
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to process question"
            })
        } 