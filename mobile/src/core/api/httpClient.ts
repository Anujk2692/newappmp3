import {getApiBaseUrl, getApiKey, getMediaServerCandidates, getServerCandidates, isProductionMode, setApiBaseUrl} from '../../config';
import {
  clearCachedApiUrl,
  connectionErrorHint,
  isReachableHealthStatus,
  isRecoverableRequestError,
  loadCachedApiUrl,
  networkErrorMessage,
  orderServerCandidates,
  probeTimeoutFor,
  requestTimeoutMessage,
  saveCachedApiUrl,
} from '../../utils/serverConnection';
import type {ApiResponse} from './types/common';

export type {ApiResponse};

function defaultRequestTimeoutMs(): number {
  return isProductionMode() ? 180000 : 120000;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeHttpRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = defaultRequestTimeoutMs(),
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const base = getApiBaseUrl();
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${base}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        Accept: 'application/json',
        ...(apiKey ? {'X-API-Key': apiKey} : {}),
        ...(options.body instanceof FormData
          ? {}
          : {'Content-Type': 'application/json'}),
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await response.text();
    if (
      !response.ok &&
      (response.status === 502 || response.status === 503 || response.status === 504)
    ) {
      throw new Error(
        `Server error (${response.status}). ${connectionErrorHint()}`,
      );
    }

    let json: ApiResponse<T>;
    try {
      json = text ? JSON.parse(text) : {success: false, message: 'Empty response', data: null as T};
    } catch {
      throw new Error(
        response.ok
          ? 'Invalid server response'
          : `Server error (${response.status}). ${connectionErrorHint()}`,
      );
    }

    if (!response.ok) {
      throw new Error(json.message || `Request failed (${response.status})`);
    }
    return json;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(requestTimeoutMessage());
    }
    if (error instanceof Error && error.message === 'Network request failed') {
      throw new Error(networkErrorMessage(base));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function httpRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = defaultRequestTimeoutMs(),
): Promise<ApiResponse<T>> {
  try {
    return await executeHttpRequest<T>(path, options, timeoutMs);
  } catch (error) {
    if (!isRecoverableRequestError(error) || options.signal?.aborted) {
      throw error;
    }
    await clearCachedApiUrl();
    await discoverServer(getServerCandidates());
    await sleep(1500);
    return executeHttpRequest<T>(path, options, timeoutMs);
  }
}

export async function discoverServer(
  candidates = getServerCandidates(),
): Promise<string | null> {
  const apiKey = getApiKey();
  const cached = await loadCachedApiUrl();
  const ordered = orderServerCandidates(candidates, cached);

  for (const base of ordered) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), probeTimeoutFor(base));
      const headers: Record<string, string> = {Accept: 'application/json'};
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      const response = await fetch(`${base}/api/health`, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timer);

      if (response.status === 502 || response.status === 503 || response.status === 504) {
        continue;
      }

      const text = await response.text();
      let json: {success?: boolean; data?: {status?: string}};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        continue;
      }

      if (
        response.ok &&
        json.success &&
        isReachableHealthStatus(json.data?.status)
      ) {
        setApiBaseUrl(base);
        await saveCachedApiUrl(base);
        return base;
      }
    } catch {
      // try next
    }
  }
  return null;
}

/** Ensure a reachable API server for search and general calls (cloud first in production). */
export async function ensureApiServer(): Promise<string> {
  const candidates = getServerCandidates();
  if (candidates.length > 0) {
    const found = await discoverServer(candidates);
    if (found) {
      return found;
    }
  }
  return getApiBaseUrl();
}

export async function ensureMediaServer(): Promise<string> {
  const candidates = getMediaServerCandidates();
  if (candidates.length > 0) {
    const found = await discoverServer(candidates);
    if (found) {
      return found;
    }
  }
  return getApiBaseUrl();
}

export async function discoverMediaServer(): Promise<string | null> {
  const candidates = getMediaServerCandidates();
  if (candidates.length === 0) {
    return getApiBaseUrl();
  }
  return discoverServer(candidates);
}

/** Wake Render free tier by polling health until UP or timeout. */
export async function wakeCloudServer(timeoutMs = 120000): Promise<boolean> {
  if (!isProductionMode()) {
    return (await discoverServer(getServerCandidates())) != null;
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await discoverServer(getServerCandidates());
    if (found) {
      return true;
    }
    await sleep(2500);
  }
  return false;
}
