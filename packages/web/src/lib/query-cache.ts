type CacheEnvelope<T> = {
  value: T;
  cachedAtMs: number;
  expiresAtMs: number;
};

type CacheOptions = {
  ttlMs?: number;
  earlyRefreshRatio?: number;
  maxInflightLoads?: number;
  persistToSessionStorage?: boolean;
};

const DEFAULT_TTL_MS = 12_000;
const DEFAULT_EARLY_REFRESH_RATIO = 0.7;
const DEFAULT_MAX_INFLIGHT_LOADS = 8;
const SESSION_PREFIX = "tp:query-cache:";

const memoryCache = new Map<string, CacheEnvelope<unknown>>();
const inflightLoads = new Map<string, Promise<unknown>>();

let activeLoads = 0;

function getStorageKey(key: string) {
  return `${SESSION_PREFIX}${key}`;
}

function safeReadFromSessionStorage<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.expiresAtMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWriteToSessionStorage<T>(key: string, value: CacheEnvelope<T>) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch {
    // Ignore storage quota or privacy mode errors.
  }
}

function safeDeleteFromSessionStorage(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getStorageKey(key));
  } catch {
    // Ignore storage errors.
  }
}

function isExpired(entry: CacheEnvelope<unknown>, nowMs: number) {
  return nowMs >= entry.expiresAtMs;
}

function shouldRefreshEarly(
  entry: CacheEnvelope<unknown>,
  nowMs: number,
  earlyRefreshRatio: number
) {
  if (earlyRefreshRatio <= 0 || earlyRefreshRatio >= 1) return false;

  const ttlMs = Math.max(1, entry.expiresAtMs - entry.cachedAtMs);
  const ageMs = Math.max(0, nowMs - entry.cachedAtMs);
  const ageRatio = ageMs / ttlMs;

  if (ageRatio < earlyRefreshRatio) return false;

  const normalized = (ageRatio - earlyRefreshRatio) / (1 - earlyRefreshRatio);
  const refreshProbability = Math.min(1, Math.max(0, normalized));

  return Math.random() < refreshProbability;
}

function getResolvedOptions(options?: CacheOptions) {
  return {
    ttlMs: options?.ttlMs ?? DEFAULT_TTL_MS,
    earlyRefreshRatio: options?.earlyRefreshRatio ?? DEFAULT_EARLY_REFRESH_RATIO,
    maxInflightLoads: options?.maxInflightLoads ?? DEFAULT_MAX_INFLIGHT_LOADS,
    persistToSessionStorage: options?.persistToSessionStorage ?? true,
  };
}

function readCacheEntry<T>(key: string, options?: CacheOptions): CacheEnvelope<T> | null {
  const memoryEntry = memoryCache.get(key) as CacheEnvelope<T> | undefined;
  if (memoryEntry) return memoryEntry;

  const resolved = getResolvedOptions(options);
  if (!resolved.persistToSessionStorage) return null;

  const stored = safeReadFromSessionStorage<T>(key);
  if (stored) {
    memoryCache.set(key, stored as CacheEnvelope<unknown>);
  }

  return stored;
}

function writeCacheEntry<T>(key: string, value: T, options?: CacheOptions) {
  const resolved = getResolvedOptions(options);
  const nowMs = Date.now();
  const envelope: CacheEnvelope<T> = {
    value,
    cachedAtMs: nowMs,
    expiresAtMs: nowMs + Math.max(1_000, resolved.ttlMs),
  };

  memoryCache.set(key, envelope as CacheEnvelope<unknown>);

  if (resolved.persistToSessionStorage) {
    safeWriteToSessionStorage(key, envelope);
  }

  return envelope;
}

async function loadWithCoalescing<T>(
  key: string,
  loader: () => Promise<T>,
  options?: CacheOptions
) {
  const existingInflight = inflightLoads.get(key) as Promise<T> | undefined;
  if (existingInflight) {
    return existingInflight;
  }

  const resolved = getResolvedOptions(options);

  if (activeLoads >= resolved.maxInflightLoads) {
    const fallback = readCacheEntry<T>(key, options);
    if (fallback) {
      return fallback.value;
    }
    throw new Error("Backpressure protection: too many in-flight cache loads");
  }

  activeLoads += 1;

  const loadPromise = (async () => {
    const loadedValue = await loader();
    writeCacheEntry(key, loadedValue, options);
    return loadedValue;
  })();

  inflightLoads.set(key, loadPromise as Promise<unknown>);

  try {
    return await loadPromise;
  } finally {
    inflightLoads.delete(key);
    activeLoads = Math.max(0, activeLoads - 1);
  }
}

export async function getOrLoadCached<T>(
  key: string,
  loader: () => Promise<T>,
  options?: CacheOptions
) {
  const resolved = getResolvedOptions(options);
  const nowMs = Date.now();
  const entry = readCacheEntry<T>(key, options);

  if (entry && !isExpired(entry, nowMs)) {
    if (
      shouldRefreshEarly(entry, nowMs, resolved.earlyRefreshRatio) &&
      !inflightLoads.has(key)
    ) {
      void loadWithCoalescing(key, loader, options).catch(() => {
        // Best-effort background refresh; keep serving current cached value.
      });
    }

    return entry.value;
  }

  try {
    return await loadWithCoalescing(key, loader, options);
  } catch (error) {
    if (entry) {
      return entry.value;
    }
    throw error;
  }
}

export function clearCacheKey(key: string) {
  memoryCache.delete(key);
  inflightLoads.delete(key);
  safeDeleteFromSessionStorage(key);
}

export function clearCacheByPrefix(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      inflightLoads.delete(key);
      safeDeleteFromSessionStorage(key);
    }
  }

  if (typeof window !== "undefined") {
    const removals: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const storageKey = window.sessionStorage.key(index);
      if (!storageKey) continue;
      if (storageKey.startsWith(`${SESSION_PREFIX}${prefix}`)) {
        removals.push(storageKey);
      }
    }

    removals.forEach((storageKey) => {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors.
      }
    });
  }
}

export function clearSessionQueryCache() {
  memoryCache.clear();
  inflightLoads.clear();

  if (typeof window === "undefined") return;

  const removals: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index);
    if (!storageKey) continue;
    if (storageKey.startsWith(SESSION_PREFIX)) {
      removals.push(storageKey);
    }
  }

  removals.forEach((storageKey) => {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors.
    }
  });
}
