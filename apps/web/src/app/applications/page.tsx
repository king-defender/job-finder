'use client';

import { useEffect, useState } from 'react';
import type { Application, ApplicationStatus, AutoApplyStatus, UnmappedField } from '@job-agent/shared';
import {
  generateCoverLetter,
  getAutoApplyStatus,
  listApplications,
  saveAnswerMemory,
  updateApplicationStatus,
} from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-gray-100 text-gray-600',
  applying: 'bg-blue-100 text-blue-700',
  needs_review: 'bg-amber-100 text-amber-800',
  applied: 'bg-green-100 text-green-800',
  assessment: 'bg-purple-100 text-purple-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-200 text-gray-600',
  failed: 'bg-red-100 text-red-700',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [autoApplyStatus, setAutoApplyStatus] = useState<AutoApplyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // In-progress runs (applying) move to needs_review/failed asynchronously
    // once the worker finishes — poll so that shows up without a manual reload.
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, []);

  function refresh() {
    listApplications()
      .then(setApplications)
      .catch((err: Error) => setError(err.message));
    getAutoApplyStatus()
      .then(setAutoApplyStatus)
      .catch(() => undefined);
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="text-sm text-gray-500">
          Status of apply runs. "Needs review" means the worker filled what it could in an open
          browser tab — go review and submit it yourself. Nothing here submits on its own.
        </p>
      </header>

      {autoApplyStatus && (
        <div className="rounded bg-gray-50 px-4 py-2 text-xs text-gray-600">
          Auto-apply eligibility (informational only — no auto-submit exists yet):{' '}
          {autoApplyStatus.eligibleToday}/{autoApplyStatus.maxPerDay} would-qualify today
          {autoApplyStatus.tripped && (
            <span className="text-amber-700 font-medium"> — circuit breaker would be tripped</span>
          )}
        </div>
      )}

      {error && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <section className="space-y-3">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onUpdate={(updated) =>
              setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            }
          />
        ))}
        {applications.length === 0 && !error && (
          <p className="text-sm text-gray-500">No applications yet — apply to a job from the Jobs page.</p>
        )}
      </section>
    </main>
  );
}

const OUTCOME_STATUSES: ApplicationStatus[] = ['applied', 'assessment', 'interview', 'offer', 'rejected'];

function ApplicationCard({
  application,
  onUpdate,
}: {
  application: Application;
  onUpdate: (updated: Application) => void;
}) {
  const badgeClass = STATUS_STYLES[application.status] ?? 'bg-gray-100 text-gray-600';

  async function handleStatusChange(status: ApplicationStatus) {
    try {
      const updated = await updateApplicationStatus(application.id, status);
      onUpdate(updated);
    } catch {
      // Leave the UI as-is — the next poll cycle will reflect whatever the server actually has.
    }
  }

  return (
    <article className="rounded border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Job {application.jobId}</span>
        <div className="flex items-center gap-2">
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {application.status.replace('_', ' ')}
          </span>
          {application.status === 'needs_review' || OUTCOME_STATUSES.includes(application.status) ? (
            <select
              value={OUTCOME_STATUSES.includes(application.status) ? application.status : ''}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              className="rounded border border-gray-300 text-xs px-1 py-0.5"
            >
              <option value="" disabled>
                Record outcome...
              </option>
              {OUTCOME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Match score at time of apply: {application.matchScore}
        {application.atsDetected ? ` · ATS: ${application.atsDetected}` : ''}
      </div>

      {application.status === 'needs_review' && (
        <div className="text-xs">
          {application.autoApplyEligible ? (
            <span className="text-green-700">Would qualify for Controlled auto-apply (not enabled — see PROJECT_PLAN.md)</span>
          ) : (
            <span className="text-gray-400">Would not qualify for auto-apply: {application.autoApplyReasons.join('; ')}</span>
          )}
        </div>
      )}

      {application.captchaDetected && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          CAPTCHA seen on this page — solve it yourself in the open browser tab before submitting.
        </p>
      )}

      {application.errorMessage && (
        <p className="text-xs text-red-600">Error: {application.errorMessage}</p>
      )}

      {application.unmappedFields.length > 0 && (
        <div className="text-xs space-y-1.5">
          <p className="text-gray-600 font-medium">Needs your input:</p>
          {application.unmappedFields.map((f, i) => (
            <UnmappedFieldRow key={i} field={f} />
          ))}
        </div>
      )}

      {application.screenshotPath && (
        <p className="text-xs text-gray-400">Screenshot saved: {application.screenshotPath}</p>
      )}

      <CoverLetterSection application={application} onUpdate={onUpdate} />
    </article>
  );
}

function CoverLetterSection({
  application,
  onUpdate,
}: {
  application: Application;
  onUpdate: (updated: Application) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverLetter = application.coverLetter;

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const updated = await generateCoverLetter(application.id);
      onUpdate(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-1 space-y-1.5">
      <button
        onClick={handleGenerate}
        disabled={busy}
        className="rounded bg-gray-800 px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {busy ? 'Generating...' : coverLetter ? 'Regenerate cover letter' : 'Generate cover letter'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {coverLetter && (
        <textarea
          readOnly
          value={coverLetter}
          rows={6}
          className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"
        />
      )}
    </div>
  );
}

function UnmappedFieldRow({ field }: { field: UnmappedField }) {
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (field.classification === 'red') {
    return (
      <div>
        {field.label} <span className="text-amber-700">(sensitive — always manual, never saved)</span>
      </div>
    );
  }

  async function handleSave() {
    if (!answer.trim()) return;
    try {
      // Saved as "yellow": Copilot mode already means every field gets human
      // review before submit regardless, so the green/yellow distinction
      // doesn't change current fill behavior — yellow is just the more
      // conservative bookkeeping default for a manually-entered answer.
      await saveAnswerMemory({ question: field.label, answer, classification: 'yellow' });
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (saved) {
    return (
      <div className="text-gray-500">
        {field.label}: <span className="text-green-700">saved — will auto-fill on future applications</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 shrink-0">{field.label}:</span>
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="flex-1 rounded border border-gray-300 px-1.5 py-0.5"
        placeholder="Your answer"
      />
      <button onClick={handleSave} className="rounded bg-black px-2 py-0.5 text-white shrink-0">
        Save
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
