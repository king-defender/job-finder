import { evaluateEligibility, isCircuitBreakerTripped } from "./index";

describe("auto-apply policy eligibility", () => {
  it("should mark applications eligible when score is high and zero unmapped or captcha issues exist", () => {
    const { eligible, reasons } = evaluateEligibility({
      status: "needs_review",
      matchScore: 90,
      unmappedFields: [],
      captchaDetected: false,
    });

    expect(eligible).toBe(true);
    expect(reasons).toHaveLength(0);
  });

  it("should reject eligibility when a red-flag sensitive question is unmapped", () => {
    const { eligible, reasons } = evaluateEligibility({
      status: "needs_review",
      matchScore: 90,
      unmappedFields: [{ label: "Are you legally authorized to work in the US?", classification: "red" }],
      captchaDetected: false,
    });

    expect(eligible).toBe(false);
    expect(reasons.some((r) => r.includes("unmapped"))).toBe(true);
  });

  it("should reject eligibility when a CAPTCHA is detected", () => {
    const { eligible, reasons } = evaluateEligibility({
      status: "needs_review",
      matchScore: 92,
      unmappedFields: [],
      captchaDetected: true,
    });

    expect(eligible).toBe(false);
    expect(reasons.some((r) => r.includes("CAPTCHA"))).toBe(true);
  });

  it("should trip circuit breaker when daily quota is exceeded", () => {
    expect(isCircuitBreakerTripped(5, 10)).toBe(false);
    expect(isCircuitBreakerTripped(10, 10)).toBe(true);
    expect(isCircuitBreakerTripped(15, 10)).toBe(true);
  });
});
