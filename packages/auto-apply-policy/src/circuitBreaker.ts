/**
 * §2's circuit breaker: per-application eligibility gates one item, not a
 * whole run — a bug that passes every gate could still repeat across many
 * applications before anyone notices. This caps how many eligible
 * applications count toward "would auto-apply" per day, independent of the
 * fact that no real submission exists yet to actually cap.
 */
export const DEFAULT_MAX_ELIGIBLE_PER_DAY = 10;

export function isCircuitBreakerTripped(eligibleCountToday: number, max: number = DEFAULT_MAX_ELIGIBLE_PER_DAY): boolean {
  return eligibleCountToday >= max;
}
