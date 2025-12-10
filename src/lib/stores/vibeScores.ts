import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type VibeScoreEntry = {
  id: string;
  name: string;
  artist?: string;
  type: 'track' | 'album' | 'artist';
  energy?: number;
  valence?: number;
  danceability?: number;
  tempo?: number;
  genre?: string | null;
  score: number;
  ts: number;
};

const KEY = 'mf_vibe_scores_v1';

const load = (): VibeScoreEntry[] => {
  if (!browser) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as VibeScoreEntry[];
  } catch {
    return [];
  }
};

function persist(list: VibeScoreEntry[]) {
  if (browser) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

function createStore() {
  const { subscribe, set, update } = writable<VibeScoreEntry[]>(load());

  function record(entry: Omit<VibeScoreEntry, 'ts'> & { ts?: number }) {
    const ts = entry.ts ?? Date.now();
    update((list) => {
      const without = list.filter((x) => x.id !== entry.id);
      const next = [{ ...entry, ts }, ...without].slice(0, 80);
      persist(next);
      return next;
    });
  }

  function clear() {
    set([]);
    if (browser) localStorage.removeItem(KEY);
  }

  return { subscribe, record, clear };
}

export const vibeScores = createStore();
