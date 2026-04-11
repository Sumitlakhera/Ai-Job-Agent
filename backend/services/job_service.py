import requests
import urllib.parse

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
        for job in data["jobs_results"]:
            apply_link = None

            if "related_links" in job and len(job["related_links"]) > 0:
                apply_link = job["related_links"][0].get("link")
            
            if not apply_link:
                title = job.get("title", "")
                company = job.get("company_name", "")
                query = f"{title} {company} apply"
                encoded_query = urllib.parse.quote(query)
    
                apply_link = f"https://www.google.com/search?q={encoded_query}"


            jobs.append({
                "title": job.get("title"),
                "company": job.get("company_name"),
                "location": job.get("location"),
                "description": job.get("description"),
                "apply_link": apply_link
            })

    return jobs