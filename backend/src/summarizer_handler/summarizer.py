import boto3
import json
import os
import requests
import chromadb

s3 = boto3.client('s3')

# Environment variables
BUCKET_NAME = os.environ.get('BUCKET_NAME')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Gemini 2.0 Flash endpoint
GEMINI_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# ChromaDB setup
# CHROMA_PATH = "/tmp/chromadb"
CHROMA_PATH = os.environ.get("CHROMA_PATH", "./chromadb_local")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="documents")

def call_gemini_llm(prompt, max_tokens=2048):
    """Call Gemini 2.0 Flash API for summarization."""
    try:
        response = requests.post(
            GEMINI_GENERATE_URL,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": 0.7
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise RuntimeError(f"Gemini API call failed: {str(e)}")

def get_summary_prompt(chunks):
    context_text = "\n\n".join(chunks)
    return f"""You are an expert at summarizing any kind of content.
Summarize the following text in a clear, concise, and well-structured manner.

Highlight:
- Main topics or themes
- Important facts or insights
- Any conclusions or implications

Content:
{context_text}
"""


def lambda_handler(event, context):
    """Lambda handler for document summarization using ChromaDB + Gemini"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        file_key = query_params.get('file_key')
        
        if not file_key:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing file_key parameter"})
            }

        # Retrieve all chunks for this file from ChromaDB
        results = collection.get(where={"file_key": file_key})
        documents = results.get('documents', [])
        
        if not documents:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "error": "No chunks found in ChromaDB for this file_key",
                    "message": "Document may not have been processed yet"
                })
            }

        # Create prompt from retrieved chunks
        prompt = get_summary_prompt(documents)

        # Generate summary via Gemini
        summary = call_gemini_llm(prompt, max_tokens=2048)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "summary": summary,
                "file_key": file_key,
                "chunk_count": len(documents),
                "summary_length": len(summary)
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to generate summary"
            })
        }


if __name__ == "__main__":
    # Replace this with the file_key you used during embedding
    test_event = {
        "queryStringParameters": {
            "file_key": "uploads/1755365257_7babd472-1423-40ce-b9dd-b0716290031e_example.pdf"
        }
    }

    response = lambda_handler(test_event, None)
    print("Summary========>")
    print(json.dumps(json.loads(response["body"]), indent=2))