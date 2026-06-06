type SafeFetchOptions = RequestInit & {
  retries?: number;
  timeoutMs?: number;
  onError?: (message: string) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function safeFetch(input: RequestInfo | URL, options: SafeFetchOptions = {}): Promise<Response> {
  const { retries = 3, timeoutMs = 30_000, onError, ...init } = options;
  const url = typeof input === "string" ? input : input.toString();
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.ok || response.status < 500) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
      console.warn("[safeFetch]", { url, attempt, status: response.status });
    } catch (error) {
      lastError = error;
      console.warn("[safeFetch]", {
        url,
        attempt,
        error: error instanceof Error ? error.message : "failed"
      });
    }
    if (attempt < retries) await sleep(400 * attempt);
  }

  const message = lastError instanceof Error ? lastError.message : "Falha na requisição";
  onError?.(message);
  throw lastError instanceof Error ? lastError : new Error(message);
}
