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

<section class="mb-10">
  <h2 class="title">{title}</h2>

  <div class="relative">
    <button class="scroll-btn left" onclick={scrollLeft}>⬅</button>
    <button class="scroll-btn right" onclick={scrollRight}>➡</button>

    <div bind:this={container} class="track-list flex gap-4 overflow-x-auto no-scrollbar py-3">
      {#if items.length === 0}
        <div class="text-gray">Loading trending items...</div>
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
  </div>
</section>

<style>
  .title{ font-size:1.125rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:0.5rem; margin-bottom:.5rem }
  .relative{ position:relative }
  .scroll-btn{ position:absolute; top:40%; transform:translateY(-50%); z-index:20; background:#2ecc71; color:black; font-size:18px; padding:6px 10px; border-radius:8px; cursor:pointer; border:none }
  .scroll-btn:hover{ background:#58ff9b }
  .scroll-btn.left{ left:0 }
  .scroll-btn.right{ right:0 }
  .track-list{ padding: 0 40px } /* spacing to account for buttons */
  .no-scrollbar::-webkit-scrollbar{ display:none }
  .card{ background:#1d232c; border:1px solid #2b323d; min-width:180px; border-radius:12px; padding:12px; transition:background .15s }
  .card:hover{ background:#252d39 }
  .thumb{ width:100%; height:128px; object-fit:cover; border-radius:8px; margin-bottom:8px }
  .name{ color:var(--text); font-weight:600; margin:0 }
  .meta{ color:#9fb0c6; font-size:.875rem; margin:0 }
  .text-gray{ color:#9fb0c6 }
</style>