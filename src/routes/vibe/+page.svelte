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

  const youtubeSearchUrl = (query: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  const pearlMatchTrack = {
    id: 'pearl-shade',
    name: 'Pearl',
    artists: [{ name: 'Sade' }],
    album: { name: 'Pearl', images: [{ url: '/fallback-cover.svg' }] },
    external_urls: {
      youtube: youtubeSearchUrl('Sade Pearl'),
      spotify: 'https://open.spotify.com/search/Pearl%20Sade'
    }
  };

  const fixedMatchTracks = [
    pearlMatchTrack,
    {
      id: 'no-church-in-the-wild',
      name: 'No Church in the Wild',
      artists: [{ name: 'Jay-Z & Kanye West' }, { name: 'Frank Ocean' }],
      album: { name: 'Watch the Throne', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('No Church in the Wild Jay-Z Kanye West Frank Ocean'),
        spotify: 'https://open.spotify.com/search/No%20Church%20in%20the%20Wild'
      }
    },
    {
      id: 'light-common',
      name: 'Light',
      artists: [{ name: 'Common' }],
      album: { name: 'Be', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Common Light'),
        spotify: 'https://open.spotify.com/search/Common%20Light'
      }
    },
    {
      id: '03-adolescence',
      name: '03 Adolescence',
      artists: [{ name: 'J. Cole' }],
      album: { name: '2014 Forest Hills Drive', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('03 Adolescence J. Cole'),
        spotify: 'https://open.spotify.com/search/03%20Adolescence%20J.%20Cole'
      }
    },
    {
      id: 'blinding-lights',
      name: 'Blinding Lights',
      artists: [{ name: 'The Weeknd' }],
      album: { name: 'After Hours', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('The Weeknd Blinding Lights'),
        spotify: 'https://open.spotify.com/search/Blinding%20Lights%20The%20Weeknd'
      }
    },
    {
      id: 'strobe',
      name: 'Strobe',
      artists: [{ name: 'deadmau5' }],
      album: { name: 'For Lack of a Better Name', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('deadmau5 Strobe'),
        spotify: 'https://open.spotify.com/search/deadmau5%20Strobe'
      }
    },
    {
      id: 'so-what',
      name: 'So What',
      artists: [{ name: 'Miles Davis' }],
      album: { name: 'Kind of Blue', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Miles Davis So What'),
        spotify: 'https://open.spotify.com/search/Miles%20Davis%20So%20What'
      }
    },
    {
      id: 'time',
      name: 'Time',
      artists: [{ name: 'Pink Floyd' }],
      album: { name: 'The Dark Side of the Moon', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Pink Floyd Time'),
        spotify: 'https://open.spotify.com/search/Pink%20Floyd%20Time'
      }
    },
    {
      id: 'get-lucky',
      name: 'Get Lucky',
      artists: [{ name: 'Daft Punk' }, { name: 'Pharrell Williams' }],
      album: { name: 'Random Access Memories', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Daft Punk Get Lucky'),
        spotify: 'https://open.spotify.com/search/Get%20Lucky%20Daft%20Punk'
      }
    },
    {
      id: 'redbone',
      name: 'Redbone',
      artists: [{ name: 'Childish Gambino' }],
      album: { name: 'Awaken, My Love!', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Childish Gambino Redbone'),
        spotify: 'https://open.spotify.com/search/Redbone%20Childish%20Gambino'
      }
    },
    {
      id: 'humble',
      name: 'HUMBLE.',
      artists: [{ name: 'Kendrick Lamar' }],
      album: { name: 'DAMN.', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Kendrick Lamar HUMBLE'),
        spotify: 'https://open.spotify.com/search/HUMBLE%20Kendrick%20Lamar'
      }
    }
  ];

  const personaSessionTracks = [
    {
      id: 'persona5-beneath-the-mask',
      name: 'Beneath the Mask',
      artists: [{ name: 'Lyn' }],
      album: { name: 'Persona 5', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Beneath the Mask Persona 5'),
        spotify: 'https://open.spotify.com/search/Beneath%20the%20Mask%20Persona%205'
      }
    },
    {
      id: 'persona5-last-surprise',
      name: 'Last Surprise',
      artists: [{ name: 'Lyn' }],
      album: { name: 'Persona 5', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Last Surprise Persona 5'),
        spotify: 'https://open.spotify.com/search/Last%20Surprise%20Persona%205'
      }
    },
    {
      id: 'persona5-life-will-change',
      name: 'Life Will Change',
      artists: [{ name: 'Lyn' }],
      album: { name: 'Persona 5', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Life Will Change Persona 5'),
        spotify: 'https://open.spotify.com/search/Life%20Will%20Change%20Persona%205'
      }
    },
    {
      id: 'persona5-rivers-in-the-desert',
      name: 'Rivers in the Desert',
      artists: [{ name: 'Lyn' }],
      album: { name: 'Persona 5', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Rivers in the Desert Persona 5'),
        spotify: 'https://open.spotify.com/search/Rivers%20in%20the%20Desert%20Persona%205'
      }
    },
    {
      id: 'persona5-wake-up-get-up',
      name: 'Wake Up, Get Up, Get Out There',
      artists: [{ name: 'Lyn' }],
      album: { name: 'Persona 5', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Wake Up Get Up Get Out There Persona 5'),
        spotify: 'https://open.spotify.com/search/Wake%20Up%20Get%20Up%20Get%20Out%20There%20Persona%205'
      }
    }
  ];

  const trackCache = new Map<string, any>();

  async function fetchSpotifyTrack(name: string, artist: string) {
    const key = `${name}|${artist}`.toLowerCase();
    if (trackCache.has(key)) return trackCache.get(key);
    const query = encodeURIComponent([name, artist].filter(Boolean).join(' '));
    try {
      const resp = await fetch(`/api/search?q=${query}&type=track`);
      if (!resp.ok) return null;
      const list = await resp.json();
      const first = Array.isArray(list) ? list[0] : null;
      if (first) {
        trackCache.set(key, first);
      }
      return first ?? null;
    } catch {
      return null;
    }
  }

  async function hydrateTracks(list: any[]) {
    const hydrated = await Promise.all(
      list.map(async (item) => {
        const artist = item?.artists?.[0]?.name ?? '';
        const match = await fetchSpotifyTrack(item?.name ?? '', artist);
        if (!match) return item;
        return {
          ...match,
          external_urls: {
            ...match.external_urls,
            youtube: item?.external_urls?.youtube
          }
        };
      })
    );
    return hydrated;
  }

  function buildPearlMatches(count = 10, baseList = fixedMatchTracks) {
    return baseList.slice(0, count).map((base) => ({ ...base }));
  }

  let energy = $state(70);
  let valence = $state(65);
  let danceability = $state(70);
  let tempo = $state(120);
  let genre = $state('pop');
  let activePreset = $state<string | null>(null);

  let tracks: any[] = $state([]);
  let isLoading = $state(false);
  let errorMsg = $state('');
  let currentPreviewUrl: string | null = $state(null);
  let isPlaying = $state(false);
  let sessionQueue: any[] = $state([]);
  let sessionIndex = $state(0);
  let sessionTargets: { energy: number; valence: number; danceability: number; tempo: number; genre: string } | null = $state(null);
  const currentSessionTrack = $derived(sessionQueue[sessionIndex] ?? null);
  let sessionYouTubeId: string | null = $state(null);
  let sessionYouTubeTitle: string = $state('');

  async function matchVibe() {
    isLoading = true;
    errorMsg = '';

    try {
      const hydrated = await hydrateTracks(fixedMatchTracks);
      tracks = buildPearlMatches(10, hydrated);
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
    activePreset = preset.label;
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
    item?.external_urls?.youtube
    ?? item?.external_urls?.spotify
    ?? item?.album?.external_urls?.spotify
    ?? item?.artists?.[0]?.external_urls?.spotify
    ?? null;

  function playTrack(item: any) {
    const previewUrl = getPreviewUrl(item);

    if (!previewUrl) {
      errorMsg = 'Kein Preview verfÃ¼gbar. Wiedergabe ist nur im Player mÃ¶glich.';
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
      errorMsg = 'Kein Preview verfÃ¼gbar. Wiedergabe ist nur im Player mÃ¶glich.';
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

  async function startSession(from: any[] = tracks) {
    const hydrated = await hydrateTracks(personaSessionTracks);
    sessionQueue = hydrated;
    sessionIndex = 0;
    sessionTargets = { energy, valence, danceability, tempo, genre };
    playSessionCurrent();
  }

  function closeSession() {
    sessionQueue = [];
    sessionIndex = 0;
    sessionTargets = null;
    sessionYouTubeId = null;
    sessionYouTubeTitle = '';
    stopPreview();
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
    const previewUrl = getPreviewUrl(track);
    if (previewUrl) {
      sessionYouTubeId = null;
      sessionYouTubeTitle = '';
      playTrack(track);
      return;
    }
    playSessionYouTube(track);
  }

  function nextSession() {
    if (!sessionQueue.length) return;
    sessionIndex = (sessionIndex + 1) % sessionQueue.length;
    playSessionCurrent();
  }

  async function playSessionYouTube(track: any) {
    sessionYouTubeTitle = getTitle(track);
    sessionYouTubeId = null;
    const artist = track?.artists?.[0]?.name ?? '';
    const query = [getTitle(track), artist, 'official audio'].filter(Boolean).join(' ');
    try {
      const yt = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`).then(r => r.json());
      sessionYouTubeId = yt?.videoId ?? null;
      if (!sessionYouTubeId) {
        errorMsg = 'Kein YouTube-Video gefunden.';
      }
    } catch (e) {
      console.error('YouTube lookup failed', e);
      errorMsg = 'YouTube-Suche fehlgeschlagen.';
    }
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
      <div class="preset-label">Presets</div>
      <div class="preset-row">
        {#each presets as p}
          <button
            class="chip"
            class:active={activePreset === p.label}
            aria-pressed={activePreset === p.label}
            onclick={() => applyPreset(p)}
          >
            {p.label}
          </button>
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
            <img src={getImage(item) || '/fallback-cover.svg'} alt={getTitle(item)} loading="lazy" />
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
            <img src={getImage(item) || '/fallback-cover.svg'} alt={getTitle(item)} loading="lazy" />
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

  {#if sessionQueue.length}
    <div class="session-player">
      <div class="session-header">
        <div class="session-title">Vibe Session</div>
        <div class="session-header-actions">
          <div class="session-count">{sessionQueue.length} Tracks</div>
          <button class="session-close" onclick={closeSession} aria-label="Close vibe session">x</button>
        </div>
      </div>
      {#if currentSessionTrack}
        <div class="session-now">
          <img src={getImage(currentSessionTrack) || '/fallback-cover.svg'} alt={getTitle(currentSessionTrack)} />
          <div>
            <div class="session-track">{getTitle(currentSessionTrack)}</div>
            <div class="session-artist">{getSubtitle(currentSessionTrack)}</div>
          </div>
        </div>
      {/if}
      <div class="session-actions">
        <button
          class="session-btn primary"
          onclick={() => {
            if (currentSessionTrack && currentPreviewUrl === getPreviewUrl(currentSessionTrack) && isPlaying) {
              stopPreview();
            } else {
              playSessionCurrent();
            }
          }}
        >
          {currentSessionTrack && currentPreviewUrl === getPreviewUrl(currentSessionTrack) && isPlaying ? 'Pause' : 'Play'}
        </button>
        <button class="session-btn" onclick={nextSession}>Next</button>
      </div>
      {#if sessionYouTubeId}
        <iframe
          class="session-yt"
          width="100%"
          height="180"
          src={`https://www.youtube.com/embed/${sessionYouTubeId}?autoplay=1`}
          title={sessionYouTubeTitle || 'YouTube player'}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          allowfullscreen
        ></iframe>
      {/if}
      <ol class="session-list">
        {#each sessionQueue.slice(0, 5) as item, idx (item.id ?? item.uri ?? item.name)}
          <li class:active={idx === sessionIndex}>
            <span>{idx + 1}.</span>
            <span>{getTitle(item)}</span>
          </li>
        {/each}
      </ol>
    </div>
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
    background: linear-gradient(135deg, rgba(61, 224, 116, 0.14), rgba(50, 181, 255, 0.08));
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

  .preset-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8aa0b2;
    margin: 10px 0 6px;
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
  .chip.active {
    background: rgba(61, 224, 116, 0.18);
    border-color: #3de074;
    color: #e8ecf2;
    box-shadow: 0 8px 20px rgba(61, 224, 116, 0.2);
    transform: translateY(-1px);
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
    flex-wrap: wrap;
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
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
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
    grid-auto-rows: 1fr;
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
    transition: transform 140ms ease, border 140ms ease, box-shadow 140ms ease;
  }
  .card:hover {
    transform: translateY(-3px);
    border-color: rgba(61, 224, 116, 0.4);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  }

  .card img {
    width: 100%;
    height: 140px;
    border-radius: 8px;
    object-fit: cover;
    background: #0f131a;
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
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 34px;
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
    transition: transform 140ms ease, box-shadow 140ms ease;
  }
  .actions .play-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(61, 224, 116, 0.2);
  }
  .actions {
    margin-top: auto;
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

  .session-player {
    position: fixed;
    right: 16px;
    bottom: 16px;
    width: 320px;
    background: rgba(15, 19, 26, 0.92);
    border: 1px solid #2b323c;
    border-radius: 14px;
    padding: 12px;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
    z-index: 50;
    backdrop-filter: blur(10px);
  }
  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .session-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .session-title {
    font-weight: 700;
    color: #e8ecf2;
    font-size: 14px;
  }
  .session-count {
    font-size: 12px;
    color: #9fb0c6;
  }
  .session-close {
    border-radius: 8px;
    border: 1px solid #2b323c;
    background: #1f2631;
    color: #c5d4e8;
    padding: 4px 8px;
    cursor: pointer;
    font-weight: 600;
  }
  .session-close:hover {
    border-color: rgba(61, 224, 116, 0.6);
  }
  .session-now {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }
  .session-now img {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid #2b323c;
  }
  .session-track {
    color: #e8ecf2;
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-artist {
    color: #9fb0c6;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  .session-yt {
    border-radius: 10px;
    border: 1px solid #2b323c;
    margin-bottom: 10px;
  }
  .session-btn {
    flex: 1;
    border-radius: 10px;
    border: 1px solid #2b323c;
    background: #1f2631;
    color: #c5d4e8;
    padding: 8px 10px;
    cursor: pointer;
    font-weight: 600;
  }
  .session-btn.primary {
    background: linear-gradient(135deg, #3de074, #32b5ff);
    color: #0d1118;
  }
  .session-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
    font-size: 12px;
    color: #9fb0c6;
  }
  .session-list li {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 6px;
  }
  .session-list li.active {
    color: #e8ecf2;
  }
  @media (max-width: 600px) {
    .session-player {
      right: 12px;
      left: 12px;
      width: auto;
    }
  }
</style>

