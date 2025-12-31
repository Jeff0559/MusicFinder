<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { currentAudio, currentPreview, playPreview as startPreview, stopPreview } from '$lib/stores/audio';
  import { recent } from '$lib/stores/recent';
  import { vibeScores } from '$lib/stores/vibeScores';

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
  let albumTracks: any[] = $state([]);
  let albumTracksLoading = $state(false);
  let albumTracksError = $state('');
  let selectedAlbumTitle = $state('');
  let userReviews: any[] = $state([]);
  let reviewsLoaded = $state(false);

  const resultKey = (item: any) => {
    const t = normalize(getTitle(item));
    const a = normalize((item?.artists ?? item?.album?.artists ?? [])[0]?.name ?? '');
    const id = item?.id ?? item?.uri ?? '';
    return `${t}|${a}|${id}`;
  };

  const heroTrack = $derived(results?.[0] ?? null);
  const heroImage = $derived(heroTrack ? getImage(heroTrack) : '');
  const heroIsTrack = $derived(isTrack(heroTrack));
  const uniqueResults = $derived(
    Array.from(new Map((results ?? []).map((r) => [resultKey(r), r])).values())
  );

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
    albumTracks = [];
    albumTracksError = '';
    selectedAlbumTitle = '';
    // Reviews behalten, damit Treffer sofort angezeigt werden
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

  onMount(() => {
    loadUserReviews();
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

  const isTrack = (item: any) => {
    if (!item) return false;
    if (item.type === 'track') return true;
    if (typeof item.duration_ms === 'number') return true;
    if (item.album && item.artists) return true;
    return false;
  };

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

    recent.add(getTitle(item));
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
    const trackId = item?.id ?? item?.track?.id ?? null;
    if (!trackId) {
      errorMsg = 'Kein Track ausgewaehlt.';
      return;
    }
    if (!isTrack(item)) {
      errorMsg = 'Match Vibe funktioniert nur fuer Songs. Bitte einen Track waehlen.';
      return;
    }
    scoreLoadingId = trackId;
    errorMsg = '';

    try {
      let f: any = null;
      try {
        const featResp = await fetch(`/api/features/${trackId}`);
        if (featResp.ok) {
          f = await featResp.json();
        }
      } catch (err) {
        console.warn('features request failed, using defaults', err);
      }

      const energy = Math.round(((f?.energy ?? 0.6) as number) * 100);
      const valence = Math.round(((f?.valence ?? 0.5) as number) * 100);
      const dance = Math.round(((f?.danceability ?? 0.5) as number) * 100);
      const tempo = Math.round((f?.tempo as number) ?? 120);

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
        seedTrack: trackId
      });

      try {
        const recResp = await fetch(`/api/vibe?${params.toString()}`);
        const rec = recResp.ok ? await recResp.json() : [];
        const matches = Array.isArray(rec) ? rec : [];
        vibeMatches = matches;
        if (!matches.length) {
          errorMsg = 'Keine Vibe-Matches gefunden. Probiere einen anderen Song.';
        }
      } catch (err) {
        console.warn('vibe recs failed, returning empty', err);
        vibeMatches = [];
        errorMsg = 'Keine Vibe-Matches gefunden. Probiere einen anderen Song.';
      }
    } catch (e) {
      console.error('scoreAndRecommend failed', e);
      errorMsg = 'Scoring oder Empfehlung fehlgeschlagen (verwende einen Song mit Preview oder probiere erneut).';
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
    recent.add(getTitle(item));

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

  function handlePlaylistClick(title: string) {
    searchType = 'track';
    searchQuery = title;
    handleSearch();
  }

  async function loadAlbumTracks(album: any) {
    if (!album?.id) return;
    albumTracksLoading = true;
    albumTracksError = '';
    selectedAlbumTitle = album?.name ?? '';
    albumTracks = [];
    try {
      const resp = await fetch(`/api/album/${album.id}`);
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const data = await resp.json();
      const tracks = data?.tracks?.items ?? [];
      albumTracks = Array.isArray(tracks) ? tracks : [];
    } catch (err) {
      console.error('loadAlbumTracks failed', err);
      albumTracksError = 'Album-Titel konnten nicht geladen werden.';
    } finally {
      albumTracksLoading = false;
    }
  }

  async function loadUserReviews() {
    try {
      const resp = await fetch('/api/user-reviews');
      if (!resp.ok) return;
      const data = await resp.json();
      userReviews = Array.isArray(data.reviews) ? data.reviews : [];
      reviewsLoaded = true;
    } catch (err) {
      console.error('loadUserReviews failed', err);
      reviewsLoaded = false;
    }
  }

  const normalize = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  const matchReview = (item: any) => {
    if (!reviewsLoaded || !item) return null;
    const name = normalize(getTitle(item));
    const artistList: string[] = (item?.artists ?? item?.album?.artists ?? []).map((a: any) => normalize(a?.name ?? '')).filter(Boolean);
    const artist = artistList[0] ?? '';
    const trackAlbum = normalize(item?.album?.name ?? '');

    return userReviews.find((r) => {
      const rn = normalize(r.trackName ?? '');
      const ra = normalize(r.artist ?? '');
      const rAlbum = normalize(r.album ?? '');
      const nameMatch = rn === name || rn.includes(name) || name.includes(rn);
      const artistMatch =
        ra === artist ||
        ra.includes(artist) ||
        artist.includes(ra) ||
        artistList.some((a) => a === ra || a.includes(ra) || ra.includes(a));
      const albumMatch = rAlbum && trackAlbum ? (rAlbum === trackAlbum || rAlbum.includes(trackAlbum) || trackAlbum.includes(rAlbum)) : false;
      return nameMatch && (artistMatch || albumMatch || !ra || artistList.length === 0);
    }) ?? null;
  };

  const matchedReviews = $derived(userReviews.filter((r) => {
    if (!heroTrack) return false;
    const name = normalize(getTitle(heroTrack));
    const artistList: string[] = (heroTrack?.artists ?? heroTrack?.album?.artists ?? [])
      .map((a: any) => normalize(a?.name ?? ''))
      .filter(Boolean);
    const artist = artistList[0] ?? '';
    const trackAlbum = normalize(heroTrack?.album?.name ?? '');

    const rn = normalize(r.trackName ?? '');
    const ra = normalize(r.artist ?? '');
    const rAlbum = normalize(r.album ?? '');
    const nameMatch = rn === name || rn.includes(name) || name.includes(rn);
    const artistMatch =
      ra === artist ||
      ra.includes(artist) ||
      artist.includes(ra) ||
      artistList.some((a) => a === ra || a.includes(ra) || ra.includes(a));
    const albumMatch = rAlbum && trackAlbum ? (rAlbum === trackAlbum || rAlbum.includes(trackAlbum) || trackAlbum.includes(rAlbum)) : false;
    return nameMatch && (artistMatch || albumMatch || !ra || artistList.length === 0);
  }));

  const fmtDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('de-DE');
  };

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
          <button class="btn primary is-play" onclick={() => handlePreview(heroTrack)}>
            {getPreviewUrl(heroTrack) ? (currentPreviewUrl === getPreviewUrl(heroTrack) && isPlaying ? 'Pause' : 'Play first') : 'Play on YouTube'}
          </button>
          {#if heroIsTrack}
            <button class="btn secondary" onclick={() => scoreAndRecommend(heroTrack)} disabled={scoreLoadingId === heroTrack.id}>
              {scoreLoadingId === heroTrack?.id ? 'Scoring...' : 'Match Vibe'}
            </button>
          {:else if searchType === 'album'}
            <button class="btn secondary" onclick={() => loadAlbumTracks(heroTrack)}>
              Album-Titel anzeigen
            </button>
          {:else}
            <button class="btn ghost" disabled>nur fuer Songs</button>
          {/if}
        {:else}
          <button class="btn ghost" disabled>Keine Auswahl</button>
        {/if}
      </div>
    </div>
  </section>

  {#if matchedReviews.length}
    <aside class="review-side">
      <div class="panel review-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>Dein Review</h2>
          </div>
        </div>
        <div class="review-cards">
          {#each matchedReviews as r (r.id ?? r.trackName)}
            <div class="review-card">
              <div class="review-header-row">
                <div>
                  <div class="review-title">{r.trackName}</div>
                  <div class="review-sub">{r.artist}</div>
                </div>
                <div class="review-rating">{r.rating?.toFixed?.(1) ?? '–'} / 5</div>
              </div>
              {#if r.notes}
                <p class="review-notes">{r.notes}</p>
              {/if}
              <div class="review-footer-row">
                <span class="review-date">{fmtDate(r.createdAt ?? r.date)}</span>
                {#if r.album}<span class="review-album">{r.album}</span>{/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </aside>
  {/if}

  {#if searchType === 'album'}
    <section class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <h2>Album Tracks {selectedAlbumTitle ? `- ${selectedAlbumTitle}` : ''}</h2>
          {#if albumTracksLoading} <span class="count">Loading...</span> {/if}
        </div>
      </div>

      {#if albumTracksError}
        <p class="error">{albumTracksError}</p>
      {:else if albumTracksLoading}
        <p class="muted">Lade Tracks...</p>
      {:else if !albumTracks.length}
        <p class="muted">Album auswaehlen, um die Titel zu sehen.</p>
      {:else}
        <div class="tracklist">
          {#each albumTracks as track (track.id ?? track.uri ?? track.name)}
            <div class="track-row">
              <div class="track-num">♪</div>
              <div class="track-main">
                <div class="track-title">{track.name}</div>
                <div class="track-sub">{track.artists?.[0]?.name ?? ''}</div>
              </div>
              <div class="track-actions">
                {#if matchReview(track)}
                  <div class="review-chip small">
                    <span>Review {matchReview(track)?.rating?.toFixed?.(1) ?? ''}/5</span>
                    {#if matchReview(track)?.notes}
                      <span class="review-note">{matchReview(track)?.notes}</span>
                    {/if}
                  </div>
                {/if}
              <button class="btn primary is-play" onclick={() => handlePreview(track)}>
                {getPreviewUrl(track) ? (currentPreviewUrl === getPreviewUrl(track) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <a class="btn secondary" href={getExternalUrl(track) ?? '#'} target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

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
        {#each uniqueResults.slice(0, 12) as item, idx (item.id ?? item.uri ?? item.name)}
          <div class="track-row" class:playing={getPreviewUrl(item) && currentPreviewUrl === getPreviewUrl(item) && isPlaying}>
            <div class="track-num">{idx + 1}</div>
            <div class="track-main">
              <div class="track-title">{getTitle(item)}</div>
              <div class="track-sub">{getSubtitle(item)}</div>
            </div>
            <div class="track-actions">
              <button class="btn primary is-play" onclick={() => handlePreview(item)}>
                {getPreviewUrl(item) ? (currentPreviewUrl === getPreviewUrl(item) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              {#if searchType === 'album'}
                <button class="btn secondary" onclick={() => loadAlbumTracks(item)}>
                  Tracks
                </button>
              {:else}
                <button class="btn secondary" onclick={() => scoreAndRecommend(item)} disabled={scoreLoadingId === item.id || !isTrack(item)}>
                  {isTrack(item)
                    ? (scoreLoadingId === item.id ? 'Scoring...' : 'Match Vibe')
                    : 'Nur Songs'}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="panel">
    <div class="panel-header">
      <div class="panel-title">
        <h2>Vibe Matches</h2>
        {#if scoreLoadingId}
          <span class="count">loading...</span>
        {/if}
      </div>
      {#if lastScore}
        <div class="score-chip">Score {lastScore.score}</div>
      {/if}
    </div>

    {#if vibeMatches.length === 0}
      <p class="muted">Noch keine Empfehlungen. Waehle einen Track und klicke "Match Vibe".</p>
    {:else}
      <div class="vibe-grid">
        {#each vibeMatches.slice(0, 8) as match (match.id ?? match.uri ?? match.name)}
          <div class="vibe-card">
            <div class="vibe-main">
              <div class="vibe-title">{getTitle(match)}</div>
              <div class="vibe-sub">{getSubtitle(match)}</div>
            </div>
            <div class="vibe-actions">
              <button class="btn primary is-play" onclick={() => handlePreview(match)}>
                {getPreviewUrl(match) ? (currentPreviewUrl === getPreviewUrl(match) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <a class="btn secondary" href={getExternalUrl(match) ?? '#'} target="_blank" rel="noreferrer">
                Open
              </a>
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
        <button class="playlist-card" style={`background:${pl.color}`} onclick={() => handlePlaylistClick(pl.title)} type="button">
          <div class="playlist-title">{pl.title}</div>
          <div class="playlist-sub">{pl.subtitle}</div>
        </button>
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
    background-color: #101217;
    min-height: 100vh;
    color: #ffffff;
    position: relative;
  }
  :global(body)::before {
    content: '';
    position: fixed;
    inset: -10%;
    background: url('/bg-search.gif?v=2') center/cover no-repeat;
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
    padding: 14px 44px 14px 14px;
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
    padding: 12px 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 120ms ease, opacity 120ms ease;
  }
  .btn:active { transform: translateY(1px); }
  .btn.is-play {
    box-shadow: 0 10px 24px rgba(0, 230, 118, 0.25);
  }
  .btn.is-play:hover {
    transform: translateY(-1px) scale(1.02);
  }
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
    flex-wrap: wrap;
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
    gap: 10px;
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
    background: #20252d;
    border: 1px solid #2c2c2c;
    transition: border 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  }
  .track-row:hover {
    border-color: rgba(56, 224, 127, 0.5);
    transform: translateY(-1px);
  }
  .track-row.playing {
    border-color: #3de074;
    box-shadow: 0 0 0 2px rgba(61, 224, 116, 0.2);
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
    font-size: 15px;
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
    flex-wrap: wrap;
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
    border: none;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }

  .playlist-title {
    font-weight: 800;
  }

  .playlist-sub {
    font-size: 14px;
    color: rgba(0,0,0,0.8);
  }

  .playlist-card:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .playlist-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(0,0,0,0.45);
  }

  .vibe-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }

  .vibe-card {
    border: 1px solid #2c2c2c;
    border-radius: 12px;
    padding: 12px;
    background: #111;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vibe-title {
    font-weight: 700;
    color: #fff;
  }

  .vibe-sub {
    color: #bdbdbd;
    font-size: 14px;
  }

  .vibe-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .score-chip {
    background: #2c2c2c;
    border: 1px solid #3a3a3a;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 13px;
    color: #bdbdbd;
  }

  .review-panel .review-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  .review-card {
    border: 1px solid #2c2c2c;
    border-radius: 12px;
    padding: 10px 12px;
    background: #151515;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .review-header-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .review-title {
    font-weight: 700;
  }

  .review-sub {
    color: #bdbdbd;
    font-size: 13px;
  }

  .review-rating {
    font-weight: 700;
    color: #00e676;
  }

  .review-notes {
    margin: 0;
    color: #e0e0e0;
    font-size: 14px;
  }

  .review-footer-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #bdbdbd;
  }

  .review-album {
    color: #8ab4ff;
  }

  .review-side {
    position: absolute;
    right: 18px;
    top: 120px;
    width: min(340px, calc(100% - 32px));
    z-index: 2;
  }

  .review-chip {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    background: #252525;
    border: 1px solid #3a3a3a;
    padding: 6px 10px;
    border-radius: 12px;
    color: #fff;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .review-chip.small {
    padding: 4px 8px;
    font-size: 12px;
  }

  .review-note {
    color: #bdbdbd;
    font-size: 12px;
  }

  .album-tracklist .track-row {
    grid-template-columns: 32px 1fr 200px;
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
