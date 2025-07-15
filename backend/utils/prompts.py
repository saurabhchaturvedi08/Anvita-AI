def get_summary_prompt(transcript):
    return f"""Human: You are an expert meeting assistant. Please summarize the following meeting transcript in a concise and clear format. Highlight key discussion points, action items, and decisions made.

Meeting Transcript:
{transcript}

Assistant:"""



def get_qa_prompt(user_query, context_chunks):
    context_text = "\n\n".join(context_chunks)
    return f"""Human: Answer the question below using only the information provided.

Context:
{context_text}

Question: {user_query}

Assistant:"""
