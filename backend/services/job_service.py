import requests
import urllib.parse
from groq import Groq
import os
import json
import re
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def load_resume_data():
    try:
        with open("resume_cache.json", "r") as f:
            return json.load(f)
    except:
        return {"skills": []}
    
def load_job_cache():
    try:
        with open("job_cache.json", "r") as f:
            return json.load(f)
    except:
        return {}

def save_job_cache(cache):
    with open("job_cache.json", "w") as f:
        json.dump(cache, f, indent=2)

def normalize_and_split_skills(skills):
    normalized = []

    for skill in skills:
        skill = skill.lower()
        skill = skill.replace("-", " ")

        # replace separators with comma
        skill = re.sub(r"[&/|+]", ",", skill)

        # split into parts
        parts = [s.strip() for s in skill.split(",") if s.strip()]

        normalized.extend(parts)

    return list(set(normalized))

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

def semantic_match(resume_skills, job_skills, threshold=0.6):
    if not job_skills:
        return 0, [], []

    resume_skills = normalize_and_split_skills(resume_skills)
    job_skills = normalize_and_split_skills(job_skills)

    matched = []
    missing = []

    resume_embeddings = model.encode(resume_skills, convert_to_tensor=True)
    job_embeddings = model.encode(job_skills, convert_to_tensor=True)

    for i, job_emb in enumerate(job_embeddings):
        similarities = util.cos_sim(job_emb, resume_embeddings)[0]

        max_score = similarities.max().item()

        if max_score >= threshold:
            matched.append(job_skills[i])
        else:
            missing.append(job_skills[i])

    score = (len(matched) / len(job_skills)) * 100 if job_skills else 0

    return round(score, 2), list(set(matched)), list(set(missing))

def calculate_match(resume_skills, job_skills):
    if not job_skills:
        return 0, [], []

    resume_skills = normalize_and_split_skills(resume_skills)
    job_skills = normalize_and_split_skills(job_skills)

    matched = []
    missing = []

    for job_skill in job_skills:
        found = False

        for res_skill in resume_skills:
            # flexible matching (partial + containment)
            if job_skill in res_skill or res_skill in job_skill:
                matched.append(job_skill)
                found = True
                break

        if not found:
            missing.append(job_skill)

    score = (len(matched) / len(job_skills)) * 100 if job_skills else 0

    return round(score, 2), list(set(matched)), list(set(missing))



def generate_batch_explanations(jobs):
    try:
        api_key = os.getenv("GROQ_API_KEY")
        client = Groq(api_key=api_key)

        prompt = f"""
        You are an AI career assistant.

        For EACH job below, independently evaluate the candidate fit.

        STRICT RULES:
            - Each job MUST be evaluated independently
            - DO NOT compare jobs with each other
            - DO NOT reference other jobs
            - DO NOT say "similar to", "compared to", etc.

        For each job:
            - Start with Strong / Moderate / Low fit
            - Mention 2 to 3 matched skills
            - Mention 1 to 2 important missing skills (if any)
            - Be specific, not generic
            - Max 2 sentences

        Return ONLY valid JSON list:
        [
            {{"title": "...", "explanation": "..."}}
        ]

        Jobs:
        {json.dumps(jobs, indent=2)}
        """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.choices[0].message.content
        cleaned = raw.replace("```json", "").replace("```", "").strip()

        return json.loads(cleaned)

    except Exception as e:
        print("DEBUG BATCH ERROR:", str(e))
        return []


def fetch_jobs(query, location):
    job_cache = load_job_cache()
    url = "https://serpapi.com/search"

    search_query = f"{query} jobs"
    params = {
        "engine": "google_jobs",
        "q": search_query,
        "location": location.title(),
        "api_key": os.getenv("SERP_API_KEY") 
    }

    response = requests.get(url, params=params)
    data = response.json()
    print("DEBUG: API KEYS:", data.keys())
    print("DEBUG: JOB COUNT:", len(data.get("jobs_results", [])))
    print("DEBUG ERROR:", data.get("error"))

    jobs = []

    if "jobs_results" in data:
        job_results = data["jobs_results"][:5]  # limit to top 5 jobs
        resume_data = load_resume_data()
        resume_skills = resume_data.get("skills", [])

        for job in job_results:
            print("DEBUG: PROCESSING JOB:", job.get("title"))
            apply_link = None

            if "related_links" in job and len(job["related_links"]) > 0:
                apply_link = job["related_links"][0].get("link")
            
            if not apply_link:
                title = job.get("title", "")
                company = job.get("company_name", "")
                search_query = f"{title} {company} apply"
                encoded_query = urllib.parse.quote(search_query)
    
                apply_link = f"https://www.google.com/search?q={encoded_query}"

            description = job.get("description", "")
            title = job.get("title", "")

            combined_text = f"{title} {description}"

            cache_key = f"{title}_{job.get('company_name')}"

            if cache_key in job_cache:
                print("DEBUG: CACHE HIT:", cache_key)
                job_skills = job_cache[cache_key]
            else:
                print("DEBUG: CACHE MISS:", cache_key)
                job_skills = extract_skills_with_llm(combined_text)
                job_cache[cache_key] = job_skills

            print("DEBUG: JOB SKILLS:", job_skills)

            if not resume_skills:
                match_score, matched_skills, missing_skills = 0, [], job_skills
            else:
                try:
                    match_score, matched_skills, missing_skills = semantic_match(
                        resume_skills,
                        job_skills
                    )
                except Exception as e:
                    print("DEBUG: SEMANTIC MATCH FAILED:", str(e))
    
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
        
        jobs_for_llm = [
            {
                "title": job["title"],
                "match_score": job["match_score"],
                "matched_skills": job["matched_skills"],
                "missing_skills": job["missing_skills"]
            }
            for job in jobs
        ]

        batch_results = generate_batch_explanations(jobs_for_llm)

        explanation_map = {j["title"]: j["explanation"] for j in batch_results}

        for job in jobs:
            job["explanation"] = explanation_map.get(job["title"], "No explanation available")

            
    # sort jobs by match_score (highest first)
    jobs = sorted(jobs, key=lambda x: x["match_score"], reverse=True)
    save_job_cache(job_cache)
    return jobs