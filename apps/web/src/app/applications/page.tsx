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
  const [filter, setFilter] = useState<'all' | 'needs_review'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
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

  const needsReviewCount = applications.filter((a) => a.status === 'needs_review').length;
  const filteredApps = filter === 'needs_review' 
    ? applications.filter((a) => a.status === 'needs_review')
    : applications;

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-sm text-gray-500">
            Status of apply runs. "Needs review" means the worker filled what it could in an open
            browser tab — go review and submit it yourself.
          </p>
        </div>
        {needsReviewCount > 0 && (
          <div className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {needsReviewCount} Action Needed
          </div>
        )}
      </header>

      <AgentControlPanel autoApplyStatus={autoApplyStatus} />

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-violet-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Applications ({applications.length})
        </button>
        <button
          onClick={() => setFilter('needs_review')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filter === 'needs_review'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Needs Review ({needsReviewCount})
        </button>
      </div>

      <section className="space-y-3">
        {filteredApps.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onUpdate={(updated) =>
              setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            }
          />
        ))}
        {filteredApps.length === 0 && !error && (
          <p className="text-sm text-gray-500 py-6 text-center">
            {filter === 'needs_review'
              ? 'No applications currently need review! 🎉'
              : 'No applications yet — apply to a job from the Jobs page.'}
          </p>
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
      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-semibold uppercase text-[10px]">
          Red Question
        </span>
        <span className="font-medium text-slate-800 dark:text-slate-200">{field.label}</span>
        <span className="text-red-600 dark:text-red-400 text-[11px] ml-auto">
          Sensitive declaration — always manual, never cached
        </span>
      </div>
    );
  }

  async function handleSave() {
    if (!answer.trim()) return;
    try {
      await saveAnswerMemory({ question: field.label, answer, classification: 'yellow' });
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
        <span className="font-medium text-slate-800 dark:text-slate-200">{field.label}:</span>
        <span className="text-green-600 dark:text-green-400 font-semibold">
          Saved to Answer Memory — will auto-fill on future applications
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs">
      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold uppercase text-[10px] shrink-0">
        Needs Info
      </span>
      <span className="text-slate-700 dark:text-slate-300 font-medium shrink-0">{field.label}:</span>
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
        placeholder="Enter answer..."
      />
      <button onClick={handleSave} className="rounded-lg bg-black text-white px-3 py-1 text-xs font-semibold shrink-0">
        Save Answer
      </button>
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}

function AgentControlPanel({ autoApplyStatus }: { autoApplyStatus: AutoApplyStatus | null }) {
  const [mode, setMode] = useState<'copilot' | 'controlled' | 'full'>('copilot');

  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 space-y-3 backdrop-blur-md shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            Agent Control Center & Circuit Breaker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure application mode, ATS adapters, and safety gates per PROJECT_PLAN.md.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-medium border border-slate-200/60 dark:border-slate-800">
          {(['copilot', 'controlled', 'full'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg transition-all capitalize ${
                mode === m
                  ? 'bg-violet-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs pt-1">
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div className="text-slate-500 font-medium">Mode Status</div>
          <div className="font-semibold capitalize text-violet-600 dark:text-violet-400 text-sm">
            {mode === 'copilot' ? 'Copilot (Human Review)' : mode === 'controlled' ? 'Controlled Auto-Apply' : 'Full Autonomy'}
          </div>
          <p className="text-[11px] text-slate-400">
            {mode === 'copilot'
              ? 'Worker fills forms in open tab — you click submit.'
              : 'Auto-submits if score > 85% & 0 unmapped/red fields.'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div className="text-slate-500 font-medium">Daily Circuit Breaker</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-between">
            <span>{autoApplyStatus ? `${autoApplyStatus.eligibleToday} / ${autoApplyStatus.maxPerDay}` : '0 / 10'} Daily Limit</span>
            {autoApplyStatus?.tripped && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold">TRIPPED</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Halts unattended runs if daily quota or anomaly is detected.</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div className="text-slate-500 font-medium">Active ATS Adapters</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex flex-wrap gap-1 pt-0.5">
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">Greenhouse</span>
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">Lever</span>
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">Ashby</span>
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">Workday</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400">Generic</span>
          </div>
        </div>
      </div>
    </section>
  );
}
