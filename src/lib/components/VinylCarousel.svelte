<script lang="ts">
  export let items: { image: string; label: string }[] = [];
  export let onSelect: (label: string) => void = () => {};
</script>

<div class="carousel">
  {#each items as item}
    <div class="vinyl-item">
      <button class="vinyl" on:click={() => onSelect(item.label)} aria-label={`Search ${item.label}`}>
        <div class="disc">
          <div
            class="cover"
            style={`background-image: url('${item.image || "/fallback-cover.svg"}')`}
          ></div>
        </div>
      </button>
      <div class="vinyl-label" title={item.label}>{item.label}</div>
    </div>
  {/each}
</div>

<style>
  .carousel {
    display: flex;
    gap: 1.5rem;
    padding: 1.125rem 0.5rem 0.75rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    justify-content: center;
  }

  .carousel::-webkit-scrollbar { display: none; }

  .vinyl-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 8.75rem;
  }

  .vinyl {
    width: 8.75rem;
    aspect-ratio: 1 / 1;
    height: auto;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    scroll-snap-align: center;
    perspective: 50rem;
    transition: transform 140ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vinyl:focus-visible {
    outline: 0.125rem solid var(--accent-info);
    outline-offset: 0.375rem;
    border-radius: 50%;
  }

  .disc {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12), rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.95) 75%),
      repeating-radial-gradient(circle, rgba(255,255,255,0.06) 0 0.0625rem, rgba(0,0,0,0) 0.125rem 0.25rem);
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.35s ease, box-shadow 0.3s ease;
    box-shadow: 0 0.625rem 1.5rem rgba(0,0,0,0.6);
  }

  .disc::before {
    content: '';
    position: absolute;
    inset: 0.5rem;
    border-radius: 50%;
    border: 0.0625rem solid rgba(255,255,255,0.08);
    box-shadow: inset 0 0 0.875rem rgba(255,255,255,0.05);
  }

  .disc::after {
    content: '';
    position: absolute;
    width: 3.75rem;
    height: 3.75rem;
    top: 0.625rem;
    right: 1.25rem;
    background: radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%);
    opacity: 0.45;
    transform: rotate(15deg);
    pointer-events: none;
  }

  .vinyl:hover .disc {
    transform: rotateY(-22deg) rotateX(12deg) scale(1.12);
    box-shadow: 0 1rem 2rem rgba(0,0,0,0.75);
  }
  .vinyl:hover {
    transform: translateY(-0.1875rem);
  }

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
    box-shadow: inset 0 0 0.75rem rgba(0,0,0,0.6);
    border: 0.125rem solid rgba(255,255,255,0.12);
  }

  .cover::after {
    content: '';
    position: absolute;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    background: #0d0f12;
    border: 0.0625rem solid rgba(255,255,255,0.25);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .vinyl-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    max-width: 8.75rem;
    text-align: center;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

