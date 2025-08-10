import boto3
import json
import os
import chromadb

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

BEDROCK_LLM_MODEL = os.environ.get('BEDROCK_LLM_MODEL', 'anthropic.claude-3-sonnet-20240229-v1:0')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# Initialize ChromaDB client (read-only)
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="documents")

# Bedrock setup
bedrock = boto3.client('bedrock-runtime')
BEDROCK_EMBEDDING_MODEL = os.environ.get("BEDROCK_EMBEDDING_MODEL", "amazon.titan-embed-text-v1")

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

def get_qa_prompt(user_query, context_chunks):
    context_text = "\n\n".join(context_chunks)
    return f"""Human: Answer the question below using only the information provided.

    Context:
    {context_text}

    Question: {user_query}

    Assistant:"""

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
                "body": json.dumps({ "error": "Missing file_key or question" })
            }

        # 1. Get embedding for the question
        question_embedding = get_embedding(question)

        # 2. Query ChromaDB for top-k similar chunks with matching file_key
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=5,
            where={"file_key": file_key}
        )

        documents = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]

        if not documents:
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "answer": "I couldn't find any relevant information.",
                    "sources": [],
                    "confidence": 0.0
                })
            }

        # 3. Create prompt
        prompt = get_qa_prompt(question, documents)

        # 4. Generate answer using LLM
        answer = call_bedrock_llm(prompt)

        # 5. Format response with source metadata
        sources = []
        for i, chunk in enumerate(documents):
            sources.append({
                "content": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                "similarity": 0.9 - i * 0.1,  # pseudo-score
                "chunk_index": i,
                "metadata": metadatas[i]
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
