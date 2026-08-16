'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CreateJobInput, JobWithScore } from '@job-agent/shared';
import { createApplication, createJob, discoverJobsApi, listJobs } from '@/lib/api';

type Status = { kind: 'idle' } | { kind: 'busy'; label: string } | { kind: 'error'; message: string };

const emptyForm: CreateJobInput = {
  title: '',
  company: '',
  location: '',
  remote: false,
  salaryRange: '',
  description: '',
  url: '',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithScore[]>([]);
  const [form, setForm] = useState<CreateJobInput>(emptyForm);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Automated Discovery State
  const [searchKeywords, setSearchKeywords] = useState('Full Stack Engineer');
  const [searchLocation, setSearchLocation] = useState('Remote');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    refreshJobs();
  }, []);

  function refreshJobs() {
    setStatus({ kind: 'busy', label: 'Loading jobs...' });
    listJobs()
      .then((data) => {
        setJobs(data);
        setStatus({ kind: 'idle' });
      })
      .catch((err: Error) => setStatus({ kind: 'error', message: err.message }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: 'busy', label: 'Parsing JD via Ollama and scoring...' });
    setLastResult(null);
    try {
      const result = await createJob({
        ...form,
        salaryRange: form.salaryRange?.trim() ? form.salaryRange : null,
      });
      setLastResult(
        result.duplicate
          ? `Already tracked — this job was already in the list (score ${result.score.overall}).`
          : `Added — scored ${result.score.overall} (${result.score.recommendation}).`,
      );
      setForm(emptyForm);
      setStatus({ kind: 'idle' });
      refreshJobs();
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  async function handleDiscover(e: FormEvent) {
    e.preventDefault();
    if (!searchKeywords.trim()) return;
    setDiscovering(true);
    setStatus({ kind: 'busy', label: `Searching & discovering jobs for "${searchKeywords}"...` });
    setLastResult(null);

    try {
      const results = await discoverJobsApi({
        keywords: searchKeywords,
        location: searchLocation,
        remoteOnly,
      });

      const count = results.length;
      const newJobs = results.filter((r) => !r.duplicate).length;
      setLastResult(`Discovery completed! Found ${count} job postings (${newJobs} new ingested).`);
      refreshJobs();
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    } finally {
      setDiscovering(false);
    }
  }

  const busy = status.kind === 'busy';

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Job Finder & Intelligence</h1>
          <p className="text-sm text-gray-500">
            Automatically discover relevant jobs online or paste a job description to score against your profile.
          </p>
        </div>
        <Link href="/applications" className="text-sm underline text-gray-600">
          View applications →
        </Link>
      </header>

      <StatusBanner status={status} />
      {lastResult && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-xs font-semibold text-violet-700 dark:text-violet-300">
          ✨ {lastResult}
        </div>
      )}

      {/* Automated Job Discovery Search Card */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 space-y-4 backdrop-blur-md shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-lg">🔍</span> Automated Job Discovery Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search job boards and career pages. Matching jobs are automatically fetched, parsed by AI, and scored against your Candidate Profile.
          </p>
        </div>

        <form onSubmit={handleDiscover} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Keywords / Role
              <input
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="e.g. Senior React Developer"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                required
              />
            </label>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Location
              <input
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="e.g. San Francisco or Remote"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </label>
            <div className="flex items-end pb-1.5 gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Remote Only
              </label>
              <button
                type="submit"
                disabled={discovering || busy}
                className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold py-1.5 px-4 text-xs transition-all disabled:opacity-50 shadow-xs"
              >
                {discovering ? 'Searching Jobs...' : 'Find Jobs'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Manual Paste Form */}
      <details className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 p-4">
        <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          + Or paste a specific job description manually
        </summary>
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
              required
            />
            <TextInput
              label="Company"
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
              required
            />
            <TextInput
              label="Location"
              value={form.location ?? ''}
              onChange={(v) => setForm({ ...form, location: v })}
            />
            <TextInput
              label="Salary range (optional)"
              value={form.salaryRange ?? ''}
              onChange={(v) => setForm({ ...form, salaryRange: v })}
            />
            <TextInput
              label="Posting URL (optional)"
              value={form.url ?? ''}
              onChange={(v) => setForm({ ...form, url: v })}
            />
            <label className="flex items-center gap-2 text-sm mt-5">
              <input
                type="checkbox"
                checked={form.remote ?? false}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              />
              Remote
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600">Job description</span>
            <textarea
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
              rows={6}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add job
          </button>
        </form>
      </details>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Ranked Job Listings</span>
          <span className="text-xs text-slate-500 font-normal">Sorted by Match Score</span>
        </h2>
        {jobs.map(({ job, score }) => (
          <JobCard key={job.id} job={job} score={score} />
        ))}
        {jobs.length === 0 && status.kind === 'idle' && (
          <p className="text-sm text-gray-500 py-8 text-center">
            No jobs found yet — use the Automated Job Discovery Engine above or paste a job manually.
          </p>
        )}
      </section>
    </main>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  if (status.kind === 'busy') {
    return <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
      {status.label}
    </div>;
  }
  return <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">{status.message}</div>;
}

function TextInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <input
        className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function JobCard({ job, score }: { job: JobWithScore['job']; score: JobWithScore['score'] }) {
  const [applyState, setApplyState] = useState<
    { kind: 'idle' } | { kind: 'busy' } | { kind: 'queued' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  const badgeClass =
    score.recommendation === 'APPLY' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400';
  const hasTarget = Boolean(job.applicationUrl || job.url);

  async function handleApply() {
    setApplyState({ kind: 'busy' });
    try {
      await createApplication(job.id);
      setApplyState({ kind: 'queued' });
    } catch (err) {
      setApplyState({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
            {job.title} <span className="text-slate-500 font-normal">@ {job.company}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{job.remote ? '🌐 Remote' : `📍 ${job.location || 'Location not specified'}`}</span>
            {job.salaryRange ? <span>· 💰 {job.salaryRange}</span> : ''}
            {job.source ? <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">Source: {job.source}</span> : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
            {score.recommendation}
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{score.overall}</div>
        </div>
      </div>

      <ScoreBreakdown score={score} />
      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60">{score.reason}</p>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleApply}
          disabled={!hasTarget || applyState.kind === 'busy' || applyState.kind === 'queued'}
          title={hasTarget ? undefined : 'No posting URL on this job — add one to apply'}
          className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 shadow-xs"
        >
          {applyState.kind === 'queued' ? 'Queued' : 'Apply (Copilot mode)'}
        </button>
        {hasTarget && (
          <a
            href={job.applicationUrl || job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Open posting ↗
          </a>
        )}
        {applyState.kind === 'queued' && (
          <span className="text-xs text-slate-500">
            Worker launched Playwright session —{' '}
            <Link href="/applications" className="underline font-medium text-violet-600 dark:text-violet-400">
              check applications
            </Link>{' '}
            to review status & submit.
          </span>
        )}
        {applyState.kind === 'error' && (
          <span className="text-xs text-red-600">{applyState.message}</span>
        )}
      </div>
    </article>
  );
}

function ScoreBreakdown({ score }: { score: JobWithScore['score'] }) {
  const rows: [string, number][] = [
    ['Skills', score.skillMatch],
    ['Experience', score.experienceMatch],
    ['Location', score.locationMatch],
    ['Salary', score.salaryMatch],
  ];
  return (
    <div className="grid grid-cols-4 gap-3 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>{label}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{value}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 transition-all" style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
