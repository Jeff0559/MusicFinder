<script lang="ts">
  import { onDestroy } from 'svelte';
  import VinylCarousel from '$lib/components/VinylCarousel.svelte';
  import { recent } from '$lib/stores/recent';

  const SEARCH_DEBOUNCE_MS = 300;
  const MAX_VINYL_TERMS = 10;
  const VINYL_FALLBACK = '/fallback-cover.svg';

  type SearchItem = {
    id?: string;
    uri?: string;
    name?: string;
    images?: { url: string }[];
    album?: { name?: string; images?: { url: string }[] };
    artists?: { name?: string; images?: { url: string }[] }[];
    track?: { name?: string };
    release_date?: string;
    followers?: { total?: number };
    popularity?: number;
  };

  let query = '';
  let type: 'track' | 'album' | 'artist' = 'track';
  let searchResults: SearchItem[] = [];
  let searchLoading = false;
  let searchError = '';

  let recentTerms: string[] = [];
  let vinylItems: { label: string; image: string }[] = [];
  let recentKey = '';
  let searchDebounce: ReturnType<typeof setTimeout> | undefined;

  const moodTags = [
    'Pop',
    'Chill',
    'Focus',
    'Workout',
    'Party',
    'EDM',
    'Jazz',
    'Rock',
    'Piano',
    'Sleep',
    'Roadtrip',
    'Gaming'
  ];

  const getImage = (item: SearchItem) =>
    item?.images?.[0]?.url
    ?? item?.album?.images?.[0]?.url
    ?? item?.artists?.[0]?.images?.[0]?.url
    ?? '';

  const getTitle = (item: SearchItem) =>
    item?.name
    ?? item?.album?.name
    ?? item?.track?.name
    ?? '';

  const getSubtitle = (item: SearchItem) => {
    const artist = item?.artists?.[0]?.name ?? '';
    if (type === 'track') {
      const album = item?.album?.name ?? '';
      return [artist, album].filter(Boolean).join(' / ');
    }
    if (type === 'album') {
      const year = item?.release_date?.slice?.(0, 4) ?? '';
      return [artist, year].filter(Boolean).join(' / ');
    }
    const followers = item?.followers?.total?.toLocaleString?.() ?? '';
    const pop = item?.popularity ?? '';
    return [
      followers ? `${followers} Follower` : '',
      pop ? `Popularity ${pop}` : ''
    ].filter(Boolean).join(' / ');
  };

  const unsub = recent.subscribe((value) => (recentTerms = value));

  onDestroy(() => {
    unsub();
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
  });

  async function goSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    searchLoading = true;
    searchError = '';
    searchResults = [];

    if (searchDebounce) {
      clearTimeout(searchDebounce);
      searchDebounce = undefined;
    }

    const params = new URLSearchParams({ q: trimmedQuery, type });
    try {
      const resp = await fetch(`/api/search?${params.toString()}`);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Search failed');
      }
      const data = await resp.json();
      const list =
        Array.isArray(data)
          ? data
          : data?.tracks?.items
            ?? data?.albums?.items
            ?? data?.artists?.items
            ?? [];
      searchResults = list;
    } catch (e) {
      console.error('Home search failed', e);
      searchError = 'Suche fehlgeschlagen. Bitte erneut versuchen.';
    } finally {
      searchLoading = false;
    }
  }

  function useTerm(term: string) {
    query = term;
    goSearch();
  }

  function scheduleSearch() {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    searchDebounce = setTimeout(goSearch, SEARCH_DEBOUNCE_MS);
  }

  $: {
    const nextKey = recentTerms.slice(-MAX_VINYL_TERMS).join('|');
    if (!nextKey) {
      recentKey = '';
      vinylItems = [];
    } else if (nextKey !== recentKey) {
      recentKey = nextKey;
      loadVinylImages();
    }
  }

  function uniqueTerms(list: string[]) {
    const seen = new Set<string>();
    return list.filter((term) => {
      const key = term.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function loadVinylImages() {
    const recentSlice = uniqueTerms(recentTerms.slice(-MAX_VINYL_TERMS));
    if (!recentSlice.length) {
      vinylItems = [];
      return;
    }
    vinylItems = await Promise.all(
      recentSlice.map(async (term) => {
        try {
          const r = await fetch(`/api/cover?q=${encodeURIComponent(term)}`).then(r => r.json());
          return { label: term, image: r.image || VINYL_FALLBACK };
        } catch {
          return { label: term, image: VINYL_FALLBACK };
        }
      })
    );
  }

</script>

<section class="hero">
  <div class="hero-inner">
    <h1 class="title">Finde deinen Sound</h1>
    <p class="hero-subtitle">Willkommen im digitalen Plattenladen - entdecke Musik wie ein Vinyl-Sampler.</p>

    <div class="search-area">
      <div class="searchbox">
        <input
          bind:value={query}
          placeholder="Suche nach Song, Artist oder Album"
          on:input={() => scheduleSearch()}
          on:keydown={(e) => e.key === 'Enter' && goSearch()}
        />
        <button class="search-btn" on:click={() => goSearch()} disabled={searchLoading}>
          {searchLoading ? 'Suche...' : 'Suchen'}
        </button>
      </div>

      <div class="tabs">
        <span class="tabs-label">Suchtyp</span>
        <label class="tab">
          <input bind:group={type} value="track" type="radio" />
          <span>Tracks</span>
        </label>
        <label class="tab">
          <input bind:group={type} value="album" type="radio" />
          <span>Alben</span>
        </label>
        <label class="tab">
          <input bind:group={type} value="artist" type="radio" />
          <span>Artists</span>
        </label>
      </div>

      <div class="vinyl-section">
        <h3>Empfohlene Vinyls</h3>
        <VinylCarousel items={vinylItems} onSelect={(t) => { query = t; goSearch(); }} />
      </div>
    </div>
  </div>
</section>

<main class="container">
  <div class="discover-section">

    <section class="mood-tags">
      {#each moodTags as g}
        <button class="mood-tag" on:click={() => useTerm(g)}>{g}</button>
      {/each}
    </section>

    <section class="search-results">
      <div class="results-header">
        <h2>Suchergebnisse</h2>
        {#if searchResults.length} <span class="count">{searchResults.length}</span> {/if}
      </div>
      {#if searchError}
        <p class="muted">{searchError}</p>
      {:else if (!searchResults.length && !searchLoading)}
        <p class="muted">Starte eine Suche, um Ergebnisse hier zu sehen.</p>
      {:else}
        {#if searchLoading}
          <p class="muted">Lade...</p>
        {/if}
        <div class="grid results-grid">
          {#each searchResults as item (item.id ?? item.uri ?? item.name)}
            <article class="card">
              {#if getImage(item)}
                <img src={getImage(item)} alt={getTitle(item)} loading="lazy" />
              {:else}
                <div class="placeholder">Kein Bild</div>
              {/if}
              <h3>{getTitle(item)}</h3>
              {#if getSubtitle(item)}
                <p class="card-subtitle">{getSubtitle(item)}</p>
              {/if}
              <a class="open-link" href={`/search?q=${encodeURIComponent(query)}&type=${type}`}>Details ansehen</a>
            </article>
          {/each}
        </div>
      {/if}
    </section>

  </div>
</main>

<style>
  :global(:root) {
    --bg-main: #0d0f12;
    --bg-panel: #151a20;
    --bg-surface: #1b2129;
    --bg-glass: rgba(255, 255, 255, 0.04);
    --accent-primary: #38e07f;
    --accent-secondary: #ffb347;
    --accent-info: #4cc9f0;
    --text-primary: #f4f6f9;
    --text-secondary: #b8c0cc;
    --text-muted: #7b8594;
    --ring: rgba(255, 255, 255, 0.22);
    --shadow-soft: 0 1.125rem 2.5rem rgba(3, 8, 16, 0.6);
    --shadow-card: 0 0.75rem 1.875rem rgba(2, 6, 13, 0.5);
    --space-xs: 0.25rem;
    --space-s: 0.5rem;
    --space-m: 1rem;
    --space-l: 1.5rem;
    --space-xl: 2rem;
    --radius-s: 0.75rem;
    --radius-m: 1rem;
    --radius-pill: 1.5rem;
    --font-display: "Bebas Neue", "Impact", sans-serif;
    --font-sans: "IBM Plex Sans", "Segoe UI", sans-serif;
  }

  :global(html[data-page="home"]){
    background: url('/bg-home.gif?v=2') center/cover no-repeat fixed;
  }

  :global(body[data-page="home"]){
    margin:0;
    font-family: var(--font-sans);
    background-color: transparent;
    min-height: 100vh;
    color: var(--text-primary);
    position: relative;
  }
  :global(body[data-page="home"])::before{
    content:'';
    position: fixed;
    inset: 0;
    background: url('/bg-home.gif?v=2') center/cover no-repeat;
    transform: scale(1);
    transform-origin: center;
    z-index: -2;
    pointer-events: none;
  }
  :global(body[data-page="home"])::after{
    content:'';
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: -1;
    pointer-events: none;
  }
  :global(body[data-page="home"] .app){
    min-height: 100vh;
    background: transparent;
  }
  :global(*){
    box-sizing: border-box;
  }

  .hero{
    width:100%;
    padding:var(--space-xl) 0 var(--space-l);
    background: linear-gradient(135deg, rgba(76, 201, 240, 0.08), rgba(56, 224, 127, 0.08));
    border-bottom:0.0625rem solid rgba(255,255,255,0.05);
    margin-bottom:var(--space-l);
    position:relative;
    overflow:hidden;
  }
  .hero::before{
    content:'';
    position:absolute;
    width:32.5rem;
    height:32.5rem;
    top:-16.25rem;
    right:-11.25rem;
    background: radial-gradient(circle, rgba(255, 179, 71, 0.22), transparent 70%);
    opacity:0.6;
    pointer-events:none;
  }
  .hero::after{
    content:'';
    position:absolute;
    width:22.5rem;
    height:22.5rem;
    bottom:-12.5rem;
    left:-7.5rem;
    background: radial-gradient(circle, rgba(56, 224, 127, 0.2), transparent 70%);
    opacity:0.5;
    pointer-events:none;
  }
  .hero-inner{
    max-width:60rem;
    margin:auto;
    text-align:center;
    position:relative;
    z-index:1;
  }
  .hero-inner > *{
    animation: fadeUp 600ms ease both;
  }
  .hero-inner > *:nth-child(1){ animation-delay: 40ms; }
  .hero-inner > *:nth-child(2){ animation-delay: 100ms; }
  .hero-inner > *:nth-child(3){ animation-delay: 160ms; }

  .title{
    font-size:2.5rem;
    font-weight:800;
    font-family: var(--font-display);
    letter-spacing:0.0625rem;
    margin:0 0 var(--space-s) 0;
  }
  .hero-subtitle{
    color:var(--text-secondary);
    margin:0 0 var(--space-l) 0;
    max-width:40rem;
    margin-left:auto;
    margin-right:auto;
  }

  .search-area{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:var(--space-m);
    margin-top: var(--space-l);
  }
  .searchbox{
    display:flex;
    width:100%;
    max-width:45rem;
    background: linear-gradient(135deg, rgba(20, 24, 32, 0.92), rgba(18, 22, 30, 0.78));
    padding:var(--space-s);
    border-radius: var(--radius-m);
    border:0.0625rem solid rgba(255,255,255,0.1);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.35);
    gap: var(--space-s);
    transition: border 140ms ease, box-shadow 140ms ease;
  }
  .searchbox:focus-within{
    border:0.0625rem solid var(--ring);
    box-shadow:0 0 0 0.125rem rgba(255, 255, 255, 0.12), var(--shadow-soft);
  }
  .searchbox input{
    flex:1;
    background:transparent;
    border:none;
    color:var(--text-primary);
    font-size:1rem;
    outline:none;
    padding: var(--space-s);
    border-radius: var(--radius-s);
  }
  .searchbox input::placeholder{
    color:var(--text-muted);
  }
  .search-btn{
    background: linear-gradient(135deg, var(--accent-primary), #4af3a0);
    color: #0c130f;
    padding: var(--space-s) var(--space-l);
    border:none;
    border-radius: var(--radius-s);
    font-weight:700;
    cursor:pointer;
    min-width: 7.5rem;
    letter-spacing:0.0187rem;
    transition: transform 140ms ease, box-shadow 140ms ease;
    box-shadow: 0 0.5rem 1.25rem rgba(56, 224, 127, 0.28);
  }
  .search-btn:hover{
    transform: translateY(-0.0625rem) scale(1.02);
    box-shadow: 0 0.625rem 1.625rem rgba(56, 224, 127, 0.35);
  }
  .search-btn:disabled{
    opacity:0.6;
    cursor:not-allowed;
  }

  .tabs{
    display:flex;
    gap:var(--space-s);
    color:var(--text-secondary);
    flex-wrap:wrap;
    align-items:center;
  }
  .tabs-label{
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.6875rem;
    color: var(--text-muted);
    margin-right: 0.25rem;
  }
  .tabs .tab{
    cursor:pointer;
    display:flex;
    align-items:center;
  }
  .tabs input{
    display:none;
  }
  .tabs .tab span{
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-pill);
    border:0.0625rem solid rgba(255,255,255,0.08);
    background: var(--bg-glass);
    transition: 140ms ease;
    font-weight:500;
    color: var(--text-muted);
  }
  .tabs input:checked + span{
    background: var(--accent-info);
    color:#0a1014;
    border-color: transparent;
    box-shadow: 0 0.375rem 1rem rgba(76, 201, 240, 0.3);
    transform: scale(1.04);
  }
  .tabs input:not(:checked) + span:hover{
    color: var(--text-secondary);
    border-color: rgba(255,255,255,0.18);
  }

  .vinyl-section{
    margin-top: var(--space-l);
    width: 100%;
  }
  .vinyl-section h3{
    margin: 0 0 var(--space-s) 0;
    font-size: 1rem;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .container{
    width:100%;
    padding:var(--space-m);
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:calc(var(--space-l) + 0.5rem);
  }

  .discover-section{
    display:flex;
    flex-direction:column;
    gap:2rem;
    width:100%;
    max-width:75rem;
    margin:0 auto;
    padding:0 1.25rem;
  }

  .trending-section{
    background: linear-gradient(160deg, rgba(27, 33, 41, 0.9), rgba(18, 22, 28, 0.9));
    padding:0.875rem 1rem;
    border-radius:1rem;
    box-shadow: var(--shadow-card);
    border: 0.0625rem solid rgba(255,255,255,0.05);
  }

  .grid{
    display:grid;
    gap:var(--space-m);
    grid-template-columns:repeat(auto-fill, minmax(8.75rem, 1fr));
  }
  .mood-tags{
    display:flex;
    flex-wrap:wrap;
    gap:0.75rem;
    margin-top:0.25rem;
  }

  .mood-tag{
    background: rgba(255,255,255,0.04);
    padding:0.625rem 1.125rem;
    border-radius:1.5rem;
    color:var(--text-secondary);
    cursor:pointer;
    border:0.0625rem solid rgba(255,255,255,0.08);
    transition:0.2s;
  }

  .mood-tag:hover{
    background: var(--accent-info);
    color:#0a1014;
    border-color: transparent;
    box-shadow: 0 0.375rem 1rem rgba(76, 201, 240, 0.25);
  }

  .search-results{
    background: linear-gradient(160deg, rgba(27, 33, 41, 0.95), rgba(18, 22, 28, 0.95));
    padding:1.25rem;
    border-radius:1rem;
    margin-top:0.75rem;
    box-shadow: var(--shadow-card);
    border: 0.0625rem solid rgba(255,255,255,0.05);
  }

  .results-header{
    display:flex;
    align-items:center;
    gap:var(--space-s);
    margin-bottom:var(--space-s);
  }

  .results-header h2{
    margin:0;
    font-size:1.25rem;
  }

  .count{
    background: rgba(255,255,255,0.06);
    border:0.0625rem solid rgba(255,255,255,0.08);
    padding:0.25rem 0.625rem;
    border-radius:var(--radius-pill);
    font-size:0.8125rem;
    color:var(--text-secondary);
  }

  .results-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(12.5rem,1fr));
    gap:var(--space-m);
  }
  .results-grid .card{
    background: linear-gradient(160deg, rgba(27, 33, 41, 0.9), rgba(17, 21, 27, 0.95));
    border:0.0625rem solid rgba(255,255,255,0.06);
    border-radius:var(--radius-m);
    padding:var(--space-m);
    display:flex;
    flex-direction:column;
    gap:var(--space-s);
    min-height:16.25rem;
    box-shadow: 0 0.625rem 1.5rem rgba(5, 10, 16, 0.45);
    transition: transform 150ms ease, border 150ms ease;
  }
  .results-grid .card:hover{
    transform: translateY(-0.25rem);
    border-color: rgba(76, 201, 240, 0.35);
  }

  .results-grid img,
  .results-grid .placeholder{
    width:100%;
    height:8.75rem;
    border-radius:var(--radius-s);
    object-fit:cover;
    background:var(--bg-panel);
  }

  .placeholder{
    display:grid;
    place-items:center;
    color:var(--text-muted);
    border:0.0625rem dashed rgba(255,255,255,0.08);
  }

  .card h3{
    margin:0;
    font-size:1rem;
    font-weight:600;
    line-height:1.35;
    display:-webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow:hidden;
  }

  .card-subtitle{
    margin:0;
    font-size:0.875rem;
    color:var(--text-secondary);
    display:-webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow:hidden;
  }

  .open-link{
    margin-top:auto;
    align-self:flex-start;
    color:#0a1014;
    font-weight:700;
    text-decoration:none;
    background: rgba(76, 201, 240, 0.9);
    padding:0.5rem 0.75rem;
    border-radius:62.4375rem;
    font-size:0.8125rem;
    transition: transform 140ms ease, background 140ms ease;
  }
  .open-link:hover{
    transform: translateY(-0.0625rem);
    background: var(--accent-secondary);
  }

  .muted{
    color:var(--text-muted);
  }

  @keyframes fadeUp{
    from{
      opacity:0;
      transform: translateY(0.75rem);
    }
    to{
      opacity:1;
      transform: translateY(0);
    }
  }

  @media (max-width: 45rem) {
    .searchbox{
      flex-direction:column;
      gap:var(--space-s);
    }
    .search-btn{
      width:100%;
    }
    .nav a{
      margin-left:var(--space-s);
    }
  }
</style>

