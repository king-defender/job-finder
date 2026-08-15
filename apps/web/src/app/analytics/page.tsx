'use client';

import { useEffect, useState } from 'react';
import type { AnalyticsBucket, ApplicationAnalytics } from '@job-agent/shared';
import { getAnalytics } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-gray-500">
          Response rate = share of applications where the company did anything beyond your
          submission — assessment, interview, offer, or rejection. "Applied" alone isn't counted
          as a response yet.
        </p>
      </header>

      {error && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {analytics && (
        <>
          <div className="rounded border border-gray-200 p-4">
            <div className="text-3xl font-semibold">{analytics.overallResponseRate}%</div>
            <div className="text-sm text-gray-500">
              overall response rate — {analytics.totalResponded}/{analytics.totalApplications} applications
            </div>
          </div>

          <BucketTable title="By role" buckets={analytics.byRole} />
          <BucketTable title="By skill" buckets={analytics.bySkill} />
          <BucketTable title="By location" buckets={analytics.byLocation} />

          {analytics.totalApplications === 0 && (
            <p className="text-sm text-gray-500">
              No applications yet — this fills in once you've applied to a few jobs and recorded outcomes on the Applications page.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function BucketTable({ title, buckets }: { title: string; buckets: AnalyticsBucket[] }) {
  if (buckets.length === 0) return null;

  return (
    <div className="rounded border border-gray-200 p-4">
      <h2 className="font-medium mb-2">{title}</h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-normal pb-1">Key</th>
            <th className="font-normal pb-1 text-right">Applications</th>
            <th className="font-normal pb-1 text-right">Response rate</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.key} className="border-t border-gray-100">
              <td className="py-1">{b.key}</td>
              <td className="py-1 text-right">{b.total}</td>
              <td className="py-1 text-right">{b.responseRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
