<script lang="ts">
  import { page } from '$app/stores';
  import { recent } from '$lib/stores/recent';
  import TrackItem from '$lib/components/TrackItem.svelte';

  // --- State ---
  let searchQuery = $state('');
  let searchType: 'track' | 'album' | 'artist' = $state('track');
  let isLoading = $state(false);

  // Ergebnisse
  let trackResults: any[] = $state([]);
  let albumResults: any[] = $state([]);
  let artistResults: any[] = $state([]);

  // Auswahl / Details (rechte Spalte)
  let selectedTrack: any = $state(null);
  let selectedAlbum: any = $state(null);
  let selectedArtist: any = $state(null);

  // Detaildaten
  let audioFeatures: any = $state(null);
  let similarTracks: any[] = $state([]);
  let reviews: any[] = $state([]);
  let artistInfo: any = $state(null);
  let artistTop: any[] = $state([]);

  // --- Suche ---
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    isLoading = true;
    // reset detail state
    selectedTrack = selectedAlbum = selectedArtist = null;
    audioFeatures = null; similarTracks = []; reviews = [];
    trackResults = albumResults = artistResults = [];
    try {
      const r = await fetch(`/api/search?type=${searchType}&q=${encodeURIComponent(searchQuery)}`);
      const data = await r.json();
      if (searchType === 'album')  albumResults  = Array.isArray(data) ? data : (data?.albums?.items  ?? []);
      else if (searchType === 'artist') artistResults = Array.isArray(data) ? data : (data?.artists?.items ?? []);
      else trackResults = Array.isArray(data) ? data : (data?.tracks?.items ?? []);
      recent.add(searchQuery);
    } finally {
      isLoading = false;
    }
  }

  // --- Track auswählen: Features + Similar + Reviews + Artist laden ---
  async function selectTrack(t: any) {
    selectedTrack = t;
    selectedAlbum = null;
    selectedArtist = null;
    audioFeatures = null; similarTracks = []; reviews = []; artistInfo = null; artistTop = [];

    try {
      // 1) Features & Similar parallel
      const [fRes, sRes] = await Promise.all([
        fetch(`/api/features/${t.id}`),
        fetch(`/api/similar/${t.id}`)
      ]);
      audioFeatures = (await fRes.json()) ?? null;
      similarTracks = (await sRes.json())  ?? [];

      // 2) Reviews (Artist + Albumname des Tracks)
      const artistName = t.artists?.[0]?.name ?? '';
      const albumName  = t.album?.name ?? '';
      if (artistName && albumName) {
        const rv = await fetch(`/api/reviews?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}`).then(r=>r.json());
        reviews = rv?.reviews ?? [];
      }

      // 3) Artist-Infos
      const artistId = t.artists?.[0]?.id;
      if (artistId) {
        const [ai, at] = await Promise.all([
          fetch(`/api/artist/${artistId}`).then(r=>r.json()),
          fetch(`/api/artist-top/${artistId}`).then(r=>r.json())
        ]);
        artistInfo = ai;
        artistTop  = at ?? [];
      }
    } catch (e) {
      console.error('selectTrack failed', e);
    }

    // Load full YouTube track for the selected song (best-effort)
    try {
      const query = `${t.name} ${t.artists?.[0]?.name} official audio`;
      const yt = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({ videoId: null }));
      youtubeId = yt?.videoId ?? null;
      // reset play state when a new track is selected
      ytPlaying = false;
    } catch (e) {
      console.error('YouTube lookup failed', e);
      youtubeId = null;
    }
  }

  // --- Album auswählen: Detail laden (Tracks) ---
  async function openAlbum(id: string) {
    selectedAlbum = null;
    selectedTrack = null;
    selectedArtist = null;
    const r = await fetch(`/api/album/${id}`);
    selectedAlbum = await r.json();
  }

  // --- Artist auswählen: Info + Top Tracks ---
  async function openArtist(a: any) {
    selectedArtist = a;
    selectedAlbum = null;
    selectedTrack = null;
    reviews = []; audioFeatures = null; similarTracks = [];

    try {
      const [ai, at] = await Promise.all([
        fetch(`/api/artist/${a.id}`).then(r=>r.json()),
        fetch(`/api/artist-top/${a.id}`).then(r=>r.json())
      ]);
      artistInfo = ai;
      artistTop  = at ?? [];
    } catch (e) {
      console.error('openArtist failed', e);
    }
  }

  // --- Initial: URL-Parameter übernehmen und suchen ---
  $effect(() => {
    const q = $page.url.searchParams.get('q') ?? '';
    const t = ($page.url.searchParams.get('type') ?? 'track') as 'track'|'album'|'artist';
    if (q) {
      searchQuery = q;
      searchType = t;
      handleSearch();
    }
  });
  // YouTube integration: selected full-track video id
  let youtubeId: string | null = $state(null);
  let ytPlaying = $state(false);
