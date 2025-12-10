<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    goto('/vibe');
  });
</script>

<main class="redirect">
  <p>Scoreboard wurde vom Vibe Matcher abgelöst. Weiterleitung...</p>
  <a href="/vibe">Zum Vibe Matcher</a>
</main>

<style>
  .redirect {
    padding: 2rem;
    text-align: center;
    color: #e8ecf2;
  }
  .redirect a {
    color: #3de074;
    font-weight: 700;
  }
</style>
