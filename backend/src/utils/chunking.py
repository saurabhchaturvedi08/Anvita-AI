import textwrap

def chunk_text(text, max_tokens=300):
    """
    Splits a long string into smaller chunks (~max_tokens words).
    Approximate: assumes 1 word ~ 1 token.
    """
    words = text.split()
    chunks = [
        " ".join(words[i:i+max_tokens])
        for i in range(0, len(words), max_tokens)
    ]
    return chunks
