<script>
	// Globale Design-Tokens (Farben, Fonts, Spacing usw.)
	import '$lib/styles/tokens.css';

	// Globale Layout-Komponenten
	import Navigation from '$lib/components/Navigation.svelte';
	import NowPlaying from '$lib/components/NowPlaying.svelte';

	// Favicon
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Navigation oben -->
<Navigation />

<!-- Haupt-App-Container -->
<div class="app">
	<slot />
</div>

<!-- Player unten -->
<NowPlaying />

<style>
	/* GLOBAL RESET */
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* GLOBAL BODY STYLES */
	:global(html, body) {
		height: 100%;
		background: var(--color-bg-dark);
		color: var(--color-text-primary);
		font-family: var(--font-family-base);
		line-height: var(--line-height-normal);
	}

	/* GLOBAL LINKS */
	:global(a) {
		color: var(--color-primary);
		text-decoration: none;
	}
	:global(a:hover) {
		text-decoration: underline;
	}

	/* FORM ELEMENTS */
	:global(input, textarea, select, button) {
		font-family: var(--font-family-base);
		font-size: var(--font-size-md);
	}

	/* MAIN APP WRAPPER */
	.app {
		min-height: 100vh;
		padding-bottom: 80px; /* Platz für NowPlaying, falls fixiert */
	}
</style>
