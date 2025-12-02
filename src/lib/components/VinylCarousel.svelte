<script lang="ts">
  export let items: { image: string; label: string }[] = [];
  export let onSelect: (label: string) => void = () => {};
</script>

<div class="carousel">
  {#each items as item}
    <button class="vinyl" on:click={() => onSelect(item.label)} aria-label={`Search ${item.label}`}>
      <div class="disc">
        <div
          class="cover"
          style={`background-image: url('${item.image || "/fallback-cover.png"}')`}
        ></div>
      </div>
    </button>
  {/each}
</div>

<style>
  .carousel {
    display: flex;
    gap: 28px;
    padding: 20px 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    justify-content: center;
  }

  .vinyl {
    width: 150px;
    height: 150px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    scroll-snap-align: center;
    perspective: 800px;
  }

  .disc {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, #444 0%, #000 75%);
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.35s ease, box-shadow 0.3s ease;
    box-shadow: 0 6px 18px rgba(0,0,0,0.6);
  }

  /* 3D Hover Effekt */
  .vinyl:hover .disc {
    transform: rotateY(-22deg) rotateX(12deg) scale(1.12);
    box-shadow: 0 12px 28px rgba(0,0,0,0.75);
  }

  /* Picture Vinyl Cover */
  .cover {
    position: absolute;
    width: 58%;
    height: 58%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateZ(355deg);
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.6);
  }

  /* leichtes Drehen beim Scroll */
  .carousel::-webkit-scrollbar { display: none; }
</style>
