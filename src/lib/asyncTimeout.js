/**
 * Settle with a caller-provided fallback when a promise exceeds its deadline.
 * Source rejections remain rejections so each caller can choose its own error
 * handling independently from the timeout fallback.
 */
export function withTimeout(promise, timeoutMs, fallback) {
  const delayMs = Number(timeoutMs);
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return Promise.reject(new RangeError("timeoutMs must be a non-negative finite number"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, delayMs);

    Promise.resolve(promise).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
