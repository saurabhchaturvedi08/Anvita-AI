import boto3, json, os
bedrock = boto3.client("bedrock-runtime")

def summarize(text):
    prompt = f"Summarize this:\n\n{text}\n\nSummary:"
    resp = bedrock.invoke_model(
        modelId=os.getenv("BEDROCK_MODEL"),
        body=json.dumps({"prompt": prompt, "max_tokens_to_sample": 512}),
        contentType="application/json",
        accept="application/json"
    )
    return json.loads(resp["body"].read())["completion"].strip()

def embed(text):
    resp = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v1",
        body=json.dumps({"inputText": text}),
        contentType="application/json",
        accept="application/json"
    )
    return json.loads(resp["body"].read())["embedding"]
