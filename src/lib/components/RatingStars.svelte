<script lang="ts">
	export let rating: number = 0;
	export let maxRating: number = 5;
	export let interactive: boolean = false;

	function handleStarClick(star: number) {
		if (interactive) {
			rating = star;
		}
	}

</script>

<div class="rating-stars" class:interactive>
	{#each Array.from({ length: maxRating }) as _, i}
		<button
			class="star"
			class:active={i < rating}
			on:click={() => handleStarClick(i + 1)}
			disabled={!interactive}
			type="button"
			aria-pressed={i < rating}
			title={`${i + 1} / ${maxRating} stars`}
		>
			{i < rating ? '★' : '☆'}
		</button>
	{/each}
	<span class="rating-text">{rating.toFixed(1)} / {maxRating}</span>
</div>

<style>
	.rating-stars {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.rating-stars.interactive {
		cursor: pointer;
	}

	.star {
		all: unset;
		font-size: var(--font-size-xl);
		cursor: pointer;
		transition: all var(--transition-base);
		display: inline-block;
		color: rgba(255, 255, 255, 0.45);
	}

	.star:disabled {
		cursor: default;
	}

	.star:not(:disabled):hover {
		transform: scale(1.2);
		filter: drop-shadow(0 0 0.25rem var(--color-accent-yellow));
	}

	.star.active {
		color: #ffd166;
		text-shadow: 0 0 0.5rem rgba(255, 209, 102, 0.35);
	}

	.star:focus {
		outline: 0.125rem solid var(--color-primary);
		border-radius: 50%;
	}

	.rating-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-semibold);
		margin-left: var(--space-8);
	}
</style>
