<script lang="ts">
  import { recent } from '$lib/stores/recent';
  import TrendingBlock from './TrendingBlock.svelte';
  import VinylCarousel from '$lib/components/VinylCarousel.svelte';
  import { onDestroy, onMount } from 'svelte';

  let query = '';
  let type: 'track' | 'album' | 'artist' = 'track';

  let recentTerms: string[] = [];
  let trendingAlbums: any[] = [];
  let trendingArtists: any[] = [];
  let vinylItems: { label: string; image: string }[] = [];

  // Speicherung der Suchhistorie
  const unsub = recent.subscribe(v => (recentTerms = v));
  onDestroy(() => unsub());

  // Suche starten
  function goSearch() {
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query, type });
    window.location.href = `/search?${params.toString()}`;
  }

  // Letzte Suchbegriffe anklicken
  function useTerm(term: string) {
    query = term;
    goSearch();
  }

  // Trending von API laden
  onMount(async () => {
    try {
      const resp = await fetch('/api/trending');
      const data = await resp.json();
      trendingAlbums = data.albums ?? [];
      trendingArtists = data.artists ?? [];
      // load vinyl images after trending data available
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

<!-- 🔝 Top Bar -->
<header class="topbar">
  <div class="brand">🎵 MusicFinder</div>
  <nav class="nav">
    <a href="/" aria-current="page">Home</a>
    <a href="/search">Search</a>
    <a href="/scoreboard">Scoreboard</a>
  </nav>
</header>

<!-- ⭐ HERO: Vinyl Record Store -->
<section class="hero">
  <div class="hero-inner">
    <h1 class="title">Finde deinen Sound</h1>
    <p class="subtitle">Willkommen im digitalen Plattenladen – entdecke Musik wie ein Vinyl-Sampler.</p>

    <div class="search-area">
      <!-- Suchbox -->
      <div class="searchbox">
        <input
          bind:value={query}
          placeholder="Suche nach Song, Artist oder Album…"
          onkeydown={(e)=> e.key === 'Enter' && goSearch()}
        />
        <button class="search-btn" onclick={goSearch}>Search</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <label><input bind:group={type} value="track" type="radio" /> Tracks</label>
        <label><input bind:group={type} value="album" type="radio" /> Alben</label>
        <label><input bind:group={type} value="artist" type="radio" /> Artists</label>
      </div>

      <!-- 🎧 Vinyl Carousel (component) -->
      <VinylCarousel items={vinylItems} onSelect={(t) => { query = t; goSearch(); }} />
    </div>
  </div>
</section>

<!-- 🔥 TRENDING SECTIONS -->
<main class="container">

  <TrendingBlock
    title="🎵 Trending Albums"
    items={trendingAlbums.map(a => ({
      image: a.images?.[0]?.url ?? '',
      name: a.name,
      meta: a.artists?.[0]?.name ?? ''
    }))}
  />

  <TrendingBlock
    title="🎤 Popular Artists"
    items={trendingArtists.map(a => ({
      image: a.images?.[0]?.url ?? '',
      name: a.name,
      meta: a.genres?.[0] ?? ''
    }))}
  />

  <!-- 🏷 Genres → Direkt anklickbar -->
  <section class="grid">
    {#each ['Pop','Chill','Focus','Workout','Party','EDM','Jazz','Rock','Piano','Sleep','Roadtrip','Gaming'] as g}
      <button class="tile" onclick={() => useTerm(g)}>{g}</button>
    {/each}
  </section>

</main>

<style>
  :global(body){
    margin:0;
    font-family: system-ui, Inter, sans-serif;
    background:#0B0D12;
    color:#E8ECF2;
  }

  /* 🔝 Topbar */
  .topbar{
    position:sticky;
    top:0;
    display:flex;
    justify-content:space-between;
    padding:14px 18px;
    background:rgba(11,13,18,.85);
    backdrop-filter: blur(6px);
    border-bottom:1px solid #2a2f36;
    z-index:20;
  }
  .nav a{
    color:#9fb0c6;
    margin-left:16px;
    text-decoration:none;
  }
  .nav a[aria-current="page"]{ color:#fff; }

  /* ⭐ HERO SECTION */
  .hero{
    width:100%;
    padding:60px 0 50px;
    background:radial-gradient(circle at 20% 20%, #2d2d2d, #111);
    border-bottom:1px solid #333;
    margin-bottom:40px;
  }
  .hero-inner{
    max-width:900px;
    margin:auto;
    text-align:center;
  }
  .title{
    font-size:2.7rem;
    font-weight:700;
  }
  .subtitle{
    color:#c7c7c7;
    margin-bottom:30px;
  }

  /* 🔍 Suche */
  .search-area{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:20px;
  }
  .searchbox{
    display:flex;
    width:100%;
    max-width:640px;
    background:#1f1f1f;
    padding:10px;
    border-radius:14px;
    border:1px solid #333;
    box-shadow:0 0 16px rgba(0,0,0,0.4);
  }
  .searchbox input{
    flex:1;
    background:transparent;
    border:none;
    color:#eee;
    font-size:1.1rem;
    outline:none;
  }
  .search-btn{
    background:#3df77c;
    padding:10px 20px;
    border:none;
    border-radius:10px;
    font-weight:600;
    cursor:pointer;
  }

  /* Tabs */
  .tabs{
    display:flex;
    gap:20px;
    color:#ddd;
  }
  .tabs label{
    cursor:pointer;
  }

  /* Vinyl carousel styling moved into `VinylCarousel.svelte` component */

  /* 📦 Container */
  .container{
    max-width:1040px;
    margin:auto;
    padding:16px;
  }

  /* Genre Tiles */
  .grid{
    display:grid;
    gap:12px;
    grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
    margin-top:20px;
  }
  .tile{
    background:#1e232a;
    border:1px solid #2a2f36;
    border-radius:12px;
    padding:14px 10px;
    font-size:15px;
    cursor:pointer;
  }
</style>
