import api from './api';

/** Fetch API data without throwing — returns fallback on failure or timeout. */
export async function safeGet<T>(path: string, fallback: T, timeoutMs = 60_000): Promise<T> {
  try {
    const { data } = await api.get(path, { timeout: timeoutMs });
    if (data?.success && data.data !== undefined) return data.data as T;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function safePost<T>(path: string, body: unknown, fallback: T, timeoutMs = 60_000): Promise<T> {
  try {
    const { data } = await api.post(path, body, { timeout: timeoutMs });
    if (data?.success && data.data !== undefined) return data.data as T;
    return fallback;
  } catch {
    return fallback;
  }
}
