import { detectAts, getAtsAdapter } from "./index";

describe("detectAts & ATS Adapters", () => {
  it("should accurately identify major ATS provider URLs", () => {
    expect(detectAts("https://boards.greenhouse.io/acme/jobs/123")).toBe("greenhouse");
    expect(detectAts("https://jobs.lever.co/vanguard/456")).toBe("lever");
    expect(detectAts("https://jobs.ashbyhq.com/company/789")).toBe("ashby");
    expect(detectAts("https://acme.myworkdayjobs.com/careers/job/1")).toBe("workday");
    expect(detectAts("https://example.com/careers/submit")).toBe("generic");
  });

  it("should return valid submit button selectors for recognized ATS kinds", () => {
    const greenhouseAdapter = getAtsAdapter("greenhouse");
    expect(greenhouseAdapter.submitSelectors).toContain("#submit_app");

    const leverAdapter = getAtsAdapter("lever");
    expect(leverAdapter.submitSelectors).toContain(".postings-btn");

    const genericAdapter = getAtsAdapter("generic");
    expect(genericAdapter.submitSelectors.length).toBeGreaterThan(0);
  });
});
