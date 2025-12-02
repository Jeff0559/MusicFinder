<script lang="ts">
	import '$lib/styles/tokens.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navigation />

<div class="app">
	<slot />
</div>

<NowPlaying />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--color-bg-dark);
		color: var(--color-text-primary);
		font-family: var(--font-family-base);
		line-height: var(--line-height-normal);
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(a) {
		color: var(--color-primary);
		text-decoration: none;
	}

	:global(a:hover) {
		text-decoration: underline;
	}

	:global(button) {
		font-family: var(--font-family-base);
	}

	:global(input, textarea, select) {
		font-family: var(--font-family-base);
		font-size: var(--font-size-md);
	}

	.app {
		min-height: 100vh;
		background: var(--color-bg-dark);
	}
</style>
