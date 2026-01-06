<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentAudio, currentPreview, stopPreview, volume, muted, setVolume, toggleMute } from '$lib/stores/audio';
  import { writable } from 'svelte/store';

  let audio: HTMLAudioElement | null = null;
  let preview: { id?: string; name?: string; artists?: string[]; albumImage?: string | null; previewUrl?: string | null } | null = null;

  const progress = writable(0);
  const duration = writable(0);
  const isPlaying = writable(false);
  const vol = volume; // alias for template usage
  const isMuted = muted;

  let unsubAudio: () => void;
  let unsubPreview: () => void;
  let unsubVolume: () => void;
  let unsubMuted: () => void;
  let collapsed = false;
  let isSeeking = false;

  function formatTime(s: number) {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  let globalKeyHandler: (e: KeyboardEvent) => void;

  onMount(() => {
    unsubAudio = currentAudio.subscribe(a => {
      if (audio && audio !== a) {
        // cleanup old audio listeners
        try { audio.ontimeupdate = null; audio.onplay = null; audio.onpause = null; } catch {}
      }
      audio = a;

      if (audio) {
        isPlaying.set(!audio.paused);
        duration.set(audio.duration || 30);
        const el = audio; // capture for closure
        el.ontimeupdate = () => {
          progress.set(el.currentTime || 0);
          duration.set(el.duration || 30);
        };
        el.onplay = () => isPlaying.set(true);
        el.onpause = () => isPlaying.set(false);
      } else {
        isPlaying.set(false);
        progress.set(0);
        duration.set(0);
      }
    });

    unsubPreview = currentPreview.subscribe(p => (preview = p));

    // global keyboard shortcuts (space to toggle, left/right seek)
    globalKeyHandler = (e: KeyboardEvent) => {
      // ignore when typing into inputs
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        if (audio) audio.currentTime = Math.max(0, (audio.currentTime || 0) - 5);
      } else if (e.key === 'ArrowRight') {
        if (audio) audio.currentTime = Math.min((audio.duration || 30), (audio.currentTime || 0) + 5);
      }
    };
    window.addEventListener('keydown', globalKeyHandler);
    unsubVolume = volume.subscribe(v => {
      // no-op in UI, audio element updated from store in audio.ts
    });
    unsubMuted = muted.subscribe(m => {
      // UI reacts to $isMuted
    });
  });

  onDestroy(() => {
    unsubAudio && unsubAudio();
    unsubPreview && unsubPreview();
    unsubVolume && unsubVolume();
    unsubMuted && unsubMuted();
    if (globalKeyHandler) window.removeEventListener('keydown', globalKeyHandler);
  });

  function togglePlay() {
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function handleStop() {
    stopPreview();
  }

  function clickSeek(e: MouseEvent) {
    if (!audio) return;
    const el = (e.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = (audio.duration || 30) * pos;
  }

  function startDrag(e: MouseEvent) {
    isSeeking = true;
    const onMove = (ev: MouseEvent) => {
      if (!audio) return;
      const target = document.querySelector('.np-progress') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      audio.currentTime = (audio.duration || 30) * pos;
    };
    const onUp = () => {
      isSeeking = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function progressKeydown(e: KeyboardEvent) {
    if (!audio) return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      audio.currentTime = Math.max(0, (audio.currentTime || 0) - 5);
    } else if (e.key === 'ArrowRight') {
      audio.currentTime = Math.min((audio.duration || 30), (audio.currentTime || 0) + 5);
    } else if (e.key === 'Home') {
      audio.currentTime = 0;
    } else if (e.key === 'End') {
      audio.currentTime = audio.duration || 30;
    }
  }

  function toggleCollapse() {
    collapsed = !collapsed;
  }
</script>

{#if preview && preview.previewUrl}
  <div class="nowplaying" role="region" aria-label="Now playing preview">
    <div class="np-header">
      <div class="np-header-left">Now previewing</div>
      <div class="np-header-right">
        <button class="np-min" onclick={toggleCollapse} aria-label={collapsed ? 'Expand player' : 'Collapse player'}>{collapsed ? '▣' : '—'}</button>
      </div>
    </div>
    <div class="np-left">
      {#if preview.albumImage}
        <img src={preview.albumImage} alt={preview.name} />
      {:else}
        <div class="no-art">🎵</div>
      {/if}
    </div>

    <div class="np-mid" class:collapsed={collapsed}>
      <div class="np-title">{preview.name}</div>
      <div class="np-sub">{preview.artists ? preview.artists.join(', ') : ''}</div>
      <div class="np-progress" onclick={clickSeek} onmousedown={startDrag} onkeydown={progressKeydown} tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(($progress/$duration)*100 || 0)} aria-label="Playback position">
        <div class="bar" style="width: {($duration ? ($progress / $duration) * 100 : 0)}%"></div>
      </div>
      <div class="np-times">
        <small>{$progress ? formatTime($progress) : '0:00'}</small>
        <small>{formatTime($duration)}</small>
      </div>
    </div>

      <div class="np-right">
      <button class="np-btn" onclick={togglePlay} aria-label={$isPlaying ? 'Pause' : 'Play'}>
        {#if $isPlaying}⏸{:else}▶{/if}
      </button>
      <button class="np-btn np-stop" onclick={handleStop} aria-label="Stop">⏹</button>
      <div class="np-volume">
        <button class="mute-btn" onclick={toggleMute} aria-label={$isMuted ? 'Unmute' : 'Mute'}>{$isMuted ? '🔈' : '🔊'}</button>
        <input type="range" min="0" max="1" step="0.01" value={$vol} oninput={(e) => setVolume(parseFloat((e.target as HTMLInputElement).value))} aria-label="Volume" />
      </div>
    </div>
  </div>
{/if}

<style>
  .nowplaying {
    position: fixed;
    right: 1.125rem;
    bottom: 1.125rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: linear-gradient(90deg, rgba(29,185,84,0.08), rgba(30,144,255,0.04));
    border: 0.0625rem solid rgba(255,255,255,0.06);
    border-radius: 0.75rem;
    box-shadow: 0 0.375rem 1.25rem rgba(0,0,0,0.45);
    z-index: var(--z-modal);
    color: var(--color-text-primary);
    width: min(26.25rem, calc(100% - 4rem));
  }

  .np-left img { width:3.5rem; height:3.5rem; object-fit:cover; border-radius:0.5rem; }
  .no-art { width:3.5rem; height:3.5rem; display:flex; align-items:center; justify-content:center; background:var(--color-bg-light); border-radius:0.5rem; }

  .np-mid { flex:1; min-width: 0; }
  .np-title { font-weight: 700; font-size: 0.875rem; margin-bottom:0.125rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .np-sub { color: var(--color-text-secondary); font-size:0.75rem; margin-bottom:0.375rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .np-progress { width:100%; height:0.375rem; background: rgba(255,255,255,0.03); border-radius:0.375rem; overflow:hidden; }
  .np-progress .bar { height:100%; background: linear-gradient(90deg,var(--color-primary), var(--color-accent-blue)); width:0%; }

  .np-times { display:flex; justify-content:space-between; color:var(--color-text-secondary); font-size:0.6875rem; margin-top:0.25rem; }

  .np-right { display:flex; gap:0.5rem; align-items:center; }
  .np-btn { all:unset; width:2.25rem; height:2.25rem; display:flex; align-items:center; justify-content:center; border-radius:0.625rem; cursor:pointer; background:var(--color-primary); color:var(--color-text-primary); }
  .np-stop { background: #d62a42; }

  /* header / collapse */
  .np-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
  .np-header-left { font-size:0.75rem; color:var(--color-text-secondary); }
  .np-min { all:unset; cursor:pointer; padding:0.25rem 0.5rem; border-radius:0.375rem; background:transparent; color:var(--color-text-secondary); }

  /* collapsed state: show a compact bar */
  .np-mid.collapsed { display:flex; gap:0.5rem; align-items:center; }
  .np-mid.collapsed .np-progress, .np-mid.collapsed .np-times { display:none; }

  /* volume controls */
  .np-volume { display:flex; align-items:center; gap:0.5rem; }
  .mute-btn { all:unset; width:2.125rem; height:2.125rem; display:flex; align-items:center; justify-content:center; border-radius:0.5rem; background:transparent; cursor:pointer; }
  .np-volume input[type="range"] { width:6rem; accent-color: var(--color-primary); }

  @media (max-width: 40rem) { .nowplaying { left: 0.75rem; right: 0.75rem; bottom: 0.75rem; width: auto; } }
</style>