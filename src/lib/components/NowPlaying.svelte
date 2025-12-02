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
    right: 18px;
    bottom: 18px;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    background: linear-gradient(90deg, rgba(29,185,84,0.08), rgba(30,144,255,0.04));
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    z-index: var(--z-modal);
    color: var(--color-text-primary);
    width: min(420px, calc(100% - 64px));
  }

  .np-left img { width:56px; height:56px; object-fit:cover; border-radius:8px; }
  .no-art { width:56px; height:56px; display:flex; align-items:center; justify-content:center; background:var(--color-bg-light); border-radius:8px; }

  .np-mid { flex:1; min-width: 0; }
  .np-title { font-weight: 700; font-size: 14px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .np-sub { color: var(--color-text-secondary); font-size:12px; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .np-progress { width:100%; height:6px; background: rgba(255,255,255,0.03); border-radius:6px; overflow:hidden; }
  .np-progress .bar { height:100%; background: linear-gradient(90deg,var(--color-primary), var(--color-accent-blue)); width:0%; }

  .np-times { display:flex; justify-content:space-between; color:var(--color-text-secondary); font-size:11px; margin-top:4px; }

  .np-right { display:flex; gap:8px; align-items:center; }
  .np-btn { all:unset; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:10px; cursor:pointer; background:var(--color-primary); color:var(--color-text-primary); }
  .np-stop { background: #d62a42; }

  /* header / collapse */
  .np-header { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; }
  .np-header-left { font-size:12px; color:var(--color-text-secondary); }
  .np-min { all:unset; cursor:pointer; padding:4px 8px; border-radius:6px; background:transparent; color:var(--color-text-secondary); }

  /* collapsed state: show a compact bar */
  .np-mid.collapsed { display:flex; gap:8px; align-items:center; }
  .np-mid.collapsed .np-progress, .np-mid.collapsed .np-times { display:none; }

  /* volume controls */
  .np-volume { display:flex; align-items:center; gap:8px; }
  .mute-btn { all:unset; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:transparent; cursor:pointer; }
  .np-volume input[type="range"] { width:96px; accent-color: var(--color-primary); }

  @media (max-width: 640px) { .nowplaying { left: 12px; right: 12px; bottom: 12px; width: auto; } }
</style>