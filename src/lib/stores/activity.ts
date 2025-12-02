import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ActivityEntry = {
  ts: number;
  trackId: string;
  track: string;
  artist: string;
  action: 'similar' | 'select' | 'play';
};

const KEY = 'mf_activity_v1';

function createStore() {
  const initial: ActivityEntry[] = browser
    ? JSON.parse(localStorage.getItem(KEY) || '[]')
    : [];
  const { subscribe, set, update } = writable<ActivityEntry[]>(initial);

  function log(entry: ActivityEntry) {
    update((list) => {
      const next = [...list, entry];
      if (browser) localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  function clear() {
    set([]);
    if (browser) localStorage.removeItem(KEY);
  }

  return { subscribe, log, clear };
}

export const activity = createStore();
