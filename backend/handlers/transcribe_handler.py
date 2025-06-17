import boto3
import os

transcribe = boto3.client('transcribe')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    job_name = key.split('/')[-1].replace('.', '-')

    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': f's3://{bucket}/{key}'},
        MediaFormat=key.split('.')[-1],
        LanguageCode='en-US',
        OutputBucketName=bucket
    )

    return {
        'statusCode': 200,
        'body': f'Started transcription job for {key}'
    }
