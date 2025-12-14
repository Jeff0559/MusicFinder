<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import TrendingBlock from './TrendingBlock.svelte';
  import VinylCarousel from '$lib/components/VinylCarousel.svelte';
  import { recent } from '$lib/stores/recent';

  let query = '';
  let type: 'track' | 'album' | 'artist' = 'track';
  let searchResults: any[] = [];
  let searchLoading = false;
  let searchError = '';

  let recentTerms: string[] = [];
  let trendingAlbums: any[] = [];
  let trendingArtists: any[] = [];
  let vinylItems: { label: string; image: string }[] = [];

  const getImage = (item: any) =>
    item?.images?.[0]?.url
    ?? item?.album?.images?.[0]?.url
    ?? item?.artists?.[0]?.images?.[0]?.url
    ?? '';

  const getTitle = (item: any) =>
    item?.name
    ?? item?.album?.name
    ?? item?.track?.name
    ?? '';

  const getSubtitle = (item: any) => {
    if (type === 'track') {
      const artist = item?.artists?.[0]?.name ?? '';
      const album = item?.album?.name ?? '';
      return [artist, album].filter(Boolean).join(' / ');
    }
    if (type === 'album') {
      const artist = item?.artists?.[0]?.name ?? '';
      const year = item?.release_date?.slice?.(0, 4) ?? '';
      return [artist, year].filter(Boolean).join(' / ');
    }
    const followers = item?.followers?.total?.toLocaleString?.() ?? '';
    const pop = item?.popularity ?? '';
    return [followers ? `${followers} Follower` : '', pop ? `Popularity ${pop}` : ''].filter(Boolean).join(' / ');
  };

  const unsub = recent.subscribe(v => (recentTerms = v));
  onDestroy(() => unsub());

  async function goSearch(addRecent = false) {
    if (!query.trim()) return;
    searchLoading = true;
    searchError = '';
    searchResults = [];

    const params = new URLSearchParams({ q: query, type });
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
      if (addRecent) recent.add(query);
    } catch (e) {
      console.error('Home search failed', e);
      searchError = 'Suche fehlgeschlagen. Bitte erneut versuchen.';
    } finally {
      searchLoading = false;
    }
  }

  function useTerm(term: string) {
    query = term;
    goSearch(true);
  }

  onMount(async () => {
    try {
      const resp = await fetch('/api/trending');
      const data = await resp.json();
      trendingAlbums = data.albums ?? [];
      trendingArtists = data.artists ?? [];
      loadVinylImages();
    } catch (e) {
      console.error('Trending failed:', e);
    }
  });

  async function loadVinylImages() {
    vinylItems = await Promise.all(
      recentTerms.slice(-10).map(async (term) => {
        try {
          const r = await fetch(`/api/cover?q=${encodeURIComponent(term)}`).then(r => r.json());
          return { label: term, image: r.image || '/fallback-cover.png' };
        } catch (e) {
          return { label: term, image: '/fallback-cover.png' };
        }
      })
    );
  }
</script>

<!-- dY"? Top Bar -->
<header class="topbar">
  <div class="brand">dYZæ MusicFinder</div>
  <nav class="nav">
    <a href="/" aria-current="page">Home</a>
    <a href="/search">Search</a>
    <a href="/scoreboard">Scoreboard</a>
  </nav>
</header>

<!-- ƒ-? HERO: Vinyl Record Store -->
<section class="hero">
  <div class="hero-inner">
    <h1 class="title">Finde deinen Sound</h1>
    <p class="subtitle">Willkommen im digitalen Plattenladen ƒ?" entdecke Musik wie ein Vinyl-Sampler.</p>

    <div class="search-area">
      <!-- Suchbox -->
      <div class="searchbox">
        <input
          bind:value={query}
          placeholder="Suche nach Song, Artist oder Albumƒ?Ý"
          onkeydown={(e)=> e.key === 'Enter' && goSearch(true)}
        />
        <button class="search-btn" onclick={() => goSearch(false)} disabled={searchLoading}>
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <label><input bind:group={type} value="track" type="radio" /> Tracks</label>
        <label><input bind:group={type} value="album" type="radio" /> Alben</label>
        <label><input bind:group={type} value="artist" type="radio" /> Artists</label>
      </div>

      <!-- dYZ Vinyl Carousel (component) -->
      <VinylCarousel items={vinylItems} onSelect={(t) => { query = t; goSearch(true); }} />
    </div>
  </div>
</section>

