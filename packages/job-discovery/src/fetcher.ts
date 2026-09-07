import { DiscoveredJobRaw, JobSearchCriteria } from "./types";

export async function discoverJobs(criteria: JobSearchCriteria): Promise<DiscoveredJobRaw[]> {
  const { keywords, location = "", remoteOnly = false, limit = 10 } = criteria;
  const results: DiscoveredJobRaw[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const remoteOkRes = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (remoteOkRes.ok) {
      const data = await remoteOkRes.json();
      if (Array.isArray(data)) {
        const queryLower = keywords.toLowerCase();
        const items = data.slice(1);

        for (const item of items) {
          if (!item || typeof item !== "object" || !item.position || !item.company) continue;

          const title = String(item.position);
          const company = String(item.company);
          const tags = Array.isArray(item.tags) ? item.tags.join(" ") : "";
          const fullText = `${title} ${company} ${tags} ${item.description || ""}`.toLowerCase();

          const matchesKeyword = queryLower
            .split(" ")
            .some((term) => term.trim().length > 1 && fullText.includes(term.trim()));

          if (matchesKeyword) {
            results.push({
              title,
              company,
              location: item.location || "Remote",
              remote: true,
              salaryRange: item.salary_min ? `$${item.salary_min} - $${item.salary_max}` : null,
              description: String(item.description || `${title} position at ${company}`).replace(/<[^>]*>?/gm, "").slice(0, 1500),
              url: String(item.url || `https://remoteok.com/remote-jobs/${item.id}`),
              source: "RemoteOK",
            });
          }

          if (results.length >= limit) break;
        }
      }
    }
  } catch (err) {
    console.warn("[JobDiscovery] Primary feed fetch warning:", (err as Error).message);
  }

  // No synthetic fallback here on purpose: this result gets persisted straight into Mongo
  // as real Job documents (see JobsService.discoverJobs), indistinguishable from genuine
  // listings except for a "source" string field nothing else in the app treats specially.
  // A previous version filled zero real matches with two fabricated postings (invented
  // companies, non-resolving URLs) - exactly the "fake content presented as real" failure
  // mode this fetch is supposed to protect against. Zero real matches means zero results,
  // full stop; the caller decides what "no jobs found" should look like to the user.
  return results.slice(0, limit);
}
