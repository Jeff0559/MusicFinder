import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'mf_recent_v1';
const load = () => (browser ? JSON.parse(localStorage.getItem(KEY) || '[]') : []) as string[];

const { subscribe, set, update } = writable<string[]>(load());
export const recent = {
  subscribe,
  add(term: string) {
    update(list => {
      const t = term.trim();
      if (!t) return list;
      const next = [t, ...list.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 10);
      if (browser) localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  },
  clear() {
    set([]);
    if (browser) localStorage.removeItem(KEY);
  }
};
