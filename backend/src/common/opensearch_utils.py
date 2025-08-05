from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import os
import boto3

region = os.environ.get("AWS_REGION") 
service = 'es'

# Get credentials from the Lambda role (or IAM user if running locally)
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key,
                   credentials.secret_key,
                   region,
                   service,
                   session_token=credentials.token)

OPENSEARCH_HOST = os.environ.get("OPENSEARCH_HOST")
OPENSEARCH_INDEX = os.environ.get("OPENSEARCH_INDEX")

client = OpenSearch(
    hosts=[{"host": OPENSEARCH_HOST, "port": 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

def create_index():
    """
    Create an OpenSearch index for vector search with the correct mapping.
    Run this once before using the pipeline.
    """
    if client.indices.exists(OPENSEARCH_INDEX):
        print(f"Index {OPENSEARCH_INDEX} already exists.")
        return
    mapping = {
        "mappings": {
            "properties": {
                "embedding": {
                    "type": "knn_vector",
                    "dimension": 1536,  # Titan returns 1536-dim vectors
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib"
                    }
                },
                "chunk": {"type": "text"},
                "file_key": {"type": "keyword"},
                "chunk_id": {"type": "integer"}
            }
        }
    }
    client.indices.create(index=OPENSEARCH_INDEX, body=mapping)
    print(f"Index {OPENSEARCH_INDEX} created.")

def store_embedding(embedding, chunk, metadata):
    doc = {
        "embedding": embedding,
        "chunk": chunk,
        **metadata
    }
    client.index(index=OPENSEARCH_INDEX, body=doc)

def query_vector_db(embedding, filter, top_k=5):
    query = {
        "size": top_k,
        "query": {
            "bool": {
                "filter": [
                    {"term": {"file_key": filter["file_key"]}}
                ],
                "must": [
                    {
                        "knn": {
                            "embedding": {
                                "vector": embedding,
                                "k": top_k
                            }
                        }
                    }
                ]
            }
        }
    }
    response = client.search(index=OPENSEARCH_INDEX, body=query)
    return [hit["_source"]["chunk"] for hit in response["hits"]["hits"]]
