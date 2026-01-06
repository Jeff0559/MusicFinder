<script lang="ts">
	import { onMount } from 'svelte';

	export let items: any[] = [];
	export let title: string = 'Trending';
	export let onItemClick: ((item: any) => void) | undefined = undefined;

	let scrollContainer: HTMLDivElement | null = null;

	function scrollLeft() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
		}
	}

	function scrollRight() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
		}
	}

	function handleItemClick(item: any) {
		if (onItemClick) onItemClick(item);
	}
</script>

<div class="carousel-section">
	<div class="carousel-header">
		<h3>{title}</h3>
		<div class="carousel-controls">
			<button class="carousel-btn" onclick={scrollLeft} title="Scroll left">
				←
			</button>
			<button class="carousel-btn" onclick={scrollRight} title="Scroll right">
				→
			</button>
		</div>
	</div>

	{#if items.length > 0}
		<div class="carousel-container" bind:this={scrollContainer}>
			{#each items as item (item.id)}
				<button
					class="carousel-item"
					onclick={() => handleItemClick(item)}
					title={item.name}
					type="button"
				>
					<div class="item-image">
						{#if item.images?.[0]?.url}
							<img src={item.images[0].url} alt={item.name} loading="lazy" />
						{:else}
							<div class="no-image">📀</div>
						{/if}
					</div>
					<div class="item-info">
						<p class="item-name">{item.name}</p>
						{#if item.artist_name || item.artists?.[0]?.name}
							<p class="item-artist">{item.artist_name || item.artists[0].name}</p>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div class="carousel-empty">
			<p>Loading trending items...</p>
		</div>
	{/if}
</div>

<style>
	.carousel-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}

	.carousel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.carousel-header h3 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-primary);
	}

	.carousel-controls {
		display: flex;
		gap: var(--space-8);
	}

	.carousel-btn {
		all: unset;
		width: 2.25rem;
		height: 2.25rem;
		background: var(--color-primary);
		color: var(--color-text-primary);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-base);
	}

	.carousel-btn:hover {
		background: var(--color-primary-dark);
		transform: scale(1.05);
	}

	.carousel-btn:active {
		transform: scale(0.95);
	}

	.carousel-container {
		display: flex;
		gap: var(--space-12);
		overflow-x: auto;
		scroll-behavior: smooth;
		padding-bottom: var(--space-8);
		scrollbar-width: thin;
		scrollbar-color: var(--color-primary) transparent;
	}

	.carousel-container::-webkit-scrollbar {
		height: 0.375rem;
	}

	.carousel-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.carousel-container::-webkit-scrollbar-thumb {
		background: var(--color-primary);
		border-radius: 0.1875rem;
	}

	.carousel-item {
		all: unset;
		flex-shrink: 0;
		width: 10rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		cursor: pointer;
		transition: all var(--transition-base);
		border-radius: var(--radius-md);
		padding: var(--space-8);
		background: transparent;
	}

	.carousel-item:hover {
		transform: translateY(-0.25rem);
		background: rgba(29, 185, 84, 0.1);
		border-radius: var(--radius-md);
	}

	.carousel-item:focus {
		outline: 0.125rem solid var(--color-primary);
		outline-offset: 0.125rem;
	}

	.item-image {
		width: 100%;
		aspect-ratio: 1;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-bg-light);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-image {
		font-size: 3rem;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.item-name {
		margin: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-artist {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.carousel-empty {
		padding: var(--space-32);
		text-align: center;
		background: var(--color-bg-light);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
	}

	.carousel-empty p {
		margin: 0;
	}

	@media (max-width: 48rem) {
		.carousel-item {
			width: 8.75rem;
		}

		.carousel-btn {
			width: 2rem;
			height: 2rem;
		}
	}
</style>
