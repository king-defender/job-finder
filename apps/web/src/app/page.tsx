'use client';

import { useEffect, useState } from 'react';
import type { CandidateProfile } from '@job-agent/shared';
import { getProfile, updateProfile, uploadResume } from '@/lib/api';

type Status = { kind: 'idle' } | { kind: 'busy'; label: string } | { kind: 'error'; message: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    refreshProfile();
  }, []);

  function refreshProfile() {
    setStatus({ kind: 'busy', label: 'Loading profile...' });
    getProfile()
      .then((p) => {
        setProfile(p);
        setStatus({ kind: 'idle' });
      })
      .catch((err: Error) => setStatus({ kind: 'error', message: err.message }));
  }

  async function handleResumeUpload(file: File) {
    setStatus({ kind: 'busy', label: 'Parsing resume via Ollama...' });
    try {
      const updated = await uploadResume(file);
      setProfile(updated);
      setStatus({ kind: 'idle' });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  async function handleSave() {
    if (!profile) return;
    setStatus({ kind: 'busy', label: 'Saving...' });
    try {
      const { id, createdAt, updatedAt, ...patch } = profile;
      const updated = await updateProfile(patch);
      setProfile(updated);
      setStatus({ kind: 'idle' });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Candidate Profile</h1>
        <p className="text-sm text-gray-500">
          Phase 1 — upload a resume, review what the local model extracted, correct anything wrong, save.
        </p>
      </header>

      <StatusBanner status={status} />

      <UploadCard onUpload={handleResumeUpload} busy={status.kind === 'busy'} />

      {profile && (
        <ProfileForm profile={profile} onChange={setProfile} onSave={handleSave} busy={status.kind === 'busy'} />
      )}
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

function UploadCard({ onUpload, busy }: { onUpload: (file: File) => void; busy: boolean }) {
  return (
    <section className="rounded border border-gray-200 p-4 space-y-2">
      <h2 className="font-medium">Resume</h2>
      <input
        type="file"
        accept="application/pdf"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </section>
  );
}

function ProfileForm({
  profile,
  onChange,
  onSave,
  busy,
}: {
  profile: CandidateProfile;
  onChange: (p: CandidateProfile) => void;
  onSave: () => void;
  busy: boolean;
}) {
  function set<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" value={profile.name} onChange={(v) => set('name', v)} />
        <Field label="Email" value={profile.email} onChange={(v) => set('email', v)} />
        <Field label="Phone" value={profile.phone} onChange={(v) => set('phone', v)} />
        <Field label="Location" value={profile.location} onChange={(v) => set('location', v)} />
        <Field label="Current role" value={profile.currentRole} onChange={(v) => set('currentRole', v)} />
        <Field label="Current company" value={profile.currentCompany} onChange={(v) => set('currentCompany', v)} />
        <Field
          label="Experience (years)"
          value={String(profile.experienceYears)}
          onChange={(v) => set('experienceYears', Number(v) || 0)}
        />
      </div>

      <Field
        label="Skills (comma-separated)"
        value={profile.skills.join(', ')}
        onChange={(v) => set('skills', v.split(',').map((s) => s.trim()).filter(Boolean))}
      />

      {profile.experience.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Experience (from resume — view only for now)</h2>
          <ul className="space-y-2">
            {profile.experience.map((exp, i) => (
              <li key={i} className="rounded border border-gray-200 p-3 text-sm">
                <div className="font-medium">
                  {exp.role} @ {exp.company}
                </div>
                <div className="text-gray-500">
                  {exp.startDate} – {exp.endDate ?? 'present'}
                </div>
                <p className="mt-1">{exp.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.education.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Education (from resume — view only for now)</h2>
          <ul className="space-y-2">
            {profile.education.map((edu, i) => (
              <li key={i} className="rounded border border-gray-200 p-3 text-sm">
                {edu.degree} in {edu.field}, {edu.institution}
                {edu.graduationYear ? ` (${edu.graduationYear})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onSave}
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save profile
      </button>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <input
        className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
