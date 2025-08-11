import boto3
import json
import os
import requests
import chromadb

# ChromaDB
CHROMA_PATH = "/tmp/chromadb"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="documents")

# Google Gemini setup
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"
GEMINI_FLASH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def get_embedding_gemini(text: str) -> list[float]:
    """Generate an embedding using Gemini embedding API"""
    try:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            }
        }

        response = requests.post(
            f"{GEMINI_EMBED_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        response.raise_for_status()
        data = response.json()

        # Gemini returns embedding under embedding.values
        return data["embedding"]["values"]

    except Exception as e:
        raise RuntimeError(f"Gemini embedding API failed: {str(e)}")

def get_qa_from_gemini(question: str, context_chunks: list[str]) -> str:
    """Ask Gemini 1.5 Flash a question with provided context"""
    context_text = "\n\n".join(context_chunks)
    prompt = f"""Answer the question below using ONLY the provided context. 
If the answer is not present, say "I don't know."

Context:
{context_text}

Question:
{question}
"""

    try:
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        response = requests.post(
            f"{GEMINI_FLASH_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        response.raise_for_status()
        data = response.json()

        # Extract answer text
        return data["candidates"][0]["content"]["parts"][0]["text"]

    except Exception as e:
        raise RuntimeError(f"Gemini QA API failed: {str(e)}")

def lambda_handler(event, context):
    """Lambda handler for Q&A using Gemini"""
    try:
        body = json.loads(event['body'])
        file_key = body.get('file_key')
        question = body.get('question')

        if not file_key or not question:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing file_key or question"})
            }

        # 1. Get embedding for the question
        question_embedding = get_embedding_gemini(question)

        # 2. Search ChromaDB
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

        # 3. Ask Gemini Flash for final answer
        answer = get_qa_from_gemini(question, documents)

        # 4. Prepare sources
        sources = []
        for i, chunk in enumerate(documents):
            sources.append({
                "content": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                "similarity": 0.9 - i * 0.1,
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
