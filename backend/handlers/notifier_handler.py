import boto3
import json
import os
import requests

s3 = boto3.client('s3')
ses = boto3.client('ses')

def lambda_handler(event, context):
    bucket = event['bucket']
    summary_key = event['summary_key']
    recipient_email = event['recipient_email']

    # 1. Load summary from S3
    summary_obj = s3.get_object(Bucket=bucket, Key=summary_key)
    summary_data = json.loads(summary_obj['Body'].read())
    summary_text = summary_data.get("summary", "Summary not found.")
    transcript_source = summary_data.get("source", "N/A")

    # 2. Prepare email content
    subject = "📋 Your Meeting Summary is Ready!"
    body_text = f"""
Hello,

Here is the summary of your meeting (source: {transcript_source}):

{summary_text}

Thanks,
Smart Meeting Summarizer
"""

    # 3. Send Email via SES
    sender = os.environ.get("SENDER_EMAIL")
    ses.send_email(
        Source=sender,
        Destination={"ToAddresses": [recipient_email]},
        Message={
            "Subject": {"Data": subject},
            "Body": {"Text": {"Data": body_text}}
        }
    )

    # 4. Optional: Send to Slack
    slack_url = os.environ.get("SLACK_WEBHOOK_URL")
    if slack_url:
        requests.post(
            slack_url,
            json={"text": f"*New Meeting Summary*\n{summary_text}"}
        )

    return {
        "statusCode": 200,
        "message": f"Notification sent to {recipient_email} (and Slack if configured)."
    }
