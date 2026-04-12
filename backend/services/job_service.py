import requests
import urllib.parse
from groq import Groq
import os
import json
from services.resume_service import USER_RESUME_DATA

def extract_skills_with_llm(text):
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)

    prompt = f"""
    Extract key skills required for this job.

    Return ONLY a valid JSON array of skills.
    No explanation, no markdown.

    Example:
    ["python", "sql", "machine learning"]

    Job Description:
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
        skills = json.loads(cleaned_output)
    except:
        skills = []

    # normalize
    skills = [s.lower().strip() for s in skills]

    return list(set(skills))

def calculate_match(resume_skills, job_skills):
    if not job_skills:
        return 0, [], []

    resume_set = set(resume_skills)
    job_set = set(job_skills)

    matched = list(resume_set.intersection(job_set))
    missing = list(job_set - resume_set)

    score = (len(matched) / len(job_set)) * 100

    return round(score, 2), matched, missing


def fetch_jobs(query, location):
    url = "https://serpapi.com/search"

    params = {
        "engine": "google_jobs",
        "q": query,
        "location": location,
        "api_key": "dfe5675bb6e58c4521b8852f13e780773242ec357427d37ccfa3b6045013ef9a"   # temporary (we'll move to .env later)
    }

    response = requests.get(url, params=params)
    data = response.json()

    jobs = []

    if "jobs_results" in data:
        job_results = data["jobs_results"][:5]  # limit to top 5 jobs
        for job in job_results:
            apply_link = None

            if "related_links" in job and len(job["related_links"]) > 0:
                apply_link = job["related_links"][0].get("link")
            
            if not apply_link:
                title = job.get("title", "")
                company = job.get("company_name", "")
                query = f"{title} {company} apply"
                encoded_query = urllib.parse.quote(query)
    
                apply_link = f"https://www.google.com/search?q={encoded_query}"

            description = job.get("description", "")
            title = job.get("title", "")

            combined_text = f"{title} {description}"

            job_skills = extract_skills_with_llm(combined_text)

            resume_skills = USER_RESUME_DATA.get("skills", [])

            match_score, matched_skills, missing_skills = calculate_match(
                resume_skills,
                job_skills
            )

            print("DEBUG MATCH:", match_score, matched_skills)

            jobs.append({
                "title": title,
                "company": job.get("company_name"),
                "location": job.get("location"),
                "description": description,
                "job_skills": job_skills,
                "resume_skills": resume_skills,
                "match_score": match_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "apply_link": apply_link
            })

    return jobs