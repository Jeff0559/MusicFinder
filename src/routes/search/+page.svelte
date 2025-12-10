<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { currentAudio, currentPreview, playPreview as startPreview, stopPreview } from '$lib/stores/audio';
  import { recent } from '$lib/stores/recent';
  import { vibeScores } from '$lib/stores/vibeScores';

  // Design tokens for playlists
  const curatedPlaylists = [
    { title: 'Grunge Revolution', subtitle: '90s alt energy', color: '#66BB6A' },
    { title: 'Sounds of the 90s', subtitle: 'Nostalgic anthems', color: '#FFA726' },
    { title: 'Darkness & Rebellion', subtitle: 'Moody guitars', color: '#AB47BC' },
    { title: 'Cult Rock Albums', subtitle: 'Iconic records', color: '#42A5F5' },
    { title: 'Emotional Dark Mix', subtitle: 'Slow burn vibes', color: '#EF5350' },
    { title: 'Late Night Drive', subtitle: 'Cinematic', color: '#26C6DA' }
  ];

  let searchQuery = $state('');
  let searchType: 'track' | 'album' | 'artist' = $state('track');
  let results: any[] = $state([]);

  let isLoading = $state(false);
  let errorMsg = $state('');
  let youtubeId: string | null = $state(null);
  let ytLoading = $state(false);
  let youtubeTitle: string = $state('');
  let currentPreviewUrl: string | null = $state(null);
  let isPlaying = $state(false);
  let scoreLoadingId: string | null = $state(null);
  let vibeMatches: any[] = $state([]);
  let lastScore: { score: number; energy: number; valence: number; danceability: number; tempo: number } | null = $state(null);
  let autoScore = $state(false);
  let lastAutoScoreId: string | null = $state(null);
  let initializedFromUrl = $state(false);

  $: heroTrack = results?.[0] ?? null;
  $: heroImage = heroTrack ? getImage(heroTrack) : '';

  async function handleSearch() {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    isLoading = true;
    errorMsg = '';

    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Search failed (${resp.status}): ${text || resp.statusText}`);
      }
      const data = await resp.json();

      const list =
        Array.isArray(data)
          ? data
          : data?.tracks?.items
            ?? data?.albums?.items
            ?? data?.artists?.items
            ?? [];

      results = list;
      recent.add(searchQuery);
      if (searchType === 'track') {
        lastAutoScoreId = null;
        enrichGenres(list);
      }
    } catch (e) {
      console.error('handleSearch failed', e);
      errorMsg = 'Search failed. Please try again.';
      results = [];
    } finally {
      isLoading = false;
    }
  }

  function clearSearch() {
    searchQuery = '';
    results = [];
    errorMsg = '';
    stopPreview();
    stopYouTube();
    vibeMatches = [];
    lastScore = null;
  }

  $effect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  });

  $effect(() => {
    const q = $page.url.searchParams.get('q') ?? '';
    const t = ($page.url.searchParams.get('type') ?? '').toLowerCase();
    if (initializedFromUrl) return;
    if (!q) return;
    searchQuery = q;
    if (t === 'album' || t === 'artist' || t === 'track') {
      searchType = t as typeof searchType;
    }
    initializedFromUrl = true;
    handleSearch();
  });

  $effect(() => {
    if (!autoScore) return;
    if (searchType !== 'track') return;
    if (!results.length) return;
    const first = results[0];
    if (!first?.id || scoreLoadingId) return;
    if (lastAutoScoreId === first.id) return;
    lastAutoScoreId = first.id;
    scoreAndRecommend(first);
  });

  const getImage = (item: any) =>
    item?.images?.[0]?.url
    ?? item?.album?.images?.[0]?.url
    ?? item?.album?.images?.[1]?.url
    ?? item?.artists?.[0]?.images?.[0]?.url
    ?? '';

  const getTitle = (item: any) =>
    item?.name
    ?? item?.album?.name
    ?? item?.track?.name
    ?? '';

  const getSubtitle = (item: any) => {
    if (searchType === 'track') {
      const artist = item?.artists?.[0]?.name ?? '';
      const album = item?.album?.name ?? '';
      return [artist, album].filter(Boolean).join(' / ');
    }
    if (searchType === 'album') {
      const artist = item?.artists?.[0]?.name ?? '';
      const year = item?.release_date?.slice?.(0, 4) ?? '';
      return [artist, year].filter(Boolean).join(' / ');
    }
    const followers = item?.followers?.total?.toLocaleString?.() ?? '';
    const pop = item?.popularity ?? '';
    return [followers ? `${followers} Follower` : '', pop ? `Popularity ${pop}` : ''].filter(Boolean).join(' / ');
  };

  const getPreviewUrl = (item: any) =>
    item?.preview_url
    ?? item?.track?.preview_url
    ?? null;

  const genrePixelMap: Record<string, string> = {
    pop: 'https://media.tenor.com/2bQ0g5zn-SAAAAAd/michael-jackson-mj.gif',
    'hip hop': 'https://media.tenor.com/fgR2H7W82dAAAAAd/kendrick-lamar-pixel.gif',
    rap: 'https://media.tenor.com/fgR2H7W82dAAAAAd/kendrick-lamar-pixel.gif',
    rock: 'https://media.tenor.com/fiE37UfDqIAAAAAd/rockstar-guitar.gif',
    edm: 'https://media.tenor.com/fXkR5Xrgd3EAAAAd/dj-pixel.gif',
    electronic: 'https://media.tenor.com/fXkR5Xrgd3EAAAAd/dj-pixel.gif',
    jazz: 'https://media.tenor.com/dakvK5vn7i4AAAAi/jazz-piano.gif',
    country: 'https://media.tenor.com/y0tuE4-krsEAAAAd/cowboy-pixel.gif',
    latin: 'https://media.tenor.com/SMH7FQJq5vMAAAAd/dancing-pixel.gif',
    metal: 'https://media.tenor.com/mM8y7rDJG0QAAAAd/metal-guitar.gif',
    reggae: 'https://media.tenor.com/GpwuQnpnHJAAAAAd/reggae-rasta.gif',
    rnb: 'https://media.tenor.com/HyTRTDJx6GQAAAAd/slow-jam.gif'
  };

  const getGenreTag = (item: any): string | null => {
    const genres = [
      ...(item?.artists?.flatMap((a: any) => a?.genres ?? []) ?? []),
      ...(item?.album?.genres ?? []),
      ...(item?.genres ?? [])
    ];
    if (!genres.length) return null;
    const g = genres.find((g) => typeof g === 'string' && genrePixelMap[g.toLowerCase()]);
    return g ? g.toLowerCase() : null;
  };

  async function enrichGenres(list: any[]) {
    const artistIds = Array.from(
      new Set(
        list
          .flatMap((it) => (it?.artists ?? []).map((a: any) => a?.id).filter(Boolean))
      )
    ).slice(0, 10);

    if (!artistIds.length) return;

    try {
      const details = await Promise.all(
        artistIds.map(async (id) => {
          try {
            const resp = await fetch(`/api/artist/${encodeURIComponent(id)}`);
            if (!resp.ok) return null;
            return await resp.json();
          } catch {
            return null;
          }
        })
      );

      const genreMap = new Map<string, string[]>();
      details.forEach((d: any) => {
        if (d?.id && Array.isArray(d.genres)) {
          genreMap.set(d.id, d.genres);
        }
      });

      results = list.map((it) => {
        if (!it?.artists) return it;
        const artists = it.artists.map((a: any) => {
          const g = genreMap.get(a?.id);
          return g ? { ...a, genres: g } : a;
        });
        return { ...it, artists };
      });
    } catch (e) {
      console.error('enrichGenres failed', e);
    }
  }

  const getExternalUrl = (item: any) =>
    item?.external_urls?.spotify
    ?? item?.album?.external_urls?.spotify
    ?? item?.artists?.[0]?.external_urls?.spotify
    ?? null;

  function handlePreview(item: any) {
    const previewUrl = getPreviewUrl(item);

    if (!previewUrl) {
      playYouTube(item);
      return;
    }

    if (currentPreviewUrl === previewUrl && isPlaying) {
      stopPreview();
      return;
    }

    const genreTag = getGenreTag(item);
    const albumImage =
      (genreTag && genrePixelMap[genreTag])
        ? genrePixelMap[genreTag]
        : getImage(item) || null;

    startPreview(previewUrl, {
      id: item?.id ?? item?.uri,
      name: getTitle(item),
      artists: (item?.artists ?? item?.album?.artists ?? [])
        .map((a: any) => a?.name)
        .filter(Boolean),
      albumImage
    });
  }

  async function scoreAndRecommend(item: any) {
    if (!item?.id) return;
    scoreLoadingId = item.id;
    errorMsg = '';

    try {
      const featResp = await fetch(`/api/features/${item.id}`);
      if (!featResp.ok) {
        const txt = await featResp.text();
        throw new Error(txt || 'Features request failed');
      }
      const f = await featResp.json();
      const energy = Math.round((f.energy ?? 0) * 100);
      const valence = Math.round((f.valence ?? 0) * 100);
      const dance = Math.round((f.danceability ?? 0) * 100);
      const tempo = Math.round(f.tempo ?? 120);

      const tempoScore = Math.min(tempo, 200) / 200 * 100;
      const score = Math.max(0, Math.min(100, Math.round(
        energy * 0.35 + valence * 0.25 + dance * 0.25 + tempoScore * 0.15
      )));

      vibeScores.record({
        id: item.id,
        name: getTitle(item),
        artist: item?.artists?.[0]?.name ?? '',
        type: 'track',
        energy,
        valence,
        danceability: dance,
        tempo,
        genre: item?.artists?.[0]?.genres?.[0] ?? item?.album?.genres?.[0] ?? null,
        score,
        ts: Date.now()
      });

      lastScore = { score, energy, valence, danceability: dance, tempo };

      const params = new URLSearchParams({
        energy: String(energy),
        valence: String(valence),
        danceability: String(dance),
        tempo: String(tempo),
        genre: (item?.artists?.[0]?.genres?.[0] ?? 'pop'),
        seedTrack: item.id
      });

      const recResp = await fetch(`/api/vibe?${params.toString()}`);
      const rec = recResp.ok ? await recResp.json() : [];
      vibeMatches = Array.isArray(rec) ? rec : [];
    } catch (e) {
      console.error('scoreAndRecommend failed', e);
      errorMsg = 'Scoring oder Empfehlung fehlgeschlagen.';
      vibeMatches = [];
    } finally {
      scoreLoadingId = null;
    }
  }

  async function playYouTube(item: any) {
    ytLoading = true;
    youtubeId = null;
    youtubeTitle = getTitle(item);
    errorMsg = '';

    const artist = item?.artists?.[0]?.name ?? '';
    const query = [getTitle(item), artist, 'official audio'].filter(Boolean).join(' ');

    try {
      const yt = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`).then(r => r.json());
      youtubeId = yt?.videoId ?? null;
      if (!youtubeId) {
        errorMsg = 'Kein YouTube-Video gefunden.';
      }
    } catch (e) {
      console.error('YouTube lookup failed', e);
      errorMsg = 'YouTube-Suche fehlgeschlagen.';
    } finally {
      ytLoading = false;
    }
  }

  function stopYouTube() {
    youtubeId = null;
    youtubeTitle = '';
  }

  const unsubAudio = currentAudio.subscribe((audio) => {
    if (!audio) {
      isPlaying = false;
      return;
    }

    try {
      isPlaying = !audio.paused;
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
  <section class="search-panel">
    <div class="search-row">
      <div class="search-input-wrap">
        <input
          class="search-input"
          bind:value={searchQuery}
          placeholder="Search for songs, artists or albums"
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {#if searchQuery.trim()}
          <button class="clear-btn" onclick={clearSearch} aria-label="Clear search">×</button>
        {/if}
      </div>
      <button class="btn primary" onclick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </div>

    <div class="tabs">
      <label><input type="radio" bind:group={searchType} value="track" /> Songs</label>
      <label><input type="radio" bind:group={searchType} value="album" /> Alben</label>
      <label><input type="radio" bind:group={searchType} value="artist" /> Artists</label>
    </div>

    <label class="autoscore">
      <input type="checkbox" bind:checked={autoScore} />
      Auto Score & Match nach der Suche (erstes Ergebnis)
    </label>

    {#if errorMsg}
      <p class="error">{errorMsg}</p>
    {/if}
  </section>

  <section class="hero" style={heroImage ? `background-image: linear-gradient(180deg, rgba(20,20,20,0.6), rgba(20,20,20,0.9)), url(${heroImage})` : ''}>
    <div class="hero-content">
      <p class="eyebrow">Overview</p>
      <h1>{heroTrack ? getTitle(heroTrack) : 'Search your vibe'}</h1>
      <p class="subtitle">{heroTrack ? getSubtitle(heroTrack) : 'Tippe einen Begriff ein, wir spielen sofort los.'}</p>
      <div class="hero-actions">
        {#if heroTrack}
          <button class="btn primary" onclick={() => handlePreview(heroTrack)}>
            {getPreviewUrl(heroTrack) ? (currentPreviewUrl === getPreviewUrl(heroTrack) && isPlaying ? 'Pause' : 'Play first') : 'Play on YouTube'}
          </button>
          <button class="btn secondary" onclick={() => scoreAndRecommend(heroTrack)} disabled={scoreLoadingId === heroTrack.id}>
            {scoreLoadingId === heroTrack?.id ? 'Scoring...' : 'Match Vibe'}
          </button>
        {:else}
          <button class="btn ghost" disabled>Keine Auswahl</button>
        {/if}
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-header">
      <div class="panel-title">
        <h2>Popular songs</h2>
        {#if results.length} <span class="count">{results.length}</span> {/if}
      </div>
    </div>

    {#if results.length === 0 && !isLoading}
      <p class="muted">Keine Ergebnisse. Suche starten und wir bauen deine Liste.</p>
    {:else}
      <div class="tracklist">
        {#each results.slice(0, 12) as item, idx (item.id ?? item.uri ?? item.name)}
          <div class="track-row">
            <div class="track-num">{idx + 1}</div>
            <div class="track-main">
              <div class="track-title">{getTitle(item)}</div>
              <div class="track-sub">{getSubtitle(item)}</div>
            </div>
            <div class="track-actions">
              <button class="btn ghost" onclick={() => handlePreview(item)}>
                {getPreviewUrl(item) ? (currentPreviewUrl === getPreviewUrl(item) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <button class="btn secondary" onclick={() => scoreAndRecommend(item)} disabled={scoreLoadingId === item.id}>
                {scoreLoadingId === item.id ? 'Scoring...' : 'Match Vibe'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="panel">
    <div class="panel-header">
      <h2>In playlists</h2>
    </div>
    <div class="playlist-grid">
      {#each curatedPlaylists as pl}
        <div class="playlist-card" style={`background:${pl.color}`}>
          <div class="playlist-title">{pl.title}</div>
          <div class="playlist-sub">{pl.subtitle}</div>
        </div>
      {/each}
    </div>
  </section>

  {#if youtubeId}
    <div class="yt-player">
      <div class="yt-header">
        <div class="mp-title">{youtubeTitle || 'YouTube'}</div>
        <button class="btn secondary" onclick={stopYouTube}>Close</button>
      </div>
      <iframe
        width="100%"
        height="220"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
        title="YouTube player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
        allowfullscreen
      ></iframe>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    background: #141414;
    color: #ffffff;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 20px 12px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .search-panel {
    background: #1e1e1e;
    border: 1px solid #2c2c2c;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }

  .search-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .search-input-wrap {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 12px 42px 12px 12px;
    border-radius: 12px;
    border: 1px solid #2c2c2c;
    background: #0f0f0f;
    color: #fff;
    font-size: 16px;
  }

  .search-input:focus {
    outline: 2px solid #00e676;
    border-color: #00e676;
  }

  .clear-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #bdbdbd;
    font-size: 18px;
    cursor: pointer;
  }

  .tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    color: #bdbdbd;
  }

  .tabs label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 24px;
    border: 1px solid #2c2c2c;
    background: #2c2c2c;
  }

  .autoscore {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #bdbdbd;
    font-size: 14px;
  }

  .btn {
    border: none;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 120ms ease, opacity 120ms ease;
  }
  .btn:active { transform: translateY(1px); }
  .btn.primary {
    background: linear-gradient(135deg, #00e676, #42a5f5);
    color: #0f0f0f;
  }
  .btn.secondary {
    background: #2c2c2c;
    color: #ffffff;
    border: 1px solid #3a3a3a;
  }
  .btn.ghost {
    background: transparent;
    color: #bdbdbd;
    border: 1px dashed #3a3a3a;
  }

  .hero {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    min-height: 220px;
    background: #1e1e1e;
    border: 1px solid #2c2c2c;
    display: flex;
    align-items: flex-end;
  }

  .hero-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 12px;
    color: #bdbdbd;
    margin: 0;
  }

  .hero h1 {
    margin: 0;
    font-size: 28px;
  }

  .subtitle {
    margin: 0;
    color: #bdbdbd;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }

  .panel {
    background: #1e1e1e;
    border: 1px solid #2c2c2c;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel h2 {
    margin: 0;
    font-size: 20px;
  }

  .count {
    background: #2c2c2c;
    border: 1px solid #353535;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 13px;
    color: #bdbdbd;
  }

  .tracklist {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .track-row {
    display: grid;
    grid-template-columns: 32px 1fr 240px;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 12px;
    background: #2c2c2c;
  }

  .track-num {
    color: #757575;
    font-weight: 700;
  }

  .track-main {
    min-width: 0;
  }

  .track-title {
    color: #ffffff;
    font-weight: 700;
    margin: 0;
  }

  .track-sub {
    color: #bdbdbd;
    font-size: 14px;
    margin: 0;
  }

  .track-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .playlist-card {
    border-radius: 16px;
    padding: 14px;
    color: #0f0f0f;
    min-height: 100px;
    box-shadow: 0 8px 22px rgba(0,0,0,0.35);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 4px;
  }

  .playlist-title {
    font-weight: 800;
  }

  .playlist-sub {
    font-size: 14px;
    color: rgba(0,0,0,0.8);
  }

  .muted {
    color: #757575;
    margin: 0;
  }

  .error {
    color: #ffb3b0;
    margin: 0;
  }

  .yt-player {
    position: fixed;
    right: 18px;
    bottom: 90px;
    width: min(420px, calc(100% - 48px));
    background: #1e1e1e;
    border: 1px solid #2c2c2c;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .yt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media (max-width: 960px) {
    .hero-actions {
      flex-direction: column;
      align-items: flex-start;
    }
    .track-row {
      grid-template-columns: 24px 1fr;
      grid-template-rows: auto auto;
    }
    .track-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
</style>
