'use client';

import type { FramePerception, SessionState } from './schema';

const STORAGE_KEY = 'drift_session';
const HISTORY_KEY = 'drift_history';

export function generateSessionId(): string {
  return `drift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function createSession(): SessionState {
  const session: SessionState = {
    session_id: generateSessionId(),
    created_at: new Date().toISOString(),
    frames: [],
    frame_count: 0,
  };
  saveSession(session);
  return session;
}

export function saveSession(session: SessionState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function addFrame(perception: FramePerception): SessionState {
  let session = getSession();
  if (!session) session = createSession();
  
  session.frames.push(perception);
  session.frame_count = session.frames.length;
  saveSession(session);
  return session;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  // Archive current session to history before clearing
  const current = getSession();
  if (current && current.frames.length > 0) {
    archiveSession(current);
  }
  localStorage.removeItem(STORAGE_KEY);
}

function archiveSession(session: SessionState): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: SessionState[] = raw ? JSON.parse(raw) : [];
    history.unshift(session);
    // Keep last 5 sessions
    if (history.length > 5) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Silent fail on storage quota
  }
}

export function getHistory(): SessionState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Image storage using IndexedDB
const DB_NAME = 'drift_images';
const STORE_NAME = 'frames';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeImage(frameId: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, frameId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImage(frameId: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(frameId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}
