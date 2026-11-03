const MAX_TIMER_DELAY = 2_147_483_647;

/** Schedule against elapsed process time; long subscriptions need multiple timer chunks. */
export function scheduleAccessExpiry(durationMs: number, onExpire: () => void): () => void {
  const startedAt = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let canceled = false;

  function check() {
    if (canceled) return;
    const remaining = durationMs - (performance.now() - startedAt);
    if (!Number.isFinite(remaining) || remaining <= 0) {
      onExpire();
      return;
    }
    timer = setTimeout(check, Math.min(remaining, MAX_TIMER_DELAY));
  }

  check();
  return () => {
    canceled = true;
    if (timer !== undefined) clearTimeout(timer);
  };
}
