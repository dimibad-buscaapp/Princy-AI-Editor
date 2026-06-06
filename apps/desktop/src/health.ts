import http from "node:http";

export type HealthWaitResult = {
  ok: boolean;
  attempts: number;
  elapsedMs: number;
  url?: string;
};

export type HealthWaitOptions = {
  urls: string[];
  intervalMs?: number;
  timeoutMs?: number;
  onAttempt?: (attempt: number, url: string) => void;
};

function probeUrl(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

export async function waitForFrontend(options: HealthWaitOptions): Promise<HealthWaitResult> {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 90_000;
  const started = Date.now();
  let attempts = 0;

  while (Date.now() - started < timeoutMs) {
    attempts += 1;
    for (const url of options.urls) {
      options.onAttempt?.(attempts, url);
      const ok = await probeUrl(url, 2500);
      if (ok) {
        return {
          ok: true,
          attempts,
          elapsedMs: Date.now() - started,
          url
        };
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return {
    ok: false,
    attempts,
    elapsedMs: Date.now() - started
  };
}
