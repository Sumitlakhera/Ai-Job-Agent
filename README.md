## AI Job Agent

AI Job Agent is a full-stack application that helps candidates evaluate job opportunities against their resume. The platform parses resume data, extracts skills and experience, fetches relevant job listings, and generates match insights using AI-assisted analysis. It combines a Flask backend with a React frontend to provide an interactive workflow for resume upload, job search, and fit evaluation.

### Features

- Upload and parse resume PDFs
- Extract structured resume insights such as skills, experience, and projects
- Search for relevant job opportunities by role and location
- Compare resume skills with job requirements using semantic and fallback matching
- Display matched skills, missing skills, fit scores, and short AI-generated explanations

### Tech Stack

- Frontend: React, Axios, Tailwind CSS, Vanta.js
- Backend: Flask, Flask-CORS, python-dotenv
- AI services: Groq API, sentence-transformers
- Utilities: pdfplumber, requests

### Project Structure

```text
Ai-job-agent/
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── services/
│   └── utils/
├── frontend/
│   ├── public/
│   └── src/
└── README.md
```

### How It Works

1. A user uploads a resume PDF in the frontend.
2. The backend extracts text from the PDF and uses the Groq API to return structured resume data.
3. The user searches for jobs by title and location.
4. The backend fetches job listings, extracts relevant job skills, and compares them against the parsed resume.
5. The frontend displays ranked opportunities with fit explanations and skill gaps.

### Environment Variables

Create a `.env` file inside `/backend` with:

```env
GROQ_API_KEY=your_groq_api_key
SERP_API_KEY=your_serpapi_key
```

### Local Setup

#### Backend

From `/Users/omega/Ai-job-agent/backend`:

```bash
python -m venv venv
source venv/bin/activate
pip install flask flask-cors python-dotenv groq requests pdfplumber sentence-transformers torch
python app.py
```

The backend runs on `http://localhost:5001`.

#### Frontend

From `/Users/omega/Ai-job-agent/frontend`:

```bash
npm install
npm start
```

The frontend runs on `http://localhost:3000`.

### API Endpoints

- `POST /parse-resume`
  Upload a resume PDF and receive structured resume data plus a text preview.

- `GET /jobs?query=<role>&location=<city>`
  Fetch job listings and return ranked matches based on resume-job skill overlap.

### Notes

- Semantic matching uses `sentence-transformers` when available.
- If the embedding model cannot be loaded, the backend falls back to a simpler rule-based match so the app can still run.
- Cached resume and job data are stored in `backend/resume_cache.json` and `backend/job_cache.json`.

### Future Improvements

- Add user authentication and saved sessions
- Support resume versioning and multiple uploads
- Improve error handling and loading states
- Add deployment configuration for production hosting
