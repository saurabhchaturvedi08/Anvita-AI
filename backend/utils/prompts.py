def get_summary_prompt(transcript):
    return f"""Human: You are an expert meeting assistant. Please summarize the following meeting transcript in a concise and clear format. Highlight key discussion points, action items, and decisions made.

Meeting Transcript:
{transcript}

Assistant:"""
