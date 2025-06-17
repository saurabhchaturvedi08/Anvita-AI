def get_embedding(text):
    # Replace with Titan or Claude embeddings
    import hashlib
    return [hashlib.md5(text.encode()).hexdigest()]  # dummy for now
