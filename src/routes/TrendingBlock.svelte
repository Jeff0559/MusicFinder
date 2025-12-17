<script lang="ts">
  export let title: string;
  export let items: { image: string; name: string; meta: string }[] = [];
  let container: HTMLDivElement | null = null;

  function scrollLeft() {
    container?.scrollBy?.({ left: -300, behavior: 'smooth' });
  }
  function scrollRight() {
    container?.scrollBy?.({ left: 300, behavior: 'smooth' });
  }
</script>

<section class="block">
  <div class="header">
    <h2 class="title">{title}</h2>
    <div class="actions">
      <button class="scroll-btn left" onclick={scrollLeft} aria-label="Scroll left">Prev</button>
      <button class="scroll-btn right" onclick={scrollRight} aria-label="Scroll right">Next</button>
    </div>
  </div>

  <div bind:this={container} class="track-list">
    {#if items.length === 0}
      <div class="text-muted">Loading trending items...</div>
    {:else}
      {#each items as item}
        <div class="card">
          <img src={item.image} class="thumb" alt={item.name} />
          <p class="name">{item.name}</p>
          <p class="meta">{item.meta}</p>
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .block{
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
  }
  .title{
    font-size:18px;
    font-weight:600;
    color:var(--text-primary);
    margin:0;
  }
  .actions{
    display:flex;
    gap:8px;
  }
  .scroll-btn{
    background: rgba(255,255,255,0.06);
    color:var(--text-secondary);
    font-size:12px;
    padding:6px 12px;
    border-radius:999px;
    cursor:pointer;
    border:1px solid rgba(255,255,255,0.08);
    transition: 140ms ease;
  }
  .scroll-btn:hover{
    background: var(--accent-primary);
    color:#0a1014;
    border-color: transparent;
    box-shadow: 0 6px 16px rgba(56, 224, 127, 0.2);
  }
  .track-list{
    display:flex;
    gap:16px;
    overflow-x:auto;
    padding:8px 4px 12px;
    scroll-snap-type:x mandatory;
  }
  .track-list::-webkit-scrollbar{ display:none; }
  .card{
    background: rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.08);
    min-width:180px;
    border-radius:14px;
    padding:12px;
    scroll-snap-align:start;
    transition: transform 150ms ease, border 150ms ease;
  }
  .card:hover{
    transform: translateY(-3px);
    border-color: rgba(56, 224, 127, 0.35);
  }
  .thumb{
    width:100%;
    height:128px;
    object-fit:cover;
    border-radius:10px;
    margin-bottom:8px;
    background: var(--bg-panel);
  }
  .name{
    color:var(--text-primary);
    font-weight:600;
    margin:0 0 4px 0;
  }
  .meta{
    color:var(--text-secondary);
    font-size:13px;
    margin:0;
  }
  .text-muted{
    color:var(--text-muted);
  }
</style>
