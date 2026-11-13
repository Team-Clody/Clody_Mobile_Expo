/** A queue belongs to one authenticated session and must be stopped on logout. */
export function createTokenSync(
  send: (token: string, signal: AbortSignal) => Promise<void>,
  onError?: (error: unknown) => void,
): { sync(token: string): Promise<void>; stop(): void } {
  let stopped = false;
  let pending: string | null = null;
  let lastSynced: string | null = null;
  let running = false;
  let task = Promise.resolve();
  let controller: AbortController | null = null;

  async function drain() {
    try {
      while (!stopped && pending !== null) {
        const token = pending;
        pending = null;
        if (token === lastSynced) continue;

        controller = new AbortController();
        try {
          await send(token, controller.signal);
          if (!stopped) lastSynced = token;
        } catch (error) {
          if (!stopped) onError?.(error);
        } finally {
          controller = null;
        }
      }
    } finally {
      running = false;
    }
  }

  return {
    sync(token) {
      if (stopped || !token.trim()) return Promise.resolve();
      pending = token;
      if (!running) {
        running = true;
        // Assign the shared task before send() or onError can enqueue more work.
        task = Promise.resolve().then(drain);
      }
      return task;
    },
    stop() {
      stopped = true;
      pending = null;
      controller?.abort();
    },
  };
}
