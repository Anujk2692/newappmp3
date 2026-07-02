import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApiBaseUrl, isProductionMode} from '../config';

const API_URL_KEY = '@mediaface/api_base_url';

export async function loadCachedApiUrl(): Promise<string | null> {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      return url.replace(/\/$/, '');
    }
  } catch {
    // ignore
  }
  return null;
}

export async function saveCachedApiUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(API_URL_KEY, url.replace(/\/$/, ''));
  } catch {
    // ignore
  }
}

export function isReachableHealthStatus(status: unknown): boolean {
  return status === 'UP' || status === 'DEGRADED';
}

/** User-facing hint when API calls fail — no misleading "port 8080" in cloud mode. */
export function connectionErrorHint(): string {
  const base = getApiBaseUrl();
  if (isProductionMode() || base.startsWith('https://')) {
    return (
      'Cannot reach the cloud server. Check internet (Wi‑Fi or mobile data). ' +
      'On Render free tier, wait up to 2 minutes and try again — your Mac does not need to be on.'
    );
  }
  return (
    'Cannot reach your Mac backend. Start it with: cd backend && mvn spring-boot:run ' +
    '(port 8080), same Wi‑Fi, Local Network enabled — or switch to cloud in production.config.ts.'
  );
}

export function networkErrorMessage(base = getApiBaseUrl()): string {
  if (isProductionMode() || base.startsWith('https://')) {
    return (
      `Cannot reach ${base}. Check internet. Render free tier may sleep — wait ~2 min and retry.`
    );
  }
  return (
    `Cannot reach ${base}. Same Wi‑Fi as Mac? Enable Local Network in iPhone Settings.`
  );
}

export function requestTimeoutMessage(): string {
  if (isProductionMode() || getApiBaseUrl().startsWith('https://')) {
    return 'Request timed out. Cloud server may be waking up — wait and try again.';
  }
  return 'Request timed out. Check that the backend is running on your Mac.';
}
