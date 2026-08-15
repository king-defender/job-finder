'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { CreateJobInput, JobWithScore } from '@job-agent/shared';
import { createJob, listJobs } from '@/lib/api';

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

  const busy = status.kind === 'busy';

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-gray-500">
          Paste a job description. It gets parsed for requirements and scored against your profile.
        </p>
      </header>

      <StatusBanner status={status} />
      {lastResult && <div className="rounded bg-gray-50 px-4 py-2 text-sm">{lastResult}</div>}

      <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
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

      <section className="space-y-3">
        {jobs.map(({ job, score }) => (
          <JobCard key={job.id} job={job} score={score} />
        ))}
        {jobs.length === 0 && status.kind === 'idle' && (
          <p className="text-sm text-gray-500">No jobs yet — paste one above.</p>
        )}
      </section>
    </main>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  if (status.kind === 'busy') {
    return <div className="rounded bg-blue-50 px-4 py-2 text-sm text-blue-700">{status.label}</div>;
  }
  return <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{status.message}</div>;
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
  const badgeClass =
    score.recommendation === 'APPLY' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

  return (
    <article className="rounded border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">
            {job.title} @ {job.company}
          </h2>
          <p className="text-sm text-gray-500">
            {job.remote ? 'Remote' : job.location || 'Location not specified'}
            {job.salaryRange ? ` · ${job.salaryRange}` : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {score.recommendation}
          </span>
          <div className="text-lg font-semibold">{score.overall}</div>
        </div>
      </div>

      <ScoreBreakdown score={score} />
      <p className="text-xs text-gray-500">{score.reason}</p>
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
    <div className="grid grid-cols-4 gap-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-gray-500">
            <span>{label}</span>
            <span>{value}</span>
          </div>
          <div className="h-1.5 rounded bg-gray-100">
            <div className="h-1.5 rounded bg-black" style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