<!-- dY" TRENDING SECTIONS -->
<main class="container">
  <div class="discover-section">

    <div class="trending-section">
      <TrendingBlock
        title="dYZæ Trending Albums"
        items={trendingAlbums.map(a => ({
          image: a.images?.[0]?.url ?? '',
          name: a.name,
          meta: a.artists?.[0]?.name ?? ''
        }))}
      />
    </div>

    <div class="trending-section">
      <TrendingBlock
        title="dYZ Popular Artists"
        items={trendingArtists.map(a => ({
          image: a.images?.[0]?.url ?? '',
          name: a.name,
          meta: a.genres?.[0] ?? ''
        }))}
      />
    </div>

    <!-- dY?ú Genres ƒ+' Direkt anklickbar -->
    <section class="mood-tags">
      {#each ['Pop','Chill','Focus','Workout','Party','EDM','Jazz','Rock','Piano','Sleep','Roadtrip','Gaming'] as g}
        <button class="mood-tag" onclick={() => useTerm(g)}>{g}</button>
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
                <div class="placeholder">No Image</div>
              {/if}
              <h3>{getTitle(item)}</h3>
              {#if getSubtitle(item)}
                <p class="subtitle">{getSubtitle(item)}</p>
              {/if}
              <a class="open-link" href={`/search?q=${encodeURIComponent(query)}&type=${type}`}>Details</a>
            </article>
          {/each}
        </div>
      {/if}
    </section>

  </div>
</main>

<style>
  :global(:root) {
    --bg-main: #141414;
    --bg-panel: #1E1E1E;
    --bg-surface: #2C2C2C;
    --accent-primary: #00E676;
    --accent-secondary: #FFA726;
    --accent-info: #42A5F5;
    --text-primary: #FFFFFF;
    --text-secondary: #BDBDBD;
    --text-muted: #757575;
    --space-xs: 4px;
    --space-s: 8px;
    --space-m: 16px;
    --space-l: 24px;
    --space-xl: 32px;
    --radius-s: 12px;
    --radius-m: 16px;
    --radius-pill: 24px;
  }

  :global(body){
    margin:0;
    font-family: system-ui, Inter, sans-serif;
    background: var(--bg-main);
    color: var(--text-primary);
  }

  .topbar{
    position:sticky;
    top:0;
    display:flex;
    justify-content:space-between;
    padding:var(--space-m) var(--space-l);
    background: rgba(20,20,20,0.9);
    backdrop-filter: blur(8px);
    border-bottom:1px solid var(--bg-surface);
    z-index:20;
  }
  .nav a{
    color:var(--text-secondary);
    margin-left:var(--space-m);
    text-decoration:none;
    padding:var(--space-s) var(--space-m);
    border-radius: var(--radius-pill);
    transition: color 120ms ease, background 120ms ease;
  }
  .nav a[aria-current="page"]{
    color:var(--bg-main);
    background: var(--accent-primary);
  }
  .nav a:hover{ color:var(--accent-primary); }

  .hero{
    width:100%;
    padding:var(--space-xl) 0 var(--space-l);
    background: linear-gradient(135deg, rgba(66,165,245,0.06), rgba(0,230,118,0.05));
    border-bottom:1px solid var(--bg-surface);
    margin-bottom:var(--space-l);
  }
  .hero-inner{
    max-width:960px;
    margin:auto;
    text-align:center;
  }
  .title{
    font-size:32px;
    font-weight:800;
    margin:0 0 var(--space-s) 0;
  }
  .subtitle{
    color:var(--text-secondary);
    margin:0 0 var(--space-l) 0;
  }

  .search-area{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:var(--space-m);
  }
  .searchbox{
    display:flex;
    width:100%;
    max-width:720px;
    background: var(--bg-panel);
    padding:var(--space-s);
    border-radius: var(--radius-m);
    border:1px solid var(--bg-surface);
    box-shadow:0 10px 30px rgba(0,0,0,0.35);
  }
  .searchbox input{
    flex:1;
    background:transparent;
    border:none;
    color:var(--text-primary);
    font-size:16px;
    outline:none;
    padding: var(--space-s);
  }
  .search-btn{
    background: var(--accent-primary);
    color: var(--bg-main);
    padding: var(--space-s) var(--space-l);
    border:none;
    border-radius: var(--radius-s);
    font-weight:700;
    cursor:pointer;
    min-width: 120px;
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
  }
  .tabs label{
    cursor:pointer;
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-pill);
    border:1px solid var(--bg-surface);
    background: rgba(255,255,255,0.03);
  }

  .container{
    width:100%;
    padding:var(--space-m);
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:var(--space-l);
  }

  .discover-section{
    display:flex;
    flex-direction:column;
    gap:24px;
    width:100%;
    max-width:1200px;
    margin:0 auto;
    padding:0 20px;
  }

  .trending-section{
    background:var(--bg-panel);
    padding:16px 20px;
    border-radius:16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.25);
  }

  .grid{
    display:grid;
    gap:var(--space-m);
    grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
  }
  .mood-tags{
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    margin-top:4px;
  }

  .mood-tag{
    background:var(--bg-surface);
    padding:10px 18px;
    border-radius:24px;
    color:var(--text-secondary);
    cursor:pointer;
    border:none;
    transition:0.2s;
  }

  .mood-tag:hover{
    background:var(--accent-info);
    color:black;
  }

  .search-results{
    background:var(--bg-surface);
    padding:20px;
    border-radius:16px;
    margin-top:12px;
    box-shadow:0 10px 30px rgba(0,0,0,0.35);
  }

  .results-header{
    display:flex;
    align-items:center;
    gap:var(--space-s);
    margin-bottom:var(--space-s);
  }

  .results-header h2{
    margin:0;
    font-size:20px;
  }

  .count{
    background:var(--bg-surface);
    border:1px solid var(--bg-surface);
    padding:4px 10px;
    border-radius:var(--radius-pill);
    font-size:13px;
    color:var(--text-secondary);
  }

  .results-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(200px,1fr));
    gap:var(--space-m);
  }
  .results-grid .card{
    background:var(--bg-surface);
    border:1px solid var(--bg-panel);
    border-radius:var(--radius-m);
    padding:var(--space-m);
    display:flex;
    flex-direction:column;
    gap:var(--space-s);
    min-height:260px;
  }

  .results-grid img,
  .results-grid .placeholder{
    width:100%;
    height:140px;
    border-radius:var(--radius-s);
    object-fit:cover;
    background:var(--bg-panel);
  }

  .placeholder{
    display:grid;
    place-items:center;
    color:var(--text-muted);
    border:1px dashed var(--bg-panel);
  }

  .subtitle{
    margin:0;
    font-size:14px;
    color:var(--text-secondary);
  }

  .open-link{
    color:var(--accent-info);
    font-weight:700;
    text-decoration:none;
  }
  .open-link:hover{ color: var(--accent-secondary); }

  @media (max-width: 720px) {
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
