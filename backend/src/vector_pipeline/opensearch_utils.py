import boto3
import requests
import json
import os
from requests_aws4auth import AWS4Auth
from config import OPENSEARCH_HOST, OPENSEARCH_INDEX, AWS_REGION

session = boto3.Session()
credentials = session.get_credentials()
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    AWS_REGION,
    "es",
    session_token=credentials.token,
)

HEADERS = {"Content-Type": "application/json"}

def create_index_if_not_exists(dim=1536):
    url = f"{OPENSEARCH_HOST}/{OPENSEARCH_INDEX}"
    res = requests.head(url, auth=awsauth)
    if res.status_code == 404:
        mapping = {
            "settings": {
                "index.knn": True
            },
            "mappings": {
                "properties": {
                    "text": {"type": "text"},
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": dim
                    },
                    "metadata": {"type": "object"}
                }
            }
        }
        requests.put(url, auth=awsauth, headers=HEADERS, data=json.dumps(mapping))

def upsert_doc(doc_id, text, embedding, metadata):
    doc = {
        "text": text,
        "embedding": embedding,
        "metadata": metadata
    }
    url = f"{OPENSEARCH_HOST}/{OPENSEARCH_INDEX}/_doc/{doc_id}"
    return requests.put(url, auth=awsauth, headers=HEADERS, data=json.dumps(doc))

def search_similar(embedding, top_k=3):
    url = f"{OPENSEARCH_HOST}/{OPENSEARCH_INDEX}/_search"
    body = {
        "size": top_k,
        "query": {
            "knn": {
                "embedding": {
                    "vector": embedding,
                    "k": top_k
                }
            }
        }
    }
    res = requests.post(url, auth=awsauth, headers=HEADERS, data=json.dumps(body))
    return res.json()
