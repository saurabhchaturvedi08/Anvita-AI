import boto3
import os
import json

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
