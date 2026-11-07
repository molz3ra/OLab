/** Combines the caller's AbortSignal with a timeout. `timedOut()` tells the two causes apart. */
export function withTimeout(signal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, ms);
  const forward = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", forward, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => expired,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", forward);
    },
  };
}

export function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
