from opensearchpy import OpenSearch
import os

OPENSEARCH_HOST = os.environ.get("OPENSEARCH_HOST", "your-opensearch-endpoint")
OPENSEARCH_INDEX = os.environ.get("OPENSEARCH_INDEX", "documents")
OPENSEARCH_USER = os.environ.get("OPENSEARCH_USER", "admin")
OPENSEARCH_PASS = os.environ.get("OPENSEARCH_PASS", "admin")

client = OpenSearch(
    hosts=[{"host": OPENSEARCH_HOST, "port": 443}],
    http_auth=(OPENSEARCH_USER, OPENSEARCH_PASS),
    use_ssl=True,
    verify_certs=True,
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
