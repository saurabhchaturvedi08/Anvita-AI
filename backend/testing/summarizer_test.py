import boto3
import json

lambda_client = boto3.client("lambda")

response = lambda_client.invoke(
    FunctionName="anvita-ai-services-SummarizeLambdaFunction-UMtVFPJTrLR7",   # change to your function name
    InvocationType="RequestResponse",
    Payload=json.dumps({
        "queryStringParameters": {"file_key": "uploads/1754921165_fa63225d-ab4e-40c9-8beb-8378c3af52a8_test.pdf"}
    })
)

print("Summary========>")
print(json.loads(response["Payload"].read().decode("utf-8")))
