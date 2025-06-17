import boto3
import os
import json
import requests

# Optional: replace with Amazon Titan or Bedrock vector embeddings
from utils.embedding import get_embedding
from utils.prompts import get_qa_prompt

bedrock = boto3.client('bedrock-runtime')

# Assume vector DB is a RESTful OpenSearch or FAISS endpoint
VECTOR_SEARCH_API = os.environ.get("VECTOR_SEARCH_API")

def lambda_handler(event, context):
    query = event['query']
    top_k = event.get('top_k', 5)

    # Step 1: Get embedding of user query
    query_embedding = get_embedding(query)

    # Step 2: Search vector database (OpenSearch or FAISS endpoint)
    response = requests.post(
        VECTOR_SEARCH_API,
        json={"embedding": query_embedding, "top_k": top_k}
    )
    results = response.json()  # Each result should have "text" and "score"

    context_chunks = [r["text"] for r in results]

    # Step 3: Format prompt for LLM (Claude or Llama)
    prompt = get_qa_prompt(query, context_chunks)

    # Step 4: Generate final answer using Bedrock
    llm_response = bedrock.invoke_model(
        modelId=os.environ.get("BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0"),
        body=json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": 512,
            "temperature": 0.5
        }),
        contentType="application/json",
        accept="application/json"
    )

    model_output = json.loads(llm_response['body'].read())
    answer = model_output.get('completion', '').strip()

    return {
        "statusCode": 200,
        "query": query,
        "answer": answer,
        "sources": context_chunks
    }
