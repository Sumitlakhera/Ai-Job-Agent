from utils.pdf_parser import extract_text_from_pdf
from groq import Groq
import os

def parse_resume(file):
    api_key = os.getenv("GROQ_API_KEY")
    print("DEBUG API KEY:", api_key) 

    client = Groq(api_key=api_key)

    text = extract_text_from_pdf(file)

    prompt = f"""
    Extract the following from this resume:

    1. Skills
    2. Experience
    3. Projects

    Return STRICT JSON:
    {{
        "skills": [],
        "experience": [],
        "projects": []
    }}

    Resume:
    {text}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return {
        "structured_data": response.choices[0].message.content,
        "preview": text[:500]
    }