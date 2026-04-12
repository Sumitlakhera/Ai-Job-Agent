from utils.pdf_parser import extract_text_from_pdf
from groq import Groq
import os
import json

USER_RESUME_DATA = {}

def parse_resume(file):
    api_key = os.getenv("GROQ_API_KEY")

    client = Groq(api_key=api_key)

    text = extract_text_from_pdf(file)

    prompt = f"""
    Extract the following from this resume:

    1. Skills
    2. Experience
    3. Projects

    Return ONLY valid JSON. Do NOT include markdown, backticks, or explanation:
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

    raw_output = response.choices[0].message.content

    cleaned_output = raw_output.replace("```json", "").replace("```", "").strip()

    try:
        structured_data = json.loads(cleaned_output)
    except Exception as e:
        structured_data = {
        "error": "Failed to parse JSON",
        "raw_output": raw_output
    }
    
    raw_skills = structured_data.get("skills", [])

    # normalize: lowercase + strip spaces
    normalized_skills = [skill.lower().strip() for skill in raw_skills]

    USER_RESUME_DATA["skills"] = list(set(normalized_skills))

    print("DEBUG: Stored Skills:", USER_RESUME_DATA["skills"])

    return {
    "structured_data": structured_data,
    "preview": text[:500]
    }