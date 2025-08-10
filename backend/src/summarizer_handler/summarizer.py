import boto3
import json
import os

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

BEDROCK_LLM_MODEL = os.environ.get('BEDROCK_LLM_MODEL', 'anthropic.claude-3-sonnet-20240229-v1:0')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def call_bedrock_llm(prompt, max_tokens=1024):
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

def get_summary_prompt(transcript):
    return f"""Human: You are an expert meeting assistant. Please summarize the following meeting transcript in a concise and clear format. Highlight key discussion points, action items, and decisions made.

    Meeting Transcript:
    {transcript}

    Assistant:"""

def lambda_handler(event, context):
    """Lambda handler for document summarization"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {})
        bucket = query_params.get('bucket', BUCKET_NAME)
        file_key = query_params.get('file_key')
        
        if not file_key:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "error": "Missing file_key parameter"
                })
            }
        
        # 1. Construct text file key from file key
        text_key = file_key.replace("uploads/", "texts/").rsplit('.', 1)[0] + ".txt"
        
        # 2. Load extracted text from S3
        try:
            obj = s3.get_object(Bucket=bucket, Key=text_key)
            extracted_text = obj['Body'].read().decode('utf-8')
        except Exception as e:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "error": f"Text file not found: {text_key}",
                    "message": "Document may still be processing"
                })
            }
        
        # 3. Create summary prompt
        prompt = get_summary_prompt(extracted_text)
        
        # 4. Generate summary using LLM
        summary = call_bedrock_llm(prompt, max_tokens=1024)
        
        # 5. Return summary
        return {
            "statusCode": 200,
            "body": json.dumps({
                "summary": summary,
                "file_key": file_key,
                "text_length": len(extracted_text),
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