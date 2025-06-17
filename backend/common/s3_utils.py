import boto3
import os

s3 = boto3.client("s3")

def generate_presigned_url(file_id, bucket, expires=900):
    return s3.generate_presigned_post(
        Bucket=bucket,
        Key=file_id,
        ExpiresIn=expires
    )

def read_json(bucket, key):
    obj = s3.get_object(Bucket=bucket, Key=key)
    return obj["Body"].read().decode("utf-8")
