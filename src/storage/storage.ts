// The only module that stores data. See design section 8 and requirements 9.4-9.7.
// It touches no global: the caller passes in the backend (localStorage in main.ts).
import type { SessionResult } from '../logic/types';

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StorageData {
  readonly version: 1;
  readonly sessions: SessionResult[];
}

export interface Storage {
  saveSession(result: SessionResult): void;
  loadSessions(): SessionResult[];
  clearAll(): void;
}

export const STORAGE_KEY = 'foamtom:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeSession(value: unknown): value is SessionResult {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    typeof value.timeOfDay === 'string' &&
    typeof value.mode === 'string' &&
    Array.isArray(value.zoneResults) &&
    value.zoneResults.every(isRecord) &&
    Array.isArray(value.monstersEarned) &&
    typeof value.startedAt === 'number' &&
    typeof value.durationSeconds === 'number'
  );
}

export function createStorage(backend: StorageBackend): Storage {
  function loadSessions(): SessionResult[] {
    try {
      const raw = backend.getItem(STORAGE_KEY);
      if (raw === null || raw === undefined) return [];
      const data: unknown = JSON.parse(raw);
      if (!isRecord(data) || data.version !== 1) return [];
      if (!Array.isArray(data.sessions) || !data.sessions.every(looksLikeSession)) return [];
      return data.sessions;
    } catch {
      return [];
    }
  }

  function saveSession(result: SessionResult): void {
    try {
      const data: StorageData = { version: 1, sessions: [...loadSessions(), result] };
      backend.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked: the game plays on and nothing is saved (design section 9).
    }
  }

  function clearAll(): void {
    try {
      backend.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do.
    }
  }

  return { saveSession, loadSessions, clearAll };
}
