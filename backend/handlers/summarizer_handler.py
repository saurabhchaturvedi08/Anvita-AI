import boto3
import json
import os
from utils.prompts import get_summary_prompt

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

def lambda_handler(event, context):
    bucket = event['bucket']
    transcript_key = event['transcript_key']
    summary_key = transcript_key.replace('transcripts/', 'summaries/').replace('.json', '_summary.json')

    # Step 1: Load transcript text from S3
    transcript_obj = s3.get_object(Bucket=bucket, Key=transcript_key)
    transcript_data = json.loads(transcript_obj['Body'].read())
    transcript_text = transcript_data.get("transcript", "")

    # Step 2: Format prompt
    prompt = get_summary_prompt(transcript_text)

    # Step 3: Call Bedrock model
    response = bedrock.invoke_model(
        modelId=os.environ.get("BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0"),
        body=json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": 1024,
            "temperature": 0.7,
            "top_k": 250,
            "top_p": 1.0,
            "stop_sequences": ["\n\nHuman:"]
        }),
        contentType="application/json",
        accept="application/json"
    )

    model_output = json.loads(response['body'].read())
    summary_text = model_output.get('completion', '').strip()

    # Step 4: Save summary to S3
    s3.put_object(
        Bucket=bucket,
        Key=summary_key,
        Body=json.dumps({
            "summary": summary_text,
            "source": transcript_key
        }),
        ContentType='application/json'
    )

    return {
        "statusCode": 200,
        "summary_key": summary_key,
        "message": "Summary generated and saved."
    }
