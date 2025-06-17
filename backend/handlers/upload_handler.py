import uuid, json, os
from common.s3_utils import generate_presigned_url
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.getenv("FILES_TABLE"))
INPUT_BUCKET = os.getenv("INPUT_BUCKET")

def lambda_handler(event, context):
    body = json.loads(event["body"])
    user_id = event.get("requestContext", {}).get("authorizer", {}).get("claims", {}).get("sub", "anon")
    file_url = body.get("s3_url")

    if file_url:
        file_id = file_url.split("/")[-1]
    else:
        file_id = f"{uuid.uuid4()}.mp4"  # or preserve extension from body

    presign = None
    if not file_url:
        presign = generate_presigned_url(file_id, INPUT_BUCKET)

    # Record metadata
    table.put_item(Item={
        "userId": user_id,
        "fileId": file_id,
        "status": "UPLOADING"
    })

    return {
        "statusCode": 200,
        "body": json.dumps({"fileId": file_id, "presign": presign, "existingUrl": file_url})
    }
