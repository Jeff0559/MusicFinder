<script lang="ts">
  import { onDestroy } from 'svelte';
  import VibeBar from '$lib/components/VibeBar.svelte';
  import { currentAudio, currentPreview, playPreview as startPreview, stopPreview } from '$lib/stores/audio';

  type Preset = {
    label: string;
    energy: number;
    valence: number;
    danceability: number;
    tempo: number;
    genre: string;
  };

  const presets: Preset[] = [
    { label: 'Chill', energy: 35, valence: 55, danceability: 50, tempo: 90, genre: 'chill' },
    { label: 'Focus', energy: 45, valence: 40, danceability: 45, tempo: 80, genre: 'study' },
    { label: 'Party', energy: 85, valence: 80, danceability: 88, tempo: 124, genre: 'party' },
    { label: 'Feelgood', energy: 70, valence: 90, danceability: 75, tempo: 118, genre: 'pop' },
    { label: 'Workout', energy: 90, valence: 65, danceability: 82, tempo: 128, genre: 'work-out' }
  ];

  let energy = $state(70);
  let valence = $state(65);
  let danceability = $state(70);
  let tempo = $state(120);
  let genre = $state('pop');

  let tracks: any[] = $state([]);
  let isLoading = $state(false);
  let errorMsg = $state('');
  let currentPreviewUrl: string | null = $state(null);
  let isPlaying = $state(false);
  let sessionQueue: any[] = $state([]);
  let sessionIndex = $state(0);
  let sessionTargets: { energy: number; valence: number; danceability: number; tempo: number; genre: string } | null = $state(null);

  async function matchVibe() {
    isLoading = true;
    errorMsg = '';

    const params = new URLSearchParams({
      energy: String(Math.round(energy)),
      valence: String(Math.round(valence)),
      danceability: String(Math.round(danceability)),
      tempo: String(Math.round(tempo)),
      genre
    });

    try {
      const resp = await fetch(`/api/vibe?${params.toString()}`);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Request failed');
      }
      const data = await resp.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response');
      }
      tracks = data;
    } catch (e) {
      console.error('matchVibe failed', e);
      errorMsg = 'Vibe Match fehlgeschlagen. Bitte erneut versuchen.' + (e instanceof Error && e.message ? ` (${e.message})` : '');
      tracks = [];
    } finally {
      isLoading = false;
    }
  }

  function applyPreset(preset: Preset) {
    energy = preset.energy;
    valence = preset.valence;
    danceability = preset.danceability;
    tempo = preset.tempo;
    genre = preset.genre;
    matchVibe();
  }

  const getImage = (item: any) =>
    item?.album?.images?.[0]?.url
    ?? item?.images?.[0]?.url
    ?? item?.artists?.[0]?.images?.[0]?.url
    ?? '';

  const getTitle = (item: any) => item?.name ?? item?.track?.name ?? '';

  const getSubtitle = (item: any) => {
    const artist = item?.artists?.[0]?.name ?? item?.track?.artists?.[0]?.name ?? '';
    const album = item?.album?.name ?? item?.track?.album?.name ?? '';
    return [artist, album].filter(Boolean).join(' / ');
  };

  const getPreviewUrl = (item: any) =>
    item?.preview_url
    ?? item?.track?.preview_url
    ?? null;

  const getExternalUrl = (item: any) =>
    item?.external_urls?.spotify
    ?? item?.album?.external_urls?.spotify
    ?? item?.artists?.[0]?.external_urls?.spotify
    ?? null;

  function playTrack(item: any) {
    const previewUrl = getPreviewUrl(item);

    if (!previewUrl) {
      const link = getExternalUrl(item);
      if (link && typeof window !== 'undefined') {
        window.open(link, '_blank', 'noreferrer');
      }
      return;
    }

    startPreview(previewUrl, {
      id: item?.id ?? item?.uri,
      name: getTitle(item),
      artists: (item?.artists ?? item?.album?.artists ?? [])
        .map((a: any) => a?.name)
        .filter(Boolean),
      albumImage: getImage(item) || null
    });
  }

  function handlePreview(item: any) {
    const previewUrl = getPreviewUrl(item);

    if (!previewUrl) {
      const link = getExternalUrl(item);
      if (link && typeof window !== 'undefined') {
        window.open(link, '_blank', 'noreferrer');
      }
      return;
    }

    if (currentPreviewUrl === previewUrl && isPlaying) {
      stopPreview();
      return;
    }

    startPreview(previewUrl, {
      id: item?.id ?? item?.uri,
      name: getTitle(item),
      artists: (item?.artists ?? item?.album?.artists ?? [])
        .map((a: any) => a?.name)
        .filter(Boolean),
      albumImage: getImage(item) || null
    });
  }

  function startSession(from: any[] = tracks) {
    if (!from.length) return;
    sessionQueue = from;
    sessionIndex = 0;
    sessionTargets = { energy, valence, danceability, tempo, genre };
    playSessionCurrent();
  }

  function addToSession(item: any) {
    sessionQueue = [...sessionQueue, item];
    if (!sessionTargets) {
      sessionTargets = { energy, valence, danceability, tempo, genre };
    }
  }

  function playSessionCurrent() {
    const track = sessionQueue[sessionIndex];
    if (!track) return;
    playTrack(track);
  }

  function nextSession() {
    if (!sessionQueue.length) return;
    sessionIndex = (sessionIndex + 1) % sessionQueue.length;
    playSessionCurrent();
  }

  const unsubAudio = currentAudio.subscribe((audio) => {
    if (!audio) {
      isPlaying = false;
      return;
    }

    try {
      isPlaying = !audio.paused;
      const sessionTrack = sessionQueue[sessionIndex];
      const sessionPreview = sessionTrack ? getPreviewUrl(sessionTrack) : null;
      if (sessionPreview) {
        audio.onended = () => {
          if (sessionPreview === getPreviewUrl(sessionQueue[sessionIndex] ?? {})) {
            nextSession();
          }
        };
      }
    } catch {
      isPlaying = false;
    }
  });

  const unsubPreview = currentPreview.subscribe((preview) => {
    currentPreviewUrl = preview?.previewUrl ?? null;
  });

  onDestroy(() => {
    unsubAudio();
    unsubPreview();
  });
