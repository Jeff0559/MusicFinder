<script lang="ts">
  export let title: string;
  export let items: { image: string; name: string; meta: string }[] = [];
  export let loading = false;
  export let error = '';
  export let emptyMessage = 'Keine Trending-Daten gefunden.';
  export let canPrev = false;
  export let canNext = false;
  export let onPrev: (() => void) | null = null;
  export let onNext: (() => void) | null = null;
  export let onRetry: (() => void) | null = null;
</script>

<section class="block">
  <div class="header">
    <h2 class="title">{title}</h2>
    <div class="actions">
      <button class="scroll-btn" onclick={() => onPrev?.()} aria-label="Prev" disabled={!canPrev}>Prev</button>
      <button class="scroll-btn" onclick={() => onNext?.()} aria-label="Next" disabled={!canNext}>Next</button>
    </div>
  </div>

  {#if error}
    <div class="state">
      <p class="state-text">{error}</p>
      {#if onRetry}
        <button class="retry-btn" onclick={() => onRetry?.()}>Retry</button>
      {/if}
    </div>
  {:else if loading}
    <div class="skeleton-grid">
      {#each Array(6) as _}
        <div class="skeleton-card">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
      {/each}
    </div>
  {:else if !items.length}
    <div class="state">
      <p class="state-text">{emptyMessage}</p>
    </div>
  {:else}
    <div class="grid">
      {#each items as item}
        <div class="card">
          <img src={item.image || '/fallback-cover.svg'} class="thumb" alt={item.name} />
          <p class="name">{item.name}</p>
          <p class="meta">{item.meta}</p>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .block{
    display:flex;
    flex-direction:column;
    gap:0.625rem;
  }
  .header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:0.75rem;
  }
  .title{
    font-size:1.125rem;
    font-weight:600;
    color:var(--text-primary);
    margin:0;
  }
  .actions{
    display:flex;
    gap:0.5rem;
  }
  .scroll-btn{
    background: rgba(255,255,255,0.06);
    color:var(--text-secondary);
    font-size:0.75rem;
    padding:0.375rem 0.75rem;
    border-radius:62.4375rem;
    cursor:pointer;
    border:0.0625rem solid rgba(255,255,255,0.08);
    transition: 140ms ease;
  }
  .scroll-btn:disabled{
    opacity:0.45;
    cursor:not-allowed;
  }
  .scroll-btn:hover{
    background: var(--accent-primary);
    color:#0a1014;
    border-color: transparent;
    box-shadow: 0 0.375rem 1rem rgba(56, 224, 127, 0.2);
  }
  .grid{
    display:grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap:1rem;
  }
  .skeleton-grid{
    display:grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap:1rem;
  }
  .skeleton-card{
    border-radius:0.875rem;
    padding:0.75rem;
    background: rgba(255,255,255,0.03);
    border:0.0625rem solid rgba(255,255,255,0.08);
    display:flex;
    flex-direction:column;
    gap:0.5rem;
  }
  .skeleton-thumb{
    width:100%;
    height:8rem;
    border-radius:0.625rem;
    background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.12), rgba(255,255,255,0.05));
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }
  .skeleton-line{
    height:0.625rem;
    border-radius:62.4375rem;
    background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.12), rgba(255,255,255,0.05));
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }
  .skeleton-line.short{
    width:70%;
  }
  .card{
    background: rgba(255,255,255,0.03);
    border:0.0625rem solid rgba(255,255,255,0.08);
    border-radius:0.875rem;
    padding:0.75rem;
    transition: transform 150ms ease, border 150ms ease;
  }
  .card:hover{
    transform: translateY(-0.1875rem);
    border-color: rgba(56, 224, 127, 0.35);
  }
  .thumb{
    width:100%;
    height:8rem;
    object-fit:cover;
    border-radius:0.625rem;
    margin-bottom:0.5rem;
    background: var(--bg-panel);
  }
  .name{
    color:var(--text-primary);
    font-weight:600;
    margin:0 0 0.25rem 0;
  }
  .meta{
    color:var(--text-secondary);
    font-size:0.8125rem;
    margin:0;
  }
  .state{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:0.75rem;
    padding:0.5rem 0;
  }
  .state-text{
    color:var(--text-secondary);
    margin:0;
    font-size:0.875rem;
  }
  .retry-btn{
    background: var(--accent-secondary);
    color:#0a1014;
    border:none;
    border-radius:62.4375rem;
    padding:0.375rem 0.75rem;
    cursor:pointer;
    font-weight:600;
  }
  .text-muted{
    color:var(--text-muted);
  }
  @keyframes shimmer{
    0%{ background-position: 0% 50%; }
    100%{ background-position: 200% 50%; }
  }
</style>

