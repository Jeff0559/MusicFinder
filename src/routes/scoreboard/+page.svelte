<script lang="ts">
  import { onMount } from 'svelte';
  import { activity, type ActivityEntry } from '$lib/stores/activity';

  let entries: ActivityEntry[] = [];
  let byArtist: { name: string; count: number }[] = [];
  let totals = { select: 0, similar: 0, play: 0 };

  onMount(() => {
    const unsub = activity.subscribe((list) => {
      entries = [...list].sort((a, b) => b.ts - a.ts);
      const counts = new Map<string, number>();
      totals = { select: 0, similar: 0, play: 0 };
      for (const e of entries) {
        counts.set(e.artist, (counts.get(e.artist) ?? 0) + 1);
        totals[e.action as 'select' | 'similar' | 'play']++;
      }
      byArtist = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    });
    return () => unsub();
  });

  function clearAll() {
    activity.clear();
  }
</script>

<div class="container">
  <h1>📊 Scoreboard</h1>

  <section class="cards">
    <div class="card">
      <div class="num">{totals.select}</div>
      <div class="label">Auswahlen</div>
    </div>
    <div class="card">
      <div class="num">{totals.similar}</div>
      <div class="label">„Ähnliche" Suchen</div>
    </div>
    <div class="card">
      <div class="num">{totals.play}</div>
      <div class="label">Previews abgespielt</div>
    </div>
    <button class="clear" onclick={clearAll}>🗑️ Reset</button>
  </section>

  <section class="card">
    <h3>🎤 Top Artists</h3>
    {#if byArtist.length > 0}
      <ol>
        {#each byArtist as a}
          <li>{a.name} — <strong>{a.count}</strong></li>
        {/each}
      </ol>
    {:else}
      <p class="muted">Keine Aktivität yet.</p>
    {/if}
  </section>

  <section class="card">
    <h3>⏱️ Letzte Aktivitäten</h3>
    {#if entries.length > 0}
      <ul>
        {#each entries.slice(0, 20) as e}
          <li>
            <small>{new Date(e.ts).toLocaleString()}</small>
            <strong>{e.action}</strong>
            — {e.track} · {e.artist}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Keine Aktivität yet.</p>
    {/if}
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #1db954;
    margin-bottom: 2rem;
    font-size: 2rem;
  }

  .cards {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .card {
    background: #1e232a;
    border: 1px solid #2a2f36;
    border-radius: 12px;
    padding: 1.5rem;
    flex: 1;
    min-width: 120px;
  }

  .card h3 {
    margin: 0 0 1rem;
    color: #1db954;
    font-size: 1.05rem;
  }

  .num {
    font-size: 28px;
    font-weight: 700;
    color: #1db954;
  }

  .label {
    color: #8aa0b2;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .clear {
    padding: 0.6rem 1rem;
    background: #d62a42;
    color: #fff;
    border: 1px solid #d62a42;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .clear:hover {
    background: #e63a52;
  }

  ol, ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  ol li, ul li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #2a2f36;
    color: #d4dce5;
    font-size: 0.9rem;
  }

  ol li:last-child, ul li:last-child {
    border-bottom: none;
  }

  small {
    color: #8aa0b2;
    font-size: 0.75rem;
    display: block;
    margin-bottom: 0.25rem;
  }

  strong {
    color: #1db954;
    font-weight: 600;
  }

  .muted {
    color: #8aa0b2;
    font-style: italic;
  }
</style>
