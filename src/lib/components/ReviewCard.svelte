<script lang="ts">
	import type { Review } from '$lib/types';

	export let review: Review;

	let expanded = false;

	function toggleExpanded() {
		expanded = !expanded;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'No date';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function renderStars(rating: number | null): string {
		if (rating === null) return '—';
		const filled = Math.round(rating);
		const empty = 5 - filled;
		return '★'.repeat(filled) + '☆'.repeat(empty);
	}

	const shortText = review.text.length > 150 ? review.text.substring(0, 150) + '…' : review.text;
</script>

<article class="review-card">
	<header class="review-header">
		<div class="review-meta">
			<strong class="author">{review.author}</strong>
			<span class="source">{review.source}</span>
		</div>
		<div class="review-rating">
			<span class="stars">{renderStars(review.rating)}</span>
			<span class="date">{formatDate(review.date)}</span>
		</div>
	</header>

	<div class="review-body">
		<p class="review-text">
			{expanded ? review.text : shortText}
		</p>
		{#if review.text.length > 150}
			<button class="expand-btn" onclick={toggleExpanded} type="button">
				{expanded ? 'Show less' : 'Show more'}
			</button>
		{/if}
	</div>
</article>

<style>
	.review-card {
		padding: 1rem;
		background: #1e232a;
		border: 0.0625rem solid #2a2f36;
		border-radius: 0.625rem;
		transition: all 0.2s ease;
	}

	.review-card:hover {
		background: #242b33;
		border-color: #1db954;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.review-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.author {
		color: #e6f0ff;
		font-size: 0.95rem;
	}

	.source {
		font-size: 0.75rem;
		background: #14181f;
		color: #8aa0b2;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.review-rating {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-align: right;
	}

	.stars {
		font-size: 0.9rem;
		color: #ffd700;
		letter-spacing: 0.1em;
		min-width: 3.75rem;
	}

	.date {
		font-size: 0.75rem;
		color: #627286;
	}

	.review-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.review-text {
		margin: 0;
		color: #d4dce5;
		font-size: 0.875rem;
		line-height: 1.5;
		max-height: 100%;
		transition: max-height 0.2s ease;
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	.expand-btn {
		align-self: flex-start;
		padding: 0.25rem 0.75rem;
		background: rgba(29, 185, 84, 0.1);
		border: 0.0625rem solid #1db954;
		color: #1db954;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.expand-btn:hover {
		background: rgba(29, 185, 84, 0.2);
	}

	.expand-btn:focus {
		outline: 0.125rem solid #1db954;
		outline-offset: 0.125rem;
	}
</style>
