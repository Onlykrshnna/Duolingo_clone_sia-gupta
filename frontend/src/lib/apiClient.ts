export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const REQUEST_TIMEOUT_MS = 15000;
export const PROD_FALLBACK_API_URL = "https://duolingo-clone-sia-gupta.onrender.com/api/v1";
export const DEV_API_URL = "http://localhost:8000/api/v1";

export type ApiRequestOptions = RequestInit & {
  retries?: number;
  onRetry?: (attempt: number, maxRetries: number, path: string) => void;
};

export class ApiError extends Error {
  readonly friendlyMessage: string;
  readonly endpoint: string;
  readonly status?: number;
  readonly isRetryable: boolean;
  readonly isOffline: boolean;
  readonly isTimeout: boolean;

  constructor(
    message: string,
    {
      friendlyMessage,
      endpoint,
      status,
      isRetryable = false,
      isOffline = false,
      isTimeout = false,
    }: {
      friendlyMessage: string;
      endpoint: string;
      status?: number;
      isRetryable?: boolean;
      isOffline?: boolean;
      isTimeout?: boolean;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.friendlyMessage = friendlyMessage;
    this.endpoint = endpoint;
    this.status = status;
    this.isRetryable = isRetryable;
    this.isOffline = isOffline;
    this.isTimeout = isTimeout;
  }
}

const isNodeProd =
  typeof process !== "undefined" && process.env?.NODE_ENV === "production";

const envUrl = process.env.NEXT_PUBLIC_API_URL;

let BASE_URL: string;
if (envUrl && envUrl.trim()) {
  BASE_URL = envUrl.trim();
} else {
  BASE_URL = isNodeProd ? PROD_FALLBACK_API_URL : DEV_API_URL;
}

if (!BASE_URL.includes("/api/v1")) {
  if (BASE_URL.endsWith("/")) {
    BASE_URL = BASE_URL.slice(0, -1);
  }
  BASE_URL = `${BASE_URL}/api/v1`;
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function friendlyMessageForStatus(status: number, detail: string): string {
  if (status === 404) return "Lesson not found. It may have been removed or the database needs re-seeding.";
  if (status === 400) return detail || "This lesson cannot be started right now.";
  if (status === 403) return "You do not have permission to access this lesson.";
  if (status >= 500) return "The server encountered an error. Please try again in a moment.";
  return detail || `Request failed (${status}).`;
}

export function normalizeApiError(err: unknown, path: string): ApiError {
  if (err instanceof ApiError) return err;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return new ApiError(String(err), {
      friendlyMessage: "Offline mode — check your internet connection and try again.",
      endpoint: path,
      isOffline: true,
      isRetryable: true,
    });
  }

  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  const lower = message.toLowerCase();

  if (name === "AbortError" || lower.includes("abort") || lower.includes("timeout")) {
    return new ApiError(message, {
      friendlyMessage:
        "Server is taking longer than expected. Please try again in a few seconds.",
      endpoint: path,
      isTimeout: true,
      isRetryable: true,
    });
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("econnrefused") ||
    lower.includes("cors")
  ) {
    return new ApiError(message, {
      friendlyMessage: isNodeProd
        ? "Unable to reach the server. Please try again in a few seconds."
        : "Unable to connect to the server. Make sure the backend is running on port 8000.",
      endpoint: path,
      isRetryable: true,
    });
  }

  const statusMatch = message.match(/API Error:\s*(\d+)/);
  if (statusMatch) {
    const status = Number(statusMatch[1]);
    const detailMatch = message.match(/API Error:\s*\d+\s*-\s*(.+)/);
    const detail = detailMatch?.[1]?.trim() ?? "";
    let parsedDetail = detail;
    try {
      const json = JSON.parse(detail);
      parsedDetail = json.detail ?? detail;
    } catch {
      // keep raw detail
    }
    return new ApiError(message, {
      friendlyMessage: friendlyMessageForStatus(status, parsedDetail),
      endpoint: path,
      status,
      isRetryable: isRetryableStatus(status),
    });
  }

  return new ApiError(message, {
    friendlyMessage: "Lesson failed to load. Please try again.",
    endpoint: path,
    isRetryable: true,
  });
}

async function requestOnce<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.debug(`[API] → ${options.method ?? "GET"} ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    const apiErr = normalizeApiError(err, path);
    console.error(`[API] ✗ ${options.method ?? "GET"} ${path} — network/timeout error`, {
      endpoint: path,
      url,
      message: apiErr.message,
      friendlyMessage: apiErr.friendlyMessage,
      offline: apiErr.isOffline,
      timeout: apiErr.isTimeout,
    });
    throw apiErr;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText || response.statusText;
    try {
      const json = JSON.parse(errorText);
      detail = json.detail ?? detail;
    } catch {
      // keep raw text
    }
    const apiErr = new ApiError(`API Error: ${response.status} - ${detail}`, {
      friendlyMessage: friendlyMessageForStatus(response.status, detail),
      endpoint: path,
      status: response.status,
      isRetryable: isRetryableStatus(response.status),
    });
    console.error(`[API] ✗ ${options.method ?? "GET"} ${path} — HTTP ${response.status}`, {
      endpoint: path,
      url,
      status: response.status,
      detail,
    });
    throw apiErr;
  }

  try {
    const data = (await response.json()) as T;
    console.debug(`[API] ✓ ${options.method ?? "GET"} ${path}`);
    return data;
  } catch (err) {
    const apiErr = new ApiError(`JSON parse error: ${err}`, {
      friendlyMessage: "Received an invalid response from the server.",
      endpoint: path,
      status: response.status,
      isRetryable: true,
    });
    console.error(`[API] ✗ ${path} — JSON parse error`, err);
    throw apiErr;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { retries = MAX_RETRIES, onRetry, ...fetchOptions } = options;
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestOnce<T>(path, fetchOptions);
    } catch (err) {
      lastError = normalizeApiError(err, path);

      if (!lastError.isRetryable || attempt >= retries) {
        console.error(`[API] Giving up on ${path} after ${attempt} attempt(s)`, lastError);
        throw lastError;
      }

      console.warn(
        `[API] Retrying ${path} in ${RETRY_DELAY_MS}ms (attempt ${attempt + 1}/${retries})…`
      );
      onRetry?.(attempt + 1, retries, path);
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new ApiError("Unknown error", {
    friendlyMessage: "Lesson failed to load.",
    endpoint: path,
    isRetryable: true,
  });
}
