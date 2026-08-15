'use client';

import { useEffect, useState } from 'react';
import type { Application } from '@job-agent/shared';
import { listApplications } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-gray-100 text-gray-600',
  applying: 'bg-blue-100 text-blue-700',
  needs_review: 'bg-amber-100 text-amber-800',
  applied: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="text-sm text-gray-500">
          Status of apply runs. "Needs review" means the worker filled what it could in an open
          browser tab — go review and submit it yourself.
        </p>
      </header>

      {error && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <section className="space-y-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && !error && (
          <p className="text-sm text-gray-500">No applications yet — apply to a job from the Jobs page.</p>
        )}
      </section>
    </main>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const badgeClass = STATUS_STYLES[application.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <article className="rounded border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Job {application.jobId}</span>
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {application.status.replace('_', ' ')}
        </span>
      </div>

      <div className="text-xs text-gray-500">
        Match score at time of apply: {application.matchScore}
        {application.atsDetected ? ` · ATS: ${application.atsDetected}` : ''}
      </div>

      {application.errorMessage && (
        <p className="text-xs text-red-600">Error: {application.errorMessage}</p>
      )}

      {application.unmappedFields.length > 0 && (
        <div className="text-xs">
          <p className="text-gray-600 font-medium">Needs your input:</p>
          <ul className="list-disc list-inside text-gray-500">
            {application.unmappedFields.map((f, i) => (
              <li key={i}>
                {f.label} {f.classification === 'red' && <span className="text-amber-700">(sensitive — always manual)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {application.screenshotPath && (
        <p className="text-xs text-gray-400">Screenshot saved: {application.screenshotPath}</p>
      )}
    </article>
  );
}
