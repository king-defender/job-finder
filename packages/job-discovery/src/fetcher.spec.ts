import { discoverJobs } from "./index";

describe("discoverJobs", () => {
  it("should return discovered job postings matching search keywords", async () => {
    const jobs = await discoverJobs({ keywords: "Software Engineer", remoteOnly: true, limit: 5 });

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty("title");
    expect(jobs[0]).toHaveProperty("company");
    expect(jobs[0]).toHaveProperty("url");
    expect(jobs[0].source).toBe("RemoteOK");
  }, 15000);

  it("returns an empty list rather than fabricated postings when nothing real matches", async () => {
    // This exact keyword used to fall through to two hardcoded fake postings ("Acme Cloud
    // Technologies", "Vanguard Systems" with non-resolving URLs) that got persisted into
    // Mongo indistinguishably from real listings. A search with no genuine matches must
    // come back empty, not synthesize content.
    const jobs = await discoverJobs({
      keywords: "zzz-no-such-role-will-ever-match-zzz-qqqxyz",
      limit: 5,
    });

    expect(jobs).toEqual([]);
  }, 15000);
});
