<script lang="ts">
	import type { SpotifyAlbum } from '$lib/types';

	export let album: SpotifyAlbum;
	export let onViewDetails: (() => void) | undefined = undefined;

	const imageUrl = album.images?.[0]?.url ?? '/fallback-cover.png';
	const yearFromDate = album.release_date ? new Date(album.release_date).getFullYear() : null;
	const firstArtist = album.artists?.[0]?.name ?? 'Unknown Artist';
</script>

<button class="album-card" type="button" onclick={() => onViewDetails?.()}>
	<div class="album-cover">
		<img src={imageUrl} alt={album.name} loading="lazy" />
	</div>
	<div class="album-info">
		<h4 class="album-name">{album.name}</h4>
		<p class="album-artist">{firstArtist}</p>
		{#if yearFromDate}
			<p class="album-year">{yearFromDate}</p>
		{/if}
	</div>
</button>

<style>
	.album-card {
		all: unset;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		cursor: pointer;
		border-radius: 12px;
		padding: 0.5rem;
		transition: all 0.2s ease;
		background: #1e232a;
		border: 1px solid #2a2f36;
	}

	.album-card:hover {
		transform: translateY(-4px);
		background: #242b33;
		border-color: #1db954;
	}

	.album-card:focus {
		outline: 2px solid #1db954;
		outline-offset: 2px;
	}

	.album-cover {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		background: #14181f;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.album-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}


	.album-info {
		padding: 0 0.5rem;
	}

	.album-name {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: #e6f0ff;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.3;
	}

	.album-artist {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: #8aa0b2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.album-year {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		color: #627286;
	}
</style>
