import os

OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST")  # e.g., https://search-xyz.region.es.amazonaws.com
OPENSEARCH_INDEX = os.getenv("OPENSEARCH_INDEX", "meeting-index")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
