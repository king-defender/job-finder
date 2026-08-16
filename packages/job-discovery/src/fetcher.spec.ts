import { discoverJobs } from "./index";

describe("discoverJobs", () => {
  it("should return discovered job postings matching search keywords", async () => {
    const jobs = await discoverJobs({ keywords: "Software Engineer", remoteOnly: true, limit: 5 });

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty("title");
    expect(jobs[0]).toHaveProperty("company");
    expect(jobs[0]).toHaveProperty("url");
  }, 15000);
});
