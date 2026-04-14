import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import NET from 'vanta/dist/vanta.net.min';


const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const initialResumeData = {
  skills: [],
  experience: [],
  projects: [],
};

function normalizeResumeData(data) {
  return {
    skills: Array.isArray(data?.skills) ? data.skills : [],
    experience: Array.isArray(data?.experience) ? data.experience : [],
    projects: Array.isArray(data?.projects) ? data.projects : [],
  };
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [resumePreview, setResumePreview] = useState('');
  const [resumeData, setResumeData] = useState(initialResumeData);
  const [jobs, setJobs] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const backgroundRef = useRef(null);
  const vantaEffectRef = useRef(null);


  const hasResumeInsights =
    resumeData.skills.length > 0 ||
    resumeData.experience.length > 0 ||
    resumeData.projects.length > 0;

  async function handleResumeUpload(event) {
    event.preventDefault();

    if (!resumeFile) {
      setUploadError('Choose a resume PDF before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/parse-resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResumeData(
        normalizeResumeData(response.data.structured_data || initialResumeData)
      );
      setResumePreview(response.data.preview || '');
    } catch (error) {
      setUploadError(
        getErrorMessage(error, 'Unable to parse the resume right now.')
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleJobSearch(event) {
    event.preventDefault();

    if (!query.trim() || !location.trim()) {
      setSearchError('Enter both a job title and a location.');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        params: {
          query: query.trim(),
          location: location.trim(),
        },
      });

      setJobs(response.data.jobs || []);
    } catch (error) {
      setJobs([]);
      setSearchError(
        getErrorMessage(error, 'Unable to fetch jobs right now.')
      );
    } finally {
      setIsSearching(false);
    }
  }

    useEffect(() => {
    if (!backgroundRef.current || vantaEffectRef.current) return;

    vantaEffectRef.current = NET({
      el: backgroundRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      color: 0xfbbf24,
      backgroundColor: 0x0c0a09,
      points: 8,
      maxDistance: 20,
      spacing: 20,
      showDots: true,
    });

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, []);


  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
    <div
      ref={backgroundRef}
      className="absolute inset-0 z-0"
    />
    <div className="absolute inset-0 z-0 bg-stone-950/70" />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-3 py-5 sm:px-4 lg:px-6">
        <header className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_20%),linear-gradient(135deg,_rgba(28,25,23,0.96),_rgba(12,10,9,0.98))] px-5 py-5 shadow-2xl shadow-amber-950/20 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80">
                AI Job Agent
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight text-stone-50 sm:text-3xl lg:text-[2.5rem]">
                Resume parsing and job matching in one workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300 sm:text-base">
                Upload a resume, inspect extracted skills and experience, then search matched roles without the page wasting space.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <MetricCard label="Skills" value={resumeData.skills.length} />
              <MetricCard label="Projects" value={resumeData.projects.length} />
              <MetricCard label="Jobs" value={jobs.length} />
            </div>
          </div>
        </header>

        <main className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.35fr] xl:items-start">
          <section className="space-y-4 xl:sticky xl:top-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-stone-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-50 sm:text-2xl">
                    1. Parse Resume
                  </h2>
                  <p className="mt-1 text-sm text-stone-400">
                    Upload a PDF to extract skills, experience, and projects.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Resume
                </span>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleResumeUpload}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-300">
                    Resume PDF
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(event) =>
                      setResumeFile(event.target.files?.[0] || null)
                    }
                    className="block w-full rounded-2xl border border-dashed border-stone-700 bg-stone-950/80 px-4 py-3 text-sm text-stone-300 file:mr-4 file:rounded-full file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-stone-950 hover:file:bg-amber-300"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-950/30 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isUploading ? 'Parsing resume...' : 'Upload and parse resume'}
                </button>
              </form>

              {uploadError ? (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {uploadError}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InsightBlock
                  title="Skills"
                  items={resumeData.skills}
                  emptyMessage="Parsed skills will show up here."
                />
                <InsightBlock
                  title="Experience"
                  items={resumeData.experience}
                  emptyMessage="Experience highlights will appear after parsing."
                />
                <InsightBlock
                  title="Projects"
                  items={resumeData.projects}
                  emptyMessage="Projects extracted from the resume will appear here."
                  className="sm:col-span-2"
                />
              </div>

              {resumePreview ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-stone-950/80 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
                    Resume Preview
                  </h3>
                  <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap pr-2 text-sm leading-6 text-stone-300">
                    {resumePreview}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-amber-400/15 via-stone-900 to-stone-900 p-5 shadow-xl shadow-black/20">
              <h2 className="text-xl font-bold text-stone-50 sm:text-2xl">
                2. Search Matched Jobs
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                Search works best after parsing a resume, but you can explore roles anytime.
              </p>

              <form className="mt-5 grid gap-4 md:grid-cols-[1.25fr_1fr_auto]" onSubmit={handleJobSearch}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-300">
                    Job title or keyword
                  </span>
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Frontend developer, Python engineer, data analyst..."
                    className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-300 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-300">
                    Location
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Bengaluru, Remote, Hyderabad..."
                    className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-300 focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="inline-flex items-center justify-center self-end rounded-full border border-white/10 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-stone-300 md:min-w-[190px]"
                >
                  {isSearching ? 'Finding jobs...' : 'Find matching jobs'}
                </button>
              </form>

              {searchError ? (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {searchError}
                </p>
              ) : null}

              {!hasResumeInsights ? (
                <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  Uploading a resume first will give you real match scores and missing-skill analysis.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-stone-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur xl:max-h-[calc(100vh-7.25rem)] xl:overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-50 sm:text-2xl">
                  Matched Opportunities
                </h2>
                <p className="mt-1 text-sm text-stone-400">
                  Results are sorted by the strongest skill overlap first.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                {jobs.length} jobs
              </span>
            </div>

            <div className="mt-5 space-y-4 xl:max-h-[calc(100vh-13rem)] xl:overflow-y-auto xl:pr-2">
              {isSearching ? (
                <JobSkeletonList />
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <article
                    key={`${job.title}-${job.company}`}
                    className="rounded-[1.4rem] border border-white/10 bg-stone-950/70 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-stone-50 sm:text-xl">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm text-stone-400">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                        Match {job.match_score}%
                      </div>
                    </div>

                    {job.explanation ? (
                      <p className="mt-4 text-sm leading-6 text-stone-300">
                        {job.explanation}
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <TagSection
                        title="Matched Skills"
                        items={job.matched_skills}
                        tone="emerald"
                        emptyMessage="No matched skills identified yet."
                      />
                      <TagSection
                        title="Missing Skills"
                        items={job.missing_skills}
                        tone="amber"
                        emptyMessage="No obvious gaps were found."
                      />
                    </div>

                    {job.description ? (
                      <details className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-stone-200">
                          View job description
                        </summary>
                        <p className="mt-3 max-h-56 overflow-y-auto pr-2 text-sm leading-6 text-stone-300">
                          {job.description}
                        </p>
                      </details>
                    ) : null}

                    {job.apply_link ? (
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
                      >
                        Open application link
                      </a>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-stone-950/60 p-8 text-center">
                  <p className="text-lg font-semibold text-stone-100">
                    No jobs loaded yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Parse a resume, search for a role, and your matched opportunities will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function InsightBlock({ title, items, emptyMessage, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-stone-950/70 p-4 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
        {title}
      </h3>
      {items?.length ? (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-2 text-sm text-stone-200">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="leading-6">
              <ResumeInsightItem item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition duration-300 hover:-translate-y-1 hover:border-amber-300/30 hover:bg-amber-300/10 hover:shadow-lg hover:shadow-amber-950/20">
      <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400 transition-colors duration-300 group-hover:text-amber-100">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-stone-50 transition-colors duration-300 group-hover:text-white">
        {value}
      </p>
    </div>
  );
}


function JobSkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.4rem] border border-white/10 bg-stone-950/70 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-2/3 rounded-full bg-white/10" />
              <div className="h-4 w-1/3 rounded-full bg-white/10" />
            </div>
            <div className="h-10 w-24 rounded-full bg-emerald-400/10" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="h-7 w-20 rounded-full bg-emerald-400/10" />
                <div className="h-7 w-24 rounded-full bg-emerald-400/10" />
                <div className="h-7 w-16 rounded-full bg-emerald-400/10" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="h-7 w-24 rounded-full bg-amber-400/10" />
                <div className="h-7 w-20 rounded-full bg-amber-400/10" />
              </div>
            </div>
          </div>

          <div className="mt-4 h-11 w-44 rounded-full bg-amber-400/10" />
        </div>
      ))}
    </div>
  );
}

function TagSection({ title, items, tone, emptyMessage }) {
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
        {title}
      </h4>
      {items?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${title}-${item}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function ResumeInsightItem({ item }) {
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }

  if (Array.isArray(item)) {
    return item.filter(Boolean).join(', ');
  }

  if (item && typeof item === 'object') {
    const headline = [
      item.job_title,
      item.company,
      item.name,
      item.project_name,
    ]
      .filter(Boolean)
      .join(' at ');

    const supportingDetails = [
      item.dates,
      item.clients && `Clients: ${formatValue(item.clients)}`,
      item.outcomes && `Outcomes: ${formatValue(item.outcomes)}`,
      item.key_projects && `Key projects: ${formatValue(item.key_projects)}`,
      item.achievements && `Achievements: ${formatValue(item.achievements)}`,
      item.description,
      item.summary,
    ].filter(Boolean);

    if (headline || supportingDetails.length > 0) {
      return (
        <div className="space-y-1">
          {headline ? <p className="font-medium text-stone-100">{headline}</p> : null}
          {supportingDetails.map((detail, index) => (
            <p key={index} className="text-stone-300">
              {detail}
            </p>
          ))}
        </div>
      );
    }

    return JSON.stringify(item);
  }

  return String(item ?? '');
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter(Boolean)
      .join(', ');
  }

  return String(value);
}

export default App;
