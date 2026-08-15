'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { JobWithScore, OutreachDraft } from '@job-agent/shared';
import { createOutreachDraft, listJobs, listOutreachDrafts, markOutreachStatus } from '@/lib/api';

export default function OutreachPage() {
  const [jobs, setJobs] = useState<JobWithScore[]>([]);
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [jobId, setJobId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listJobs().then(setJobs).catch(() => undefined);
    refreshDrafts();
  }, []);

  function refreshDrafts() {
    listOutreachDrafts()
      .then(setDrafts)
      .catch((err: Error) => setError(err.message));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!jobId || !recipientEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createOutreachDraft({
        jobId,
        recipientEmail,
        recipientName: recipientName.trim() || null,
      });
      setRecipientEmail('');
      setRecipientName('');
      refreshDrafts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Recruiter outreach</h1>
        <p className="text-sm text-gray-500">
          Drafts only — this page never sends anything. Every message opens in your own email
          client for you to review and send.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
        <label className="block text-sm">
          <span className="text-gray-600">Job</span>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
            <option value="" disabled>
              Select a job...
            </option>
            {jobs.map(({ job }) => (
              <option key={job.id} value={job.id}>
                {job.title} @ {job.company}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-gray-600">Recipient email</span>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Recipient name (optional)</span>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Drafting...' : 'Draft message'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <section className="space-y-3">
        {drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} onChange={refreshDrafts} />
        ))}
        {drafts.length === 0 && <p className="text-sm text-gray-500">No drafts yet.</p>}
      </section>
    </main>
  );
}

function DraftCard({ draft, onChange }: { draft: OutreachDraft; onChange: () => void }) {
  const [copied, setCopied] = useState(false);
  const mailtoHref = `mailto:${encodeURIComponent(draft.recipientEmail)}?body=${encodeURIComponent(draft.message)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkSent() {
    await markOutreachStatus(draft.id, 'sent');
    onChange();
  }

  return (
    <article className="rounded border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {draft.recipientName ? `${draft.recipientName} <${draft.recipientEmail}>` : draft.recipientEmail}
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 font-semibold">{draft.status}</span>
      </div>

      <textarea
        readOnly
        value={draft.message}
        rows={5}
        className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"
      />

      <div className="flex items-center gap-2 text-xs">
        <a href={mailtoHref} className="rounded bg-black px-2 py-1 text-white">
          Open in email client
        </a>
        <button onClick={handleCopy} className="rounded border border-gray-300 px-2 py-1">
          {copied ? 'Copied' : 'Copy text'}
        </button>
        {draft.status !== 'sent' && (
          <button onClick={handleMarkSent} className="rounded border border-gray-300 px-2 py-1">
            Mark as sent (after you've actually sent it)
          </button>
        )}
      </div>
    </article>
  );
}
