<script lang="ts">
	import { onMount } from 'svelte';
	import AlbumCard from '$lib/components/AlbumCard.svelte';
	import RatingStars from '$lib/components/RatingStars.svelte';
	import type { SpotifyAlbum } from '$lib/types';

	type StoredReview = {
		id: string;
		trackName: string;
		artist: string;
		album: string;
		rating: number;
		notes: string;
		createdAt: string;
	};

	const albumFromReview = (review: StoredReview): SpotifyAlbum => ({
		id: review.id,
		name: review.album,
		artists: [{ id: review.id, name: review.artist }],
		images: reviewCovers[review.id] ? [{ url: reviewCovers[review.id] }] : []
	});

	let reviewedTracks: StoredReview[] = [];
	let selectedAlbum: StoredReview | null = null;
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
			selectedAlbum = reviewedTracks[0] ?? null;
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
				const query = encodeURIComponent(
					`${review.trackName} ${review.artist} ${review.album}`.trim()
				);
				try {
					const resp = await fetch(`/api/cover?q=${query}`);
					if (!resp.ok) return;
					const data = await resp.json();
					if (data?.image) {
						updates[review.id] = data.image;
					}
				} catch {
					// ignore cover fetch errors
				}
			})
		);
		if (Object.keys(updates).length) {
			reviewCovers = { ...reviewCovers, ...updates };
		}
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

	function handleViewAlbum(review: StoredReview) {
		selectedAlbum = review;
	}

	async function submitReview(event: Event) {
		event.preventDefault();
		if (saving) return;

		if (!newReview.trackName.trim() || !newReview.artist.trim() || !newReview.album.trim()) {
			error = 'Bitte Track, Artist und Album ausfüllen.';
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
			if (selectedAlbum?.id === id) {
				selectedAlbum = null;
			}
		} catch (err) {
			console.error('deleteReview failed', err);
			error = 'Review konnte nicht gelöscht werden.';
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
				+ Add Review
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
								{#if reviewCovers[track.id]}
									<img src={reviewCovers[track.id]} alt={track.album} loading="lazy" />
								{:else}
									<div class="cover-placeholder">No Image</div>
								{/if}
							</div>
							<div class="review-info">
								<h3>{track.trackName}</h3>
								<p class="artist">{track.artist}</p>
								<p class="album-name">from <strong>{track.album}</strong></p>
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

		<aside class="albums-sidebar">
			<div class="sidebar-header">
				<h2>Albums</h2>
			</div>

			<div class="albums-grid">
				{#if reviewedTracks.length === 0}
					<p class="muted">Noch keine Alben gespeichert.</p>
				{:else}
					{#each reviewedTracks as track (track.id)}
						<AlbumCard
							album={albumFromReview(track)}
							onViewDetails={() => handleViewAlbum(track)}
						/>
					{/each}
				{/if}
			</div>

			{#if selectedAlbum}
				<div class="album-detail">
					<h3>Review Details</h3>
					<div class="album-info">
						<p><strong>Track:</strong> {selectedAlbum.trackName}</p>
						<p><strong>Artist:</strong> {selectedAlbum.artist}</p>
						<p><strong>Album:</strong> {selectedAlbum.album}</p>
						<p><strong>Bewertung:</strong> {selectedAlbum.rating.toFixed(1)} / 5</p>
						<p><strong>Hinzugefuegt:</strong> {new Date(selectedAlbum.createdAt).toLocaleDateString('de-DE')}</p>
					</div>
				</div>
			{/if}
		</aside>
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
						<label for="album-name">Album</label>
						<input id="album-name" type="text" bind:value={newReview.album} required placeholder="Enter album name..." />
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
	:global(body) {
		background-color: #0f1218;
		min-height: 100vh;
		position: relative;
	}
	:global(body)::before {
		content: '';
		position: fixed;
		inset: -10%;
		background: url('/bg-reviews.gif?v=2') center/cover no-repeat;
		transform: scale(0.85);
		transform-origin: center;
		z-index: -2;
		pointer-events: none;
	}
	:global(body)::after {
		content: '';
		position: fixed;
		inset: 0;
		background: linear-gradient(180deg, rgba(8, 10, 14, 0.52), rgba(8, 10, 14, 0.74));
		z-index: -1;
		pointer-events: none;
	}

	.container {
		max-width: 1600px;
		margin: 0 auto;
		padding: var(--space-24);
	}

	/* Header Section */
	.reviews-header {
		text-align: center;
		margin-bottom: var(--space-48);
		padding: var(--space-32) var(--space-24);
		background: linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
		border-radius: var(--radius-xl);
		border: 2px solid var(--color-accent-purple);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		align-items: center;
	}

	.reviews-header h1 {
		margin: 0;
		font-size: var(--font-size-4xl);
		background: linear-gradient(135deg, var(--color-accent-yellow), var(--color-accent-purple));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.reviews-header p {
		margin: 0;
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
	}

	.add-review-btn {
		all: unset;
		padding: var(--space-12) var(--space-24);
		background: var(--color-primary);
		color: var(--color-text-primary);
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.add-review-btn:hover {
		background: var(--color-primary-dark);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.add-review-btn:focus {
		outline: 2px solid var(--color-accent-blue);
		outline-offset: 2px;
	}

	/* Main Layout */
	.reviews-container {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: var(--space-32);
	}

	/* Reviews List */
	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
	}

	.list-header {
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: var(--space-12);
	}

	.list-header h2 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-primary);
	}

	.error-banner {
		margin: var(--space-12) 0;
		padding: var(--space-12) var(--space-16);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-error);
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
		padding: var(--space-48);
		background: var(--color-bg-light);
		border-radius: var(--radius-lg);
		border: 2px dashed var(--color-primary);
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: var(--space-16);
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
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
		gap: var(--space-16);
		padding: var(--space-24);
		background: linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-medium) 100%);
		border-radius: var(--radius-lg);
		border-left: 4px solid var(--color-accent-purple);
		transition: all var(--transition-base);
	}

	.review-card:hover {
		transform: translateX(4px);
		box-shadow: var(--shadow-lg);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-16);
	}
	.review-cover {
		width: 64px;
		height: 64px;
		border-radius: 10px;
		overflow: hidden;
		background: #14181f;
		border: 1px solid rgba(255, 255, 255, 0.08);
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
		font-size: var(--font-size-xl);
		color: var(--color-primary);
	}

	.artist,
	.album-name {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.review-rating {
		text-align: right;
	}

	.review-notes {
		padding: var(--space-12);
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-accent-blue);
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
		padding-top: var(--space-12);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.review-actions {
		display: flex;
		gap: var(--space-8);
	}

	.action-btn {
		all: unset;
		padding: var(--space-6) var(--space-12);
		background: transparent;
		border: 1px solid var(--color-text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: var(--font-size-xs);
		transition: all var(--transition-base);
	}

	.action-btn:hover {
		border-color: var(--color-text-primary);
		color: var(--color-text-primary);
	}

	.edit-btn:hover {
		background: rgba(30, 144, 255, 0.2);
		border-color: var(--color-accent-blue);
	}

	.delete-btn:hover {
		background: rgba(255, 107, 107, 0.2);
		border-color: var(--color-error);
	}

	/* Sidebar */
	.albums-sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
	}

	.sidebar-header {
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: var(--space-12);
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-primary);
	}

	.albums-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-16);
		max-height: 600px;
		overflow-y: auto;
	}

	.album-detail {
		padding: var(--space-16);
		background: var(--color-bg-light);
		border-radius: var(--radius-lg);
		border: 2px solid var(--color-accent-blue);
	}

	.album-detail h3 {
		margin: 0 0 var(--space-12) 0;
		font-size: var(--font-size-md);
		color: var(--color-accent-blue);
	}

	.album-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.album-info p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
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
		background: var(--color-bg-light);
		border-radius: var(--radius-lg);
		padding: var(--space-28);
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-2xl);
		animation: slideUp 300ms ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(40px);
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
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: var(--space-12);
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-primary);
	}

	.close-btn {
		all: unset;
		font-size: var(--font-size-xl);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.close-btn:hover {
		transform: scale(1.2);
		color: var(--color-error);
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
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.form-group input,
	.form-group textarea {
		padding: var(--space-12);
		background: var(--color-bg-dark);
		border: 2px solid var(--color-bg-medium);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-md);
		transition: border-color var(--transition-base);
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-group textarea {
		resize: vertical;
		font-family: var(--font-family-base);
	}

	.rating-input {
		padding: var(--space-12);
		background: var(--color-bg-dark);
		border-radius: var(--radius-md);
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
		background: var(--color-primary);
		color: var(--color-text-primary);
	}

	.btn-primary:hover {
		background: var(--color-primary-dark);
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: var(--color-bg-medium);
		color: var(--color-text-primary);
		border: 1px solid var(--color-text-secondary);
	}

	.btn-secondary:hover {
		border-color: var(--color-text-primary);
		background: var(--color-bg-light);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.reviews-container {
			grid-template-columns: 1fr;
		}

		.albums-sidebar {
			order: 2;
		}

		.albums-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			max-height: auto;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: var(--space-12);
		}

		.reviews-header {
			padding: var(--space-20) var(--space-16);
		}

		.reviews-header h1 {
			font-size: var(--font-size-3xl);
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
