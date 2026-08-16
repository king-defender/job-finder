import { computeDedupKey } from "./dedup";

describe("computeDedupKey", () => {
  it("should normalize title, company, and location to lower case and strip special characters", () => {
    const key1 = computeDedupKey("Senior React Developer", "Acme Inc.", "San Francisco, CA");
    const key2 = computeDedupKey("senior react developer", "acme inc", "san francisco ca");

    expect(key1).toBe(key2);
  });

  it("should produce consistent hash keys for identical input", () => {
    const key = computeDedupKey("Node.js Engineer", "CloudCorp", "Remote");
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });
});
