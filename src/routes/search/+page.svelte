<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { currentAudio, currentPreview, playPreview as startPreview, stopPreview } from '$lib/stores/audio';
  import { recent } from '$lib/stores/recent';
  import { vibeScores } from '$lib/stores/vibeScores';

  const youtubeSearchUrl = (query: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  const fixedMatchTracks = [
    {
      id: 'pearl-shade',
      name: 'Pearl',
      artists: [{ name: 'Sade' }],
      album: { name: 'Pearl', images: [{ url: '/fallback-cover.svg' }] },
      external_urls: {
        youtube: youtubeSearchUrl('Sade Pearl'),
        spotify: 'https://open.spotify.com/search/Pearl%20Sade'
      }
    },
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

  const trackCache = new Map<string, any>();
  let searchQuery = $state('');
  let searchType: 'track' | 'album' | 'artist' = $state('track');
  let results: any[] = $state([]);

  let isLoading = $state(false);
  let errorMsg = $state('');
  let youtubeId: string | null = $state(null);
  let ytLoading = $state(false);
  let youtubeTitle: string = $state('');
  let currentPreviewUrl: string | null = $state(null);
  let currentPreviewMeta: { name?: string; artists?: string[]; albumImage?: string | null } | null = $state(null);
  let isPlaying = $state(false);
  let scoreLoadingId: string | null = $state(null);
  let vibeMatches: any[] = $state([]);
  let vibeSeeds: any[] = $state([]);
  let artistTopTracks: any[] = $state([]);
  let artistTopLoading = $state(false);
  let artistTopError = $state('');
  let lastScore: { score: number; energy: number; valence: number; danceability: number; tempo: number } | null = $state(null);
  let autoScore = $state(false);
  let lastAutoScoreId: string | null = $state(null);
  let initializedFromUrl = $state(false);
  let albumTracks: any[] = $state([]);
  let albumTracksLoading = $state(false);
  let albumTracksError = $state('');
  let selectedAlbumTitle = $state('');
  let albumSessionQueue: any[] = $state([]);
  let albumSessionIndex = $state(0);
  let albumSessionYouTubeId: string | null = $state(null);
  let albumSessionYouTubeTitle: string = $state('');
  const currentAlbumSessionTrack = $derived(albumSessionQueue[albumSessionIndex] ?? null);
  let userReviews: any[] = $state([]);
  let reviewsLoaded = $state(false);

  const resultKey = (item: any) => {
    const t = normalize(getTitle(item));
    const a = normalize((item?.artists ?? item?.album?.artists ?? [])[0]?.name ?? '');
    const id = item?.id ?? item?.uri ?? '';
    return `${t}|${a}|${id}`;
  };

  const uniqueByKey = (list: any[]) => {
    const seen = new Set<string>();
    const output: any[] = [];
    for (const item of list) {
      const key = resultKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(item);
    }
    return output;
  };

  const removeVibeMatch = (item: any) => {
    const key = resultKey(item);
    vibeMatches = vibeMatches.filter((match) => resultKey(match) !== key);
    vibeSeeds = vibeSeeds.filter((seed) => resultKey(seed) !== key);
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
    vibeSeeds = [];
    lastScore = null;
    artistTopTracks = [];
    artistTopError = '';
    albumTracks = [];
    albumTracksError = '';
    selectedAlbumTitle = '';
    albumSessionQueue = [];
    albumSessionIndex = 0;
    albumSessionYouTubeId = null;
    albumSessionYouTubeTitle = '';
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

  const getYouTubeUrl = (item: any) =>
    item?.external_urls?.youtube
    ?? youtubeSearchUrl([getTitle(item), item?.artists?.[0]?.name ?? ''].filter(Boolean).join(' '));

  async function fetchSpotifyTrack(name: string, artist: string) {
    const key = `${name}|${artist}`.toLowerCase();
    if (trackCache.has(key)) return trackCache.get(key);
    const query = encodeURIComponent([name, artist].filter(Boolean).join(' '));
    try {
      const resp = await fetch(`/api/search?q=${query}&type=track`);
      if (!resp.ok) return null;
      const list = await resp.json();
      const first = Array.isArray(list) ? list[0] : null;
      if (first) trackCache.set(key, first);
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

  function handlePreview(item: any, isSession = false) {
    const previewUrl = getPreviewUrl(item);

    if (!previewUrl) {
      if (!isSession) {
        stopAlbumSessionPlayback();
      }
      playYouTube(item);
      return;
    }

    if (currentPreviewUrl === previewUrl && isPlaying) {
      stopPreview();
      return;
    }

    if (!isSession) {
      stopAlbumSessionPlayback();
      stopYouTube();
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

      const hydrated = await hydrateTracks(fixedMatchTracks);
      const matches = hydrated.length
        ? hydrated.slice(0, 10).map((base) => ({ ...base }))
        : [];
      vibeSeeds = uniqueByKey([item, ...vibeSeeds]).slice(0, 10);
      const withSelected = uniqueByKey([...vibeSeeds, ...matches].filter(Boolean));
      vibeMatches = withSelected.slice(0, 20);
      if (!matches.length) {
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
    stopAlbumSessionPlayback();
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

  function startAlbumSession(tracks: any[]) {
    if (!tracks.length) return;
    stopYouTube();
    albumSessionQueue = tracks;
    albumSessionIndex = 0;
    playAlbumSessionCurrent();
  }

  function closeAlbumSession() {
    albumSessionQueue = [];
    albumSessionIndex = 0;
    albumSessionYouTubeId = null;
    albumSessionYouTubeTitle = '';
    stopPreview();
    stopYouTube();
  }

  function stopAlbumSessionPlayback() {
    albumSessionYouTubeId = null;
    albumSessionYouTubeTitle = '';
    stopPreview();
  }

  function playAlbumSessionCurrent() {
    const track = albumSessionQueue[albumSessionIndex];
    if (!track) return;
    const previewUrl = getPreviewUrl(track);
    if (previewUrl) {
      albumSessionYouTubeId = null;
      albumSessionYouTubeTitle = '';
      handlePreview(track, true);
      return;
    }
    playAlbumSessionYouTube(track);
  }

  function nextAlbumSession() {
    if (!albumSessionQueue.length) return;
    albumSessionIndex = (albumSessionIndex + 1) % albumSessionQueue.length;
    playAlbumSessionCurrent();
  }

  async function playAlbumSessionYouTube(track: any) {
    stopYouTube();
    albumSessionYouTubeTitle = getTitle(track);
    albumSessionYouTubeId = null;
    const artist = track?.artists?.[0]?.name ?? '';
    const query = [getTitle(track), artist, 'official audio'].filter(Boolean).join(' ');
    try {
      const yt = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`).then(r => r.json());
      albumSessionYouTubeId = yt?.videoId ?? null;
      if (!albumSessionYouTubeId) {
        errorMsg = 'Kein YouTube-Video gefunden.';
      }
    } catch (e) {
      console.error('YouTube lookup failed', e);
      errorMsg = 'YouTube-Suche fehlgeschlagen.';
    }
  }

  async function loadArtistTopTracks(artist: any) {
    if (!artist?.id) return;
    artistTopLoading = true;
    artistTopError = '';
    artistTopTracks = [];
    try {
      const resp = await fetch(`/api/artist-top/${encodeURIComponent(artist.id)}`);
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const list = await resp.json();
      artistTopTracks = Array.isArray(list) ? list.slice(0, 5) : [];
      if (!artistTopTracks.length) {
        artistTopError = 'Keine Top-Tracks gefunden.';
      }
    } catch (err) {
      console.error('loadArtistTopTracks failed', err);
      artistTopError = 'Top-Tracks konnten nicht geladen werden.';
    } finally {
      artistTopLoading = false;
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
    currentPreviewMeta = preview
      ? { name: preview.name, artists: preview.artists, albumImage: preview.albumImage }
      : null;
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

  {#if currentPreviewMeta}
    <section class="mini-player">
      <div class="mini-cover">
        <img src={currentPreviewMeta.albumImage || '/fallback-cover.svg'} alt="Now playing cover" />
      </div>
      <div class="mini-info">
        <div class="mini-title">{currentPreviewMeta.name ?? 'Now Playing'}</div>
        <div class="mini-sub">{(currentPreviewMeta.artists ?? []).join(', ')}</div>
      </div>
      <div class="mini-actions">
        <button class="btn secondary" onclick={stopPreview}>Stop</button>
      </div>
    </section>
  {/if}

  <section
    class="hero"
    class:compact={results.length > 0}
    style={heroImage ? `background-image: linear-gradient(180deg, rgba(20,20,20,0.6), rgba(20,20,20,0.9)), url(${heroImage})` : ''}
  >
    <div class="hero-content">
      <p class="eyebrow">Overview</p>
      <h1>{heroTrack ? getTitle(heroTrack) : 'Search your vibe'}</h1>
      <p class="subtitle">{heroTrack ? getSubtitle(heroTrack) : 'Tippe einen Begriff ein, wir spielen sofort los.'}</p>
      <div class="hero-actions">
        {#if heroTrack}
          <button class="btn primary is-play" onclick={() => handlePreview(heroTrack)}>
            {getPreviewUrl(heroTrack) ? (currentPreviewUrl === getPreviewUrl(heroTrack) && isPlaying ? 'Pause' : 'Play first') : 'Play on YouTube'}
          </button>
          {#if searchType === 'artist'}
            <button class="btn secondary" onclick={() => loadArtistTopTracks(heroTrack)} disabled={artistTopLoading}>
              {artistTopLoading ? 'Lade Top 5...' : 'Top 5 Songs'}
            </button>
          {:else if heroIsTrack}
            <button class="btn primary is-match" onclick={() => scoreAndRecommend(heroTrack)} disabled={scoreLoadingId === heroTrack.id}>
              {scoreLoadingId === heroTrack?.id ? 'Scoring...' : 'Match Vibe'}
            </button>
          {:else if searchType === 'album'}
            <button class="btn primary is-match" onclick={() => loadAlbumTracks(heroTrack)}>
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

  {#if searchType === 'artist' && (artistTopLoading || artistTopError || artistTopTracks.length)}
    <section class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <h2>Top 5 Songs</h2>
          {#if artistTopLoading} <span class="count">Loading...</span> {/if}
        </div>
      </div>

      {#if artistTopError}
        <p class="error">{artistTopError}</p>
      {:else if artistTopLoading}
        <p class="muted">Lade Top-Tracks...</p>
      {:else}
        <div class="tracklist">
          {#each artistTopTracks as track (track.id ?? track.uri ?? track.name)}
            <div class="track-row">
              <div class="track-num">#</div>
              <div class="track-main">
                <div class="track-title">{getTitle(track)}</div>
                <div class="track-sub">{getSubtitle(track)}</div>
              </div>
              <div class="track-actions">
              <button class="btn primary is-play" onclick={() => handlePreview(track)}>
                {getPreviewUrl(track) ? (currentPreviewUrl === getPreviewUrl(track) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <button
                class="btn secondary is-match"
                onclick={() => scoreAndRecommend(track)}
                disabled={scoreLoadingId === track.id}
              >
                {scoreLoadingId === track.id ? 'Scoring...' : 'Vibe Matcher'}
              </button>
            </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if matchedReviews.length}
    <section class="panel review-panel">
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
    </section>
  {/if}

  {#if searchType === 'album'}
    <section class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <h2>Album Tracks {selectedAlbumTitle ? `- ${selectedAlbumTitle}` : ''}</h2>
          {#if albumTracksLoading} <span class="count">Loading...</span> {/if}
        </div>
        {#if albumTracks.length}
          <button class="btn primary is-match" onclick={() => startAlbumSession(albumTracks)}>
            Album Session starten
          </button>
        {/if}
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
                {#if matchReview(track)}
                  <div class="review-chip small track-review">
                    <span>Review {matchReview(track)?.rating?.toFixed?.(1) ?? ''}/5</span>
                    {#if matchReview(track)?.notes}
                      <span class="review-note">{matchReview(track)?.notes}</span>
                    {/if}
                  </div>
                {/if}
              </div>
              <div class="track-actions">
              <button class="btn primary is-play" onclick={() => handlePreview(track)}>
                {getPreviewUrl(track) ? (currentPreviewUrl === getPreviewUrl(track) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <button
                class="btn secondary is-match"
                onclick={() => scoreAndRecommend(track)}
                disabled={scoreLoadingId === track.id}
              >
                {scoreLoadingId === track.id ? 'Scoring...' : 'Vibe Matcher'}
              </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if albumSessionQueue.length}
    <div class="session-player">
      <div class="session-header">
        <div class="session-title">Album Session</div>
        <div class="session-header-actions">
          <div class="session-count">{albumSessionQueue.length} Tracks</div>
          <button class="session-close" onclick={closeAlbumSession} aria-label="Close album session">x</button>
        </div>
      </div>
      {#if currentAlbumSessionTrack}
        <div class="session-now">
          <img src={getImage(currentAlbumSessionTrack) || '/fallback-cover.svg'} alt={getTitle(currentAlbumSessionTrack)} />
          <div>
            <div class="session-track">{getTitle(currentAlbumSessionTrack)}</div>
            <div class="session-artist">{getSubtitle(currentAlbumSessionTrack)}</div>
          </div>
        </div>
      {/if}
      <div class="session-actions">
        <button
          class="session-btn primary"
          onclick={() => {
            if (currentAlbumSessionTrack && currentPreviewUrl === getPreviewUrl(currentAlbumSessionTrack) && isPlaying) {
              stopPreview();
            } else {
              playAlbumSessionCurrent();
            }
          }}
        >
          {currentAlbumSessionTrack && currentPreviewUrl === getPreviewUrl(currentAlbumSessionTrack) && isPlaying ? 'Pause' : 'Play'}
        </button>
        <button class="session-btn" onclick={nextAlbumSession}>Next</button>
      </div>
      {#if albumSessionYouTubeId}
        <iframe
          class="session-yt"
          width="100%"
          height="180"
          src={`https://www.youtube.com/embed/${albumSessionYouTubeId}?autoplay=1`}
          title={albumSessionYouTubeTitle || 'YouTube player'}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          allowfullscreen
        ></iframe>
      {/if}
      <ol class="session-list">
        {#each albumSessionQueue.slice(0, 5) as item, idx (item.id ?? item.uri ?? item.name)}
          <li class:active={idx === albumSessionIndex}>
            <span>{idx + 1}.</span>
            <span>{getTitle(item)}</span>
          </li>
        {/each}
      </ol>
    </div>
  {/if}

  <section class="panel">
    <div class="panel-header">
      <div class="panel-title">
        <h2>{searchType === 'album' ? 'Albums' : 'Popular songs'}</h2>
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
              {#if isTrack(item)}
                <button class="btn primary is-match" onclick={() => scoreAndRecommend(item)} disabled={scoreLoadingId === item.id}>
                  {scoreLoadingId === item.id ? 'Scoring...' : 'Vibe Matcher'}
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
            <div class="vibe-top">
              <div class="vibe-cover">
                <img src={getImage(match) || '/fallback-cover.svg'} alt={getTitle(match)} />
              </div>
              <div class="vibe-main">
                <div class="vibe-title">{getTitle(match)}</div>
                <div class="vibe-sub">{getSubtitle(match)}</div>
              </div>
            </div>
            <div class="vibe-actions">
              <button class="btn primary is-play" onclick={() => handlePreview(match)}>
                {getPreviewUrl(match) ? (currentPreviewUrl === getPreviewUrl(match) && isPlaying ? 'Pause' : 'Play') : 'YouTube'}
              </button>
              <button
                class="btn secondary is-match"
                onclick={() => scoreAndRecommend(match)}
                disabled={scoreLoadingId === match.id}
              >
                {scoreLoadingId === match.id ? 'Scoring...' : 'Vibe Matcher'}
              </button>
              <button class="btn secondary is-remove" onclick={() => removeVibeMatch(match)}>
                Entfernen
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
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
  :global(html[data-page="search"]) {
    background: url('/bg-search.gif?v=2') center/cover no-repeat fixed;
  }

  :global(body[data-page="search"]) {
    background: url('/bg-search.gif?v=2') center/cover no-repeat fixed;
    background-color: transparent;
    min-height: 100vh;
    color: #ffffff;
    margin: 0;
  }

  :global(body[data-page="search"] .app) {
    min-height: 100vh;
    background: transparent;
  }

  .page {
    max-width: 73.75rem;
    margin: 0 auto;
    padding: 1.25rem 0.75rem 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-panel {
    background: #1e1e1e;
    border: 0.0625rem solid #2c2c2c;
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.4);
  }

  .search-row {
    display: flex;
    gap: 0.625rem;
    align-items: center;
  }

  .search-input-wrap {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 2.75rem 0.875rem 0.875rem;
    border-radius: 0.75rem;
    border: 0.0625rem solid #2c2c2c;
    background: #0f0f0f;
    color: #fff;
    font-size: 1rem;
  }

  .search-input:focus {
    outline: 0.125rem solid #00e676;
    border-color: #00e676;
  }

  .clear-btn {
    position: absolute;
    right: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #bdbdbd;
    font-size: 1.125rem;
    cursor: pointer;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    color: #bdbdbd;
  }

  .tabs label {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    border-radius: 1.5rem;
    border: 0.0625rem solid #2c2c2c;
    background: #2c2c2c;
  }

  .autoscore {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: #bdbdbd;
    font-size: 0.875rem;
  }

  .btn {
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 120ms ease, opacity 120ms ease;
  }
  .btn:active { transform: translateY(0.0625rem); }
  .btn.is-play {
    box-shadow: 0 0.625rem 1.5rem rgba(0, 230, 118, 0.25);
  }
  .btn.is-play:hover {
    transform: translateY(-0.0625rem) scale(1.02);
  }
  .btn.is-match {
    position: relative;
    box-shadow: 0 0.75rem 1.625rem rgba(0, 230, 118, 0.35), 0 0 0 0.0625rem rgba(66, 165, 245, 0.35);
    animation: matchPulse 2.4s ease-in-out infinite;
  }
  .btn.is-match:hover {
    transform: translateY(-0.0625rem) scale(1.02);
    box-shadow: 0 1rem 1.875rem rgba(0, 230, 118, 0.45), 0 0 0 0.0625rem rgba(66, 165, 245, 0.45);
  }
  .btn.primary {
    background: linear-gradient(135deg, #00e676, #42a5f5);
    color: #0f0f0f;
  }
  .btn.secondary {
    background: #2c2c2c;
    color: #ffffff;
    border: 0.0625rem solid #3a3a3a;
  }
  .btn.ghost {
    background: transparent;
    color: #bdbdbd;
    border: 0.0625rem dashed #3a3a3a;
  }

  .mini-player {
    display: grid;
    grid-template-columns: 3.5rem 1fr auto;
    gap: 0.75rem;
    align-items: center;
    background: #1a1f26;
    border: 0.0625rem solid #2b323c;
    border-radius: 0.875rem;
    padding: 0.625rem 0.75rem;
    box-shadow: 0 0.625rem 1.75rem rgba(0,0,0,0.35);
  }
  .mini-cover {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.625rem;
    overflow: hidden;
    background: #10141b;
    border: 0.0625rem solid #2b323c;
  }
  .mini-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .mini-info {
    min-width: 0;
  }
  .mini-title {
    font-weight: 700;
    color: #ffffff;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mini-sub {
    color: #9fb0c6;
    font-size: 0.8125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mini-actions {
    display: flex;
    gap: 0.5rem;
  }

  .session-player {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    width: 20rem;
    background: linear-gradient(180deg, rgba(24, 32, 40, 0.98), rgba(15, 19, 26, 0.95));
    border: 0.0625rem solid rgba(61, 224, 116, 0.35);
    border-radius: 0.875rem;
    padding: 0.75rem;
    box-shadow: 0 0.875rem 2.5rem rgba(0, 0, 0, 0.45);
    z-index: 50;
    backdrop-filter: blur(0.625rem);
    animation: pulseGlow 2.4s ease-in-out infinite;
  }
  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.625rem;
  }
  .session-header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .session-title {
    font-weight: 700;
    color: #e8ecf2;
    font-size: 0.875rem;
  }
  .session-title::before {
    content: '●';
    color: #3de074;
    margin-right: 0.375rem;
    font-size: 0.75rem;
  }
  .session-count {
    font-size: 0.75rem;
    color: #9fb0c6;
  }
  .session-close {
    border-radius: 0.5rem;
    border: 0.0625rem solid #2b323c;
    background: #1f2631;
    color: #c5d4e8;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-weight: 600;
  }
  .session-close:hover {
    border-color: rgba(61, 224, 116, 0.6);
  }
  .session-now {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 0.625rem;
    align-items: center;
    margin-bottom: 0.625rem;
  }
  .session-now img {
    width: 3rem;
    height: 3rem;
    border-radius: 0.625rem;
    object-fit: cover;
    border: 0.0625rem solid #2b323c;
  }
  .session-track {
    color: #e8ecf2;
    font-weight: 600;
    font-size: 0.8125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-artist {
    color: #9fb0c6;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
  }
  .session-btn {
    flex: 1;
    border-radius: 0.625rem;
    border: 0.0625rem solid #2b323c;
    background: #1f2631;
    color: #c5d4e8;
    padding: 0.5rem 0.625rem;
    cursor: pointer;
    font-weight: 600;
  }
  .session-btn.primary {
    background: linear-gradient(135deg, #3de074, #32b5ff);
    color: #0d1118;
  }
  .session-btn.primary:hover {
    box-shadow: 0 0.625rem 1.25rem rgba(61, 224, 116, 0.25);
    transform: translateY(-0.0625rem);
  }
  .session-yt {
    border-radius: 0.625rem;
    border: 0.0625rem solid #2b323c;
    margin-bottom: 0.625rem;
  }
  .session-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #9fb0c6;
  }
  .session-list li {
    display: grid;
    grid-template-columns: 1.125rem 1fr;
    gap: 0.375rem;
  }
  .session-list li.active {
    color: #e8ecf2;
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0.875rem 2.5rem rgba(0, 0, 0, 0.45), 0 0 0 rgba(61, 224, 116, 0.0); }
    
  @keyframes matchPulse {
    0%, 100% {
      box-shadow: 0 0.75rem 1.625rem rgba(0, 230, 118, 0.3), 0 0 0 0.0625rem rgba(66, 165, 245, 0.25);
    }
    50% {
      box-shadow: 0 1rem 1.875rem rgba(0, 230, 118, 0.5), 0 0 0.75rem rgba(66, 165, 245, 0.35);
    }
  }
50% { box-shadow: 0 1.125rem 2.75rem rgba(0, 0, 0, 0.5), 0 0 1.5rem rgba(61, 224, 116, 0.18); }
  }

  .hero {
    position: relative;
    border-radius: 1.125rem;
    overflow: hidden;
    min-height: 13.75rem;
    background: #1e1e1e;
    border: 0.0625rem solid #2c2c2c;
    display: flex;
    align-items: flex-end;
  }
  .hero.compact {
    min-height: 10rem;
  }

  .hero-content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    color: #bdbdbd;
    margin: 0;
  }

  .hero h1 {
    margin: 0;
    font-size: 1.75rem;
  }

  .subtitle {
    margin: 0;
    color: #bdbdbd;
  }

  .hero-actions {
    display: flex;
    gap: 0.625rem;
    margin-top: 0.375rem;
    flex-wrap: wrap;
  }

  .panel {
    background: #1e1e1e;
    border: 0.0625rem solid #2c2c2c;
    border-radius: 1rem;
    padding: 0.875rem;
    box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.4);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.625rem;
    gap: 0.625rem;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .panel h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .count {
    background: #2c2c2c;
    border: 0.0625rem solid #353535;
    padding: 0.25rem 0.625rem;
    border-radius: 1rem;
    font-size: 0.8125rem;
    color: #bdbdbd;
  }

  .tracklist {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .track-row {
    display: grid;
    grid-template-columns: 2rem 1fr 15rem;
    gap: 0.625rem;
    align-items: center;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
    background: #20252d;
    border: 0.0625rem solid #2c2c2c;
    transition: border 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  }
  .track-row:hover {
    border-color: rgba(56, 224, 127, 0.5);
    transform: translateY(-0.0625rem);
  }
  .track-row.playing {
    border-color: #3de074;
    box-shadow: 0 0 0 0.125rem rgba(61, 224, 116, 0.2);
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
    font-size: 0.9375rem;
  }

  .track-sub {
    color: #bdbdbd;
    font-size: 0.875rem;
    margin: 0;
  }

  .track-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .vibe-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0.625rem;
  }

  .vibe-card {
    border: 0.0625rem solid #2c2c2c;
    border-radius: 0.75rem;
    padding: 0.75rem;
    background: #111;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .vibe-top {
    display: flex;
    gap: 0.625rem;
    align-items: center;
  }

  .vibe-cover {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    overflow: hidden;
    flex-shrink: 0;
    border: 0.0625rem solid #2c2c2c;
  }

  .vibe-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .vibe-title {
    font-weight: 700;
    color: #fff;
  }

  .vibe-sub {
    color: #bdbdbd;
    font-size: 0.875rem;
  }

  .vibe-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn.is-remove {
    border-color: rgba(255, 107, 107, 0.35);
    color: #ffb3b3;
  }

  .btn.is-remove:hover {
    border-color: rgba(255, 107, 107, 0.6);
    color: #ffd2d2;
  }

  .score-chip {
    background: #2c2c2c;
    border: 0.0625rem solid #3a3a3a;
    padding: 0.375rem 0.625rem;
    border-radius: 0.75rem;
    font-size: 0.8125rem;
    color: #bdbdbd;
  }

  .review-panel .review-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16.25rem, 1fr));
    gap: 0.625rem;
  }

  .review-card {
    border: 0.0625rem solid #2c2c2c;
    border-radius: 0.75rem;
    padding: 0.625rem 0.75rem;
    background: #151515;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .review-header-row {
    display: flex;
    justify-content: space-between;
    gap: 0.625rem;
  }

  .review-title {
    font-weight: 700;
  }

  .review-sub {
    color: #bdbdbd;
    font-size: 0.8125rem;
  }

  .review-rating {
    font-weight: 700;
    color: #00e676;
  }

  .review-notes {
    margin: 0;
    color: #e0e0e0;
    font-size: 0.875rem;
  }

  .review-footer-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #bdbdbd;
  }

  .review-album {
    color: #8ab4ff;
  }

  .review-chip {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    background: #252525;
    border: 0.0625rem solid #3a3a3a;
    padding: 0.375rem 0.625rem;
    border-radius: 0.75rem;
    color: #fff;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .review-chip.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .track-review {
    margin-top: 0.35rem;
    background: #1f1f1f;
    border-color: #2b2b2b;
    color: #d6d6d6;
  }

  .review-note {
    color: #bdbdbd;
    font-size: 0.75rem;
  }

  .album-tracklist .track-row {
    grid-template-columns: 2rem 1fr 12.5rem;
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
    right: 1.125rem;
    bottom: 5.625rem;
    width: min(26.25rem, calc(100% - 3rem));
    background: #1e1e1e;
    border: 0.0625rem solid #2c2c2c;
    border-radius: 0.75rem;
    padding: 0.75rem;
    box-shadow: 0 0.625rem 1.875rem rgba(0,0,0,0.35);
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .yt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media (max-width: 60rem) {
    .hero-actions {
      flex-direction: column;
      align-items: flex-start;
    }
    .track-row {
      grid-template-columns: 1.5rem 1fr;
      grid-template-rows: auto auto;
    }
    .track-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .mini-player {
      grid-template-columns: 3rem 1fr;
      grid-template-rows: auto auto;
    }
    .mini-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
    .session-player {
      right: 0.75rem;
      left: 0.75rem;
      width: auto;
    }
  }

  @media (max-width: 37.5rem) {
    .search-panel {
      padding: 0.75rem;
      gap: 0.5rem;
    }
    .search-row {
      flex-direction: column;
      align-items: stretch;
    }
    .btn.primary {
      width: 100%;
    }
    .tabs {
      gap: 0.375rem;
    }
    .tabs label {
      padding: 0.375rem 0.625rem;
      font-size: 0.8125rem;
    }
    .autoscore {
      font-size: 0.75rem;
    }
  }
</style>
