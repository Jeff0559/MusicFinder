<script lang="ts">
	import { onMount } from 'svelte';
	import AlbumCard from '$lib/components/AlbumCard.svelte';
	import RatingStars from '$lib/components/RatingStars.svelte';

	type StoredReview = {
		id: string;
		trackName: string;
		artist: string;
		album: string;
		rating: number;
		notes: string;
		createdAt: string;
		coverUrl?: string;
	};

	let reviewedTracks: StoredReview[] = [];
	let showAddReview = false;
	let reviewCovers: Record<string, string> = {};

	let newReview: {
		trackName: string;
		artist: string;
		album: string;
		rating: number;
		notes: string;
	} = {
		trackName: '',
		artist: '',
		album: '',
		rating: 4,
		notes: ''
	};

	let loading = false;
	let saving = false;
	let deletingId: string | null = null;
	let error = '';

	onMount(() => {
		loadReviews();
	});

	async function loadReviews() {
		loading = true;
		error = '';
		try {
			const resp = await fetch('/api/user-reviews');
			if (!resp.ok) {
				throw new Error(await resp.text());
			}
			const data = await resp.json();
			if (data?.error) {
				error = data.error;
			}
			reviewedTracks = Array.isArray(data.reviews) ? data.reviews : [];
			await loadReviewCovers(reviewedTracks);
		} catch (err) {
			console.error('loadReviews failed', err);
			error = 'Konnte Reviews nicht laden.';
		} finally {
			loading = false;
		}
	}

	async function loadReviewCovers(reviews: StoredReview[]) {
		if (!reviews.length) return;
		const updates: Record<string, string> = {};
		await Promise.all(
			reviews.map(async (review) => {
				const cover = await getCoverForReview(review);
				if (cover) {
					updates[review.id] = cover;
				}
			})
		);
		if (Object.keys(updates).length) {
			reviewCovers = { ...reviewCovers, ...updates };
			reviewedTracks = reviewedTracks.map((r) => ({
				...r,
				coverUrl: updates[r.id] ?? r.coverUrl
			}));
		}
	}

	async function getCoverForReview(review: StoredReview) {
		const fetchTrackCover = async (query: string) => {
			const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=track`);
			if (!resp.ok) return '';
			const list = await resp.json();
			const track = Array.isArray(list) ? list[0] : null;
			return track?.album?.images?.[0]?.url ?? '';
		};

		const fetchAlbumCover = async (query: string) => {
			const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=album`);
			if (!resp.ok) return '';
			const list = await resp.json();
			const album = Array.isArray(list) ? list[0] : null;
			return album?.images?.[0]?.url ?? '';
		};

		try {
			const albumQuery = `${review.album} ${review.artist}`.trim();
			if (albumQuery) {
				const url = await fetchAlbumCover(albumQuery);
				if (url) return url;
			}

			const trackQuery = `${review.trackName} ${review.artist}`.trim();
			if (trackQuery) {
				const url = await fetchTrackCover(trackQuery);
				if (url) return url;
			}

			if (review.trackName) {
				const url = await fetchTrackCover(review.trackName);
				if (url) return url;
			}

			if (review.album) {
				const url = await fetchAlbumCover(review.album);
				if (url) return url;
			}

			if (review.artist) {
				const resp = await fetch(`/api/cover?q=${encodeURIComponent(review.artist)}`);
				if (resp.ok) {
					const data = await resp.json();
					if (data?.image) return data.image as string;
				}
			}
		} catch {
			// ignore cover errors
		}
		return '';
	}

	function handleAddReview() {
		showAddReview = true;
	}

	function handleCloseReview() {
		showAddReview = false;
		resetForm();
	}

	function resetForm() {
		newReview = {
			trackName: '',
			artist: '',
			album: '',
			rating: 4,
			notes: ''
		};
	}

	async function submitReview(event: Event) {
		event.preventDefault();
		if (saving) return;

		if (!newReview.trackName.trim() || !newReview.artist.trim()) {
			error = 'Bitte Track und Artist ausfÃ¼llen.';
			return;
		}

		saving = true;
		error = '';

		try {
			const resp = await fetch('/api/user-reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newReview)
			});

			if (!resp.ok) {
				const text = await resp.text();
				throw new Error(text || 'Speichern fehlgeschlagen');
			}

			const data = await resp.json();
			if (data?.error) {
				throw new Error(data.error);
			}
			if (data?.review) {
				reviewedTracks = [data.review, ...reviewedTracks];
				selectedAlbum = data.review;
				await loadReviewCovers([data.review]);
			}
			handleCloseReview();
		} catch (err) {
			console.error('submitReview failed', err);
			error = 'Review konnte nicht gespeichert werden.';
		} finally {
			saving = false;
		}
	}

	async function handleDeleteReview(id: string) {
		if (deletingId) return;
		deletingId = id;
		error = '';

		try {
			const resp = await fetch(`/api/user-reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (!resp.ok) {
				const text = await resp.text();
				throw new Error(text || 'Delete failed');
			}

			const data = await resp.json();
			if (data?.error) {
				throw new Error(data.error);
			}

			reviewedTracks = reviewedTracks.filter((t) => t.id !== id);
		} catch (err) {
			console.error('deleteReview failed', err);
			error = 'Review konnte nicht gelÃ¶scht werden.';
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="container">
	<section class="reviews-header">
		<div class="header-content">
			<h1>Your Music Reviews</h1>
			<p>Track your favorite songs and rate your music discoveries</p>
			<button class="add-review-btn" onclick={handleAddReview} type="button">
				+ Add Music Review
			</button>
		</div>
	</section>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<div class="reviews-container">
		<main class="reviews-list">
			<div class="list-header">
				<h2>Reviewed Tracks ({reviewedTracks.length})</h2>
			</div>

			{#if loading}
				<div class="loading">Lade gespeicherte Reviews...</div>
			{:else if reviewedTracks.length === 0}
				<div class="empty-state">
					<div class="empty-icon">*</div>
					<p>No reviews yet. Start by adding your first review!</p>
				</div>
			{:else}
				{#each reviewedTracks as track (track.id)}
					<div class="review-card">
						<div class="review-header">
							<div class="review-cover">
								{#if track.coverUrl || reviewCovers[track.id]}
									<img src={track.coverUrl || reviewCovers[track.id]} alt={track.album} loading="lazy" />
								{:else}
									<img src="/fallback-cover.svg" alt={track.album} loading="lazy" />
								{/if}
							</div>
							<div class="review-info">
								<h3>{track.trackName}</h3>
								<p class="artist">{track.artist}</p>
								<p class="album-name">
									from <strong>{track.album || 'Single'}</strong>
								</p>
							</div>
							<div class="review-rating">
								<RatingStars rating={track.rating} />
							</div>
						</div>

						<div class="review-notes">
							<p class="notes-label">Your Notes:</p>
							<p class="notes-text">{track.notes || 'No notes added'}</p>
						</div>

						<div class="review-footer">
							<span class="review-date">
								Date: {new Date(track.createdAt).toLocaleDateString('de-DE')}
							</span>
							<div class="review-actions">
								<button
									class="action-btn edit-btn"
									type="button"
									title="Edit review"
								>
									Edit
								</button>
									<button
										class="action-btn delete-btn"
										onclick={() => handleDeleteReview(track.id)}
										disabled={deletingId === track.id}
										type="button"
										title="Delete review"
									>
										{deletingId === track.id ? 'Deleting...' : 'Delete'}
									</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</main>

	</div>

	{#if showAddReview}
				<div class="modal-overlay" onclick={handleCloseReview} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && handleCloseReview()}>
					<div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
				<div class="modal-header">
					<h2>Add New Review</h2>
					<button class="close-btn" onclick={handleCloseReview} type="button">
						x
					</button>
				</div>
				<form class="review-form" onsubmit={(event) => { event.preventDefault(); submitReview(event); }}>
					<div class="form-group">
						<label for="track-name">Track Name</label>
						<input
							id="track-name"
							type="text"
							bind:value={newReview.trackName}
							required
							placeholder="Enter track name..."
						/>
					</div>
					<div class="form-group">
						<label for="artist-name">Artist</label>
						<input
							id="artist-name"
							type="text"
							bind:value={newReview.artist}
							required
							placeholder="Enter artist name..."
						/>
					</div>
					<div class="form-group">
						<label for="album-name">Album (optional)</label>
						<input id="album-name" type="text" bind:value={newReview.album} placeholder="Enter album name..." />
					</div>
					<div class="form-group">
						<label for="rating-input">Rating</label>
						<div class="rating-input">
							<RatingStars bind:rating={newReview.rating} interactive={true} />
						</div>
					</div>
					<div class="form-group">
						<label for="notes">Your Notes</label>
						<textarea
							id="notes"
							bind:value={newReview.notes}
							placeholder="Write your thoughts about this track..."
							rows="4"
						></textarea>
					</div>
					<div class="form-actions">
						<button class="btn btn-secondary" onclick={handleCloseReview} type="button">
							Cancel
						</button>
						<button class="btn btn-primary" type="submit" disabled={saving}>
							{saving ? 'Saving...' : 'Save Review'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(html[data-page="reviews"]) {
		background: url('/lofi.gif?v=1') center/cover no-repeat fixed;
	}

	:global(body[data-page="reviews"]) {
		background: url('/lofi.gif?v=1') center/cover no-repeat fixed;
		background-color: transparent;
		min-height: 100vh;
		margin: 0;
	}

	:global(body[data-page="reviews"] .app) {
		min-height: 100vh;
		background: transparent;
	}

	.container {
		max-width: 75rem;
		margin: 0 auto;
		padding: var(--space-20);
	}

	/* Header Section */
	.reviews-header {
		text-align: center;
		margin-bottom: var(--space-24);
		padding: var(--space-20) var(--space-16);
		background: linear-gradient(135deg, rgba(20, 24, 32, 0.92), rgba(18, 22, 30, 0.78));
		border-radius: var(--radius-lg);
		border: 0.0625rem solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.35);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		align-items: center;
		max-width: 32rem;
		margin: 0 auto;
	}

	.reviews-header h1 {
		margin: 0;
		font-size: 1.75rem;
		color: var(--color-text-primary);
	}

	.reviews-header p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.add-review-btn {
		all: unset;
		padding: var(--space-10) var(--space-22);
		background: linear-gradient(135deg, var(--color-primary), #36e07b);
		color: #0b120f;
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: 0 0.5rem 1.2rem rgba(29, 185, 84, 0.25);
	}

	.add-review-btn:hover {
		background: linear-gradient(135deg, #1ed760, #4df18f);
		transform: translateY(-0.125rem) scale(1.02);
		box-shadow: 0 0.7rem 1.4rem rgba(29, 185, 84, 0.35);
	}

	.add-review-btn:focus {
		outline: 0.125rem solid var(--color-accent-blue);
		outline-offset: 0.125rem;
	}

	/* Main Layout */
	.reviews-container {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-20);
	}

	/* Reviews List */
	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
	}

	.list-header {
		border-bottom: 0.0625rem solid rgba(255, 255, 255, 0.08);
		padding-bottom: var(--space-8);
	}

	.list-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--color-text-primary);
	}

	.error-banner {
		margin: var(--space-12) 0;
		padding: var(--space-12) var(--space-16);
		border-radius: var(--radius-md);
		border: 0.0625rem solid var(--color-error);
		background: rgba(255, 107, 107, 0.12);
		color: var(--color-text-primary);
	}

	.loading {
		padding: var(--space-32);
		text-align: center;
		color: var(--color-text-secondary);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-32);
		background: var(--color-bg-light);
		border-radius: var(--radius-lg);
		border: 0.125rem dashed var(--color-primary);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: var(--space-16);
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-0.5rem);
		}
	}

	.empty-state p {
		margin: 0;
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
	}

	.muted {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.review-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-16);
		background: rgba(20, 24, 32, 0.9);
		border-radius: var(--radius-lg);
		border: 0.0625rem solid rgba(255, 255, 255, 0.08);
		transition: all var(--transition-base);
	}

	.review-card:hover {
		transform: translateY(-0.125rem);
		box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.35);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-16);
	}
	.review-cover {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.625rem;
		overflow: hidden;
		background: #14181f;
		border: 0.0625rem solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
	}
	.review-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.cover-placeholder {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		color: #8aa0b2;
		font-size: 0.75rem;
	}

	.review-info h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: 1rem;
		color: var(--color-text-primary);
	}

	.artist,
	.album-name {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.review-rating {
		text-align: right;
		white-space: nowrap;
	}

	.review-notes {
		padding: var(--space-10);
		background: rgba(0, 0, 0, 0.22);
		border-radius: var(--radius-md);
		border: 0.0625rem solid rgba(255, 255, 255, 0.06);
	}

	.notes-label {
		margin: 0 0 var(--space-8) 0;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.notes-text {
		margin: 0;
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.review-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-8);
		border-top: 0.0625rem solid rgba(255, 255, 255, 0.08);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.review-actions {
		display: flex;
		gap: var(--space-8);
	}

	.action-btn {
		all: unset;
		padding: var(--space-6) var(--space-12);
		background: rgba(255, 255, 255, 0.06);
		border: 0.0625rem solid rgba(255, 255, 255, 0.18);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: 0.01em;
		transition: all var(--transition-base);
	}

	.action-btn:hover {
		border-color: rgba(255, 255, 255, 0.35);
		color: var(--color-text-primary);
	}

	.edit-btn {
		background: rgba(30, 144, 255, 0.14);
		border-color: rgba(30, 144, 255, 0.35);
		color: #cfe4ff;
	}

	.delete-btn {
		background: rgba(255, 107, 107, 0.16);
		border-color: rgba(255, 107, 107, 0.4);
		color: #ffd4d4;
	}

	.edit-btn:hover {
		background: rgba(30, 144, 255, 0.2);
		border-color: rgba(30, 144, 255, 0.6);
	}

	.delete-btn:hover {
		background: rgba(255, 107, 107, 0.2);
		border-color: rgba(255, 107, 107, 0.7);
	}


	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(5, 8, 12, 0.78);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal);
		animation: fadeIn 200ms ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: linear-gradient(180deg, rgba(20, 24, 32, 0.98), rgba(16, 20, 28, 0.95));
		border: 0.0625rem solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-lg);
		padding: var(--space-28);
		max-width: 31.25rem;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.55);
		animation: slideUp 300ms ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(2.5rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-24);
		border-bottom: 0.0625rem solid rgba(255, 255, 255, 0.08);
		padding-bottom: var(--space-12);
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-text-primary);
	}

	.close-btn {
		all: unset;
		font-size: var(--font-size-lg);
		cursor: pointer;
		transition: all var(--transition-base);
		width: 2rem;
		height: 2rem;
		display: grid;
		place-items: center;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		border: 0.0625rem solid rgba(255, 255, 255, 0.1);
	}

	.close-btn:hover {
		transform: scale(1.05);
		color: #ffd4d4;
		border-color: rgba(255, 107, 107, 0.6);
	}

	.review-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.form-group label {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.form-group input,
	.form-group textarea {
		padding: var(--space-12);
		background: rgba(12, 16, 22, 0.85);
		border: 0.0625rem solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-md);
		transition: border-color var(--transition-base), box-shadow var(--transition-base);
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: rgba(29, 185, 84, 0.7);
		box-shadow: 0 0 0 0.1875rem rgba(29, 185, 84, 0.18);
	}

	.form-group textarea {
		resize: vertical;
		font-family: var(--font-family-base);
	}

	.rating-input {
		padding: var(--space-12);
		background: rgba(12, 16, 22, 0.85);
		border-radius: var(--radius-md);
		border: 0.0625rem solid rgba(255, 255, 255, 0.1);
	}

	.form-actions {
		display: flex;
		gap: var(--space-12);
		margin-top: var(--space-12);
	}

	.btn {
		all: unset;
		padding: var(--space-12) var(--space-24);
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: all var(--transition-base);
		flex: 1;
		text-align: center;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-primary), #36e07b);
		color: #0b120f;
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, #1ed760, #4df18f);
		transform: translateY(-0.125rem) scale(1.01);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-primary);
		border: 0.0625rem solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		border-color: rgba(255, 255, 255, 0.35);
		background: rgba(255, 255, 255, 0.12);
	}

	/* Responsive */
	@media (max-width: 64rem) {
		.reviews-container {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 48rem) {
		.container {
			padding: var(--space-12);
		}

		.reviews-header {
			padding: var(--space-20) var(--space-16);
		}

		.reviews-header h1 {
			font-size: 1.5rem;
		}

		.review-header {
			flex-direction: column;
		}

		.review-footer {
			flex-direction: column;
			gap: var(--space-12);
		}

		.modal {
			padding: var(--space-20);
		}
	}
</style>