</script>

<main class="page">
  <header class="hero">
    <div>
      <p class="eyebrow">Vibe Matcher</p>
      <h1>Finde Songs nach deiner Stimmung</h1>
      <p class="lede">
        Setze die Scores f&uuml;r Energy, Valence, Danceability und Tempo &ndash; wir holen dir Tracks,
        die genau zu diesem Vibe passen.
      </p>
      <div class="preset-row">
        {#each presets as p}
          <button class="chip" onclick={() => applyPreset(p)}>{p.label}</button>
        {/each}
      </div>
    </div>
    <div class="hero-card">
      <div class="card-grid">
        <VibeBar label="Energy" value={energy} color="var(--color-accent-blue)" />
        <VibeBar label="Valence" value={valence} color="var(--color-primary)" />
        <VibeBar label="Danceability" value={danceability} color="#f0b90b" />
        <VibeBar label="Tempo" value={tempo} max={200} unit=" BPM" color="#ff6b6b" />
      </div>
    </div>
  </header>

  <section class="controls-card">
    <div class="control">
      <div class="label-row">
        <label for="energy">Energy</label>
        <span>{Math.round(energy)}%</span>
      </div>
      <input id="energy" type="range" min="0" max="100" bind:value={energy} />
    </div>
    <div class="control">
      <div class="label-row">
        <label for="valence">Valence (Mood)</label>
        <span>{Math.round(valence)}%</span>
      </div>
      <input id="valence" type="range" min="0" max="100" bind:value={valence} />
    </div>
    <div class="control">
      <div class="label-row">
        <label for="danceability">Danceability</label>
        <span>{Math.round(danceability)}%</span>
      </div>
      <input id="danceability" type="range" min="0" max="100" bind:value={danceability} />
    </div>
    <div class="control">
      <div class="label-row">
        <label for="tempo">Tempo</label>
        <span>{Math.round(tempo)} BPM</span>
      </div>
      <input id="tempo" type="range" min="70" max="190" step="1" bind:value={tempo} />
    </div>

    <div class="control select-row">
      <div>
        <label for="genre">Seed Genre</label>
        <p class="muted">Wir nutzen es als Spotify-Seed, falls kein Track gesetzt ist.</p>
      </div>
      <select id="genre" bind:value={genre}>
        <option value="pop">Pop</option>
        <option value="rock">Rock</option>
        <option value="dance">Dance</option>
        <option value="edm">EDM</option>
        <option value="hip-hop">Hip-Hop</option>
        <option value="chill">Chill</option>
        <option value="study">Focus</option>
        <option value="party">Party</option>
        <option value="work-out">Workout</option>
        <option value="latin">Latin</option>
        <option value="jazz">Jazz</option>
      </select>
    </div>

    <div class="actions">
      <button class="primary" onclick={matchVibe} disabled={isLoading}>
        {isLoading ? 'Matching...' : 'Match Vibe'}
      </button>
      <button class="ghost" onclick={() => { tracks = []; errorMsg = ''; }}>
        Reset
      </button>
      <button class="primary" onclick={() => startSession(tracks)} disabled={!tracks.length}>
        Start Vibe Session
      </button>
    </div>

    {#if errorMsg}
      <p class="error">{errorMsg}</p>
    {/if}
  </section>

  <section class="results">
    <div class="results-header">
      <h2>Empfohlene Tracks</h2>
      {#if tracks.length} <span class="count">{tracks.length}</span> {/if}
    </div>

    {#if !tracks.length && !isLoading && !errorMsg}
      <p class="muted">W&auml;hle einen Vibe aus und starte die Suche.</p>
    {:else}
      <div class="grid">
        {#each tracks as item (item.id ?? item.uri ?? item.name)}
          <article class="card">
            {#if getImage(item)}
              <img src={getImage(item)} alt={getTitle(item)} loading="lazy" />
            {:else}
              <div class="placeholder">No Image</div>
            {/if}
            <h3>{getTitle(item)}</h3>
            {#if getSubtitle(item)}
              <p class="subtitle">{getSubtitle(item)}</p>
            {/if}
            <div class="actions">
              <button class="play-btn" onclick={() => handlePreview(item)}>
                {getPreviewUrl(item) ? (currentPreviewUrl === getPreviewUrl(item) && isPlaying ? 'Pause' : 'Play') : 'Open'}
              </button>
              {#if currentPreviewUrl === getPreviewUrl(item) && isPlaying}
                <button class="play-btn secondary" onclick={stopPreview}>Stop</button>
              {/if}
              <button class="play-btn secondary" onclick={() => addToSession(item)}>
                Add to Session
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  {#if sessionQueue.length}
    <section class="results">
      <div class="results-header">
        <h2>Vibe Session</h2>
        <span class="count">{sessionQueue.length}</span>
      </div>
      {#if sessionTargets}
        <p class="muted">Fixiert auf Energy {sessionTargets.energy} / Valence {sessionTargets.valence} / Dance {sessionTargets.danceability} / Tempo {sessionTargets.tempo} ({sessionTargets.genre})</p>
      {/if}
      <div class="grid">
        {#each sessionQueue as item, idx (item.id ?? item.uri ?? item.name)}
          <article class="card" class:active={idx === sessionIndex}>
            {#if getImage(item)}
              <img src={getImage(item)} alt={getTitle(item)} loading="lazy" />
            {:else}
              <div class="placeholder">No Image</div>
            {/if}
            <h3>{getTitle(item)}</h3>
            {#if getSubtitle(item)}
              <p class="subtitle">{getSubtitle(item)}</p>
            {/if}
            <div class="actions">
              <button class="play-btn" onclick={() => { sessionIndex = idx; playSessionCurrent(); }}>
                {idx === sessionIndex ? 'Playing' : 'Play'}
              </button>
              <button class="play-btn secondary" onclick={() => { sessionQueue = sessionQueue.filter((_, i) => i !== idx); }}>
                Remove
              </button>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    background-color: #0c0f14;
    min-height: 100vh;
    position: relative;
  }
  :global(body)::before {
    content: '';
    position: fixed;
    inset: -10%;
    background: url('/bg-vibe.gif?v=2') center/cover no-repeat;
    transform: scale(0.85);
    transform-origin: center;
    z-index: -2;
    pointer-events: none;
  }
  :global(body)::after {
    content: '';
    position: fixed;
    inset: 0;
    background: linear-gradient(180deg, rgba(10, 12, 16, 0.52), rgba(10, 12, 16, 0.74));
    z-index: -1;
    pointer-events: none;
  }

  .page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 18px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hero {
    display: grid;
    grid-template-columns: 2fr 1.1fr;
    gap: 24px;
    background: linear-gradient(135deg, rgba(61, 224, 116, 0.12), rgba(50, 181, 255, 0.08));
    border: 1px solid #1e262f;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9fb0c6;
    font-size: 12px;
    margin: 0 0 6px 0;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #e8ecf2;
  }

  .lede {
    color: #c1cedd;
    margin: 10px 0 16px 0;
    max-width: 640px;
  }

  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .chip {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid #2b323c;
    color: #e8ecf2;
    padding: 8px 12px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    border-color: #3de074;
    color: #3de074;
  }

  .hero-card {
    background: #111620;
    border: 1px solid #1e262f;
    border-radius: 12px;
    padding: 16px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .controls-card {
    background: #12161e;
    border: 1px solid #222a35;
    border-radius: 14px;
    padding: 18px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
    align-items: center;
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #c5d4e8;
    font-size: 14px;
  }

  input[type="range"] {
    accent-color: #3de074;
  }

  .select-row {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  select {
    background: #0f131a;
    color: #e8ecf2;
    border-radius: 10px;
    border: 1px solid #2b323c;
    padding: 10px 12px;
    min-width: 160px;
  }

  .actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 10px;
  }

  .primary {
    padding: 12px 18px;
    border-radius: 12px;
    border: 1px solid #2b323c;
    background: linear-gradient(135deg, #3de074, #32b5ff);
    color: #0d1118;
    font-weight: 700;
    cursor: pointer;
    min-width: 140px;
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ghost {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #2b323c;
    background: transparent;
    color: #c5d4e8;
    cursor: pointer;
  }

  .results {
    background: #12161e;
    border-radius: 12px;
    border: 1px solid #222a35;
    padding: 14px;
    min-height: 220px;
  }

  .results-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .results h2 {
    margin: 0;
    font-size: 18px;
  }

  .count {
    background: #1f2631;
    border: 1px solid #2b323c;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 13px;
    color: #c5d4e8;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
    margin-top: 8px;
  }

  .card {
    background: #161b24;
    border: 1px solid #1f2631;
    border-radius: 10px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .card img,
  .card .placeholder {
    width: 100%;
    height: 140px;
    border-radius: 8px;
    object-fit: cover;
    background: #0f131a;
  }

  .placeholder {
    display: grid;
    place-items: center;
    color: #70829c;
    border: 1px dashed #2b323c;
  }

  .card h3 {
    margin: 0;
    font-size: 15px;
    color: #e8ecf2;
  }

  .subtitle {
    margin: 0;
    font-size: 13px;
    color: #9fb0c6;
  }

  .actions .play-btn {
    flex: 1;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #2b323c;
    background: linear-gradient(135deg, #3de074, #32b5ff);
    color: #0d1118;
    font-weight: 700;
    cursor: pointer;
  }

  .card.active {
    border-color: #3de074;
    box-shadow: 0 0 0 2px rgba(61, 224, 116, 0.25);
  }

  .play-btn.secondary {
    background: #1f2631;
    color: #c5d4e8;
  }

  .muted {
    color: #9fb0c6;
    margin: 0;
  }

  .error {
    grid-column: 1 / -1;
    color: #ff9ca0;
    margin: 0;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .controls-card {
      grid-template-columns: 1fr;
    }
    .select-row {
      flex-direction: column;
      align-items: flex-start;
    }
    .actions {
      flex-direction: column;
    }
    .primary,
    .ghost {
      width: 100%;
      text-align: center;
    }
  }
</style>
