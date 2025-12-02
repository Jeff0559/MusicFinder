import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export const currentAudio = writable<HTMLAudioElement | null>(null);

export const currentPreview = writable<{
    id?: string;
    name?: string;
    artists?: string[];
    albumImage?: string | null;
    previewUrl?: string | null;
} | null>(null);

const initialVolume = browser
    ? parseFloat(localStorage.getItem('mf_volume') ?? '1')
    : 1;

const initialMuted = browser
    ? localStorage.getItem('mf_muted') === 'true'
    : false;

export const volume = writable<number>(initialVolume);
export const muted = writable<boolean>(initialMuted);

export function playPreview(
    previewUrl: string,
    meta?: { id?: string; name?: string; artists?: string[]; albumImage?: string | null }
) {
    if (!previewUrl) return;

    const audio = new Audio(previewUrl);

    currentAudio.update(a => {
        if (a) {
            try { a.pause(); } catch {}
        }
        return audio;
    });

    currentPreview.set({
        id: meta?.id,
        name: meta?.name,
        artists: meta?.artists,
        albumImage: meta?.albumImage ?? null,
        previewUrl
    });

    try {
        audio.volume = Math.max(0, Math.min(1, get(volume)));
        audio.muted = get(muted);
    } catch {}

    audio.play();

    audio.onended = () => {
        currentAudio.update(a => (a === audio ? null : a));
        currentPreview.update(p => (p?.previewUrl === previewUrl ? null : p));
    };
}

export function stopPreview() {
    currentAudio.update(a => {
        if (a) {
            try { a.pause(); } catch {}
        }
        return null;
    });
    currentPreview.set(null);
}

export function setVolume(v: number) {
    const next = Math.max(0, Math.min(1, v));
    volume.set(next);

    if (browser) {
        localStorage.setItem('mf_volume', String(next));
    }

    currentAudio.update(a => {
        if (a) a.volume = next;
        return a;
    });
}

export function toggleMute() {
    const next = !get(muted);
    muted.set(next);

    if (browser) {
        localStorage.setItem('mf_muted', String(next));
    }

    currentAudio.update(a => {
        if (a) a.muted = next;
        return a;
    });
}

if (browser) {
    volume.subscribe(v => {
        currentAudio.update(a => {
            if (a) a.volume = Math.max(0, Math.min(1, v));
            return a;
        });
    });

    muted.subscribe(m => {
        currentAudio.update(a => {
            if (a) a.muted = !!m;
            return a;
        });
    });
}
