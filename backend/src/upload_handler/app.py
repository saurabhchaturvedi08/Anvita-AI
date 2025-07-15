import boto3
import os
import json
import uuid
import time

s3 = boto3.client('s3')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
MAX_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', '10'))
ALLOWED_TYPES = set(os.environ.get('ALLOWED_FILE_TYPES', '').split(','))

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        file_name = body.get("fileName")
        file_type = body.get("fileType")
        file_size = int(body.get("fileSize", 0))

        if not file_name or not file_type:
            return respond(400, "Missing fileName or fileType")

        if file_type not in ALLOWED_TYPES:
            return respond(400, f"Unsupported file type: {file_type}")

        if file_size > MAX_SIZE_MB * 1024 * 1024:
            return respond(400, f"File too large. Max {MAX_SIZE_MB}MB allowed.")

        key = f"uploads/{int(time.time())}_{uuid.uuid4()}_{file_name.replace(' ', '_')}"
        url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': key,
                'ContentType': file_type
            },
            ExpiresIn=300  # 5 minutes
        )

        return respond(200, {
            "uploadUrl": url,
            "fileKey": key,
            "publicUrl": f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"
        })

    except Exception as e:
        return respond(500, str(e))

def respond(status, body):
    return {
        "statusCode": status,
        "headers": { "Content-Type": "application/json" },
        "body": json.dumps(body)
    }