</script>

<main class="wrap">
  <!-- Suchleiste + Tabs -->
  <div class="searchbar">
    <input bind:value={searchQuery} onkeydown={(e)=>e.key==='Enter'&&handleSearch()} placeholder="Suche…" />
    <div class="tabs">
      <label><input type="radio" bind:group={searchType} value="track" /> Songs</label>
      <label><input type="radio" bind:group={searchType} value="album" /> Alben</label>
      <label><input type="radio" bind:group={searchType} value="artist" /> Artists</label>
    </div>
    <button onclick={handleSearch} disabled={isLoading}>Search</button>
  </div>

  <div class="grid">
    <!-- Linke Spalte: Ergebnisse -->
    <section class="results">
      <h2>Results</h2>

      {#if searchType === 'track'}
        <div class="list">
          {#each trackResults as t (t.id)}
            <TrackItem track={t} onPlay={() => selectTrack(t)} />
          {/each}
        </div>
      {/if}

      {#if searchType === 'album'}
        <div class="list">
          {#each albumResults as a (a.id)}
            <button class="row" onclick={() => openAlbum(a.id)}>
              <img src={a.images?.[1]?.url || a.images?.[0]?.url} alt="cover" width="52" height="52" />
              <div class="meta">
                <strong>{a.name}</strong>
                <small>{a.artists?.[0]?.name} · {a.release_date?.slice(0,4)}</small>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      {#if searchType === 'artist'}
        <div class="list">
          {#each artistResults as a (a.id)}
            <button class="row" onclick={() => openArtist(a)}>
              <img src={a.images?.[1]?.url || a.images?.[0]?.url} alt="artist" width="52" height="52" />
              <div class="meta">
                <strong>{a.name}</strong>
                <small>Follower: {a.followers?.total?.toLocaleString?.() ?? '–'} · Popularity: {a.popularity ?? '–'}</small>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Rechte Spalte: Details -->
    <section class="details">
      <!-- Track-Details + Mini-Player + Features + Reviews + Similar + Artist-Info -->
      {#if selectedTrack}
        <div class="card">
          <h3>{selectedTrack.name}</h3>
          <p class="muted">{selectedTrack.artists?.[0]?.name} · {selectedTrack.album?.name}</p>

            <!-- Full track via YouTube -->
            {#if youtubeId}
              {#if ytPlaying}
                <div class="yt-player" style="margin-top: 1rem;">
                  <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <button class="btn" onclick={() => { ytPlaying = false; }}>
                      ⏹ Stop
                    </button>
                    <button class="btn" onclick={() => { ytPlaying = false; youtubeId = null; }}>
                      ✖ Close
                    </button>
                  </div>
                  <iframe
                    id="yt-player"
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                    title="YouTube player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
                    allowfullscreen
                  ></iframe>
                </div>
              {:else}
                <button class="btn" onclick={() => { ytPlaying = true; setTimeout(() => document.getElementById('yt-player')?.scrollIntoView?.({ behavior: 'smooth' }), 150); }}>
                  ▶ Play full song
                </button>
              {/if}
            {:else}
              <p class="muted">Kein YouTube-Track gefunden.</p>
            {/if}

          {#if audioFeatures}
            <div class="features">
              <div><span>Energy</span><progress max="1" value={audioFeatures.energy ?? 0}></progress></div>
              <div><span>Valence</span><progress max="1" value={audioFeatures.valence ?? 0}></progress></div>
              <div><span>Danceability</span><progress max="1" value={audioFeatures.danceability ?? 0}></progress></div>
              <div><span>BPM</span><b>{Math.round(audioFeatures.tempo ?? 0)}</b></div>
            </div>
          {/if}

          {#if reviews?.length}
            <div class="block">
              <h4>Reviews</h4>
              <ul class="plain">
                {#each reviews.slice(0,4) as r}
                  <li><b>{r.source}</b> · <i>{r.author}</i> — {r.text}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if similarTracks?.length}
            <div class="block">
              <h4>Ähnliche Songs</h4>
              <ul class="plain">
                {#each similarTracks.slice(0,6) as s}
                  <li>{s.name} — {s.artists?.[0]?.name}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if artistInfo}
            <div class="block">
              <h4>Artist</h4>
              <p class="muted">{artistInfo.name} · Popularity {artistInfo.popularity} · Follower {(artistInfo.followers ?? 0).toLocaleString?.()}</p>
              {#if artistTop?.length}
                <h5>Top Tracks</h5>
                <ul class="plain">
                  {#each artistTop.slice(0,5) as tt}
                    <li>{tt.name}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Album-Details -->
      {#if selectedAlbum}
        <div class="card">
          <h3>Album: {selectedAlbum.name}</h3>
          <p class="muted">{selectedAlbum.artists?.[0]?.name} · {selectedAlbum.release_date?.slice(0,4)}</p>
          <ul class="plain">
            {#each selectedAlbum.tracks?.items ?? [] as t (t.id)}
              <li>{t.track_number}. {t.name}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Artist-Details -->
      {#if selectedArtist}
        <div class="card">
          <h3>{selectedArtist.name}</h3>
          <p class="muted">Popularity {selectedArtist.popularity ?? '–'} · Follower {selectedArtist.followers?.total?.toLocaleString?.() ?? '–'}</p>
          {#if artistTop?.length}
            <h5>Top Tracks</h5>
            <ul class="plain">
              {#each artistTop.slice(0,6) as t}
                <li>{t.name}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </section>
  </div>
</main>

<style>
  .wrap{ max-width:1100px; margin:0 auto; padding:16px; color:#e8ecf2; }
  .searchbar{ display:flex; gap:10px; align-items:center; margin-bottom:12px; }
  input{ flex:1; background:#1e232a; color:#e8ecf2; border:1px solid #2a2f36; padding:.6rem .8rem; border-radius:10px; }
  button{ padding:.6rem 1rem; border-radius:10px; border:1px solid #2a2f36; background:#14181f; color:#e8ecf2; cursor:pointer; }
  .tabs{ display:flex; gap:12px; color:#9fb0c6; }
  .grid{ display:grid; gap:14px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 980px){ .grid{ grid-template-columns: 1fr; } }
  .results, .details{ background:#1e232a; border:1px solid #2a2f36; border-radius:12px; padding:14px; }
  .list{ display:flex; flex-direction:column; gap:8px; max-height:62vh; overflow:auto; }
  .row{ display:flex; gap:12px; align-items:center; padding:8px; background:#181c22; border:1px solid #222835; border-radius:10px; text-align:left; }
  .meta{ text-align:left; }
  .meta small{ color:#9fb0c6; }
  .card{ display:grid; gap:10px; }
  .muted{ color:#9fb0c6; }
  .features{ display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
  progress{ width:100%; height:10px; accent-color:#7aa7ff; }
  .block{ margin-top:6px; }
  .plain{ list-style:none; padding:0; margin:0; display:grid; gap:6px; }
</style>
