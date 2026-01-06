<script lang="ts">
	import type { SpotifyTrack } from "../types";
	import { playPreview, stopPreview, currentAudio, currentPreview } from "$lib/stores/audio";
	import PlayerBadge from "./PlayerBadge.svelte";
	import { get } from "svelte/store";

	let { track, onPlay = undefined, onSimilar = undefined } = $props<{
		track: SpotifyTrack;
		onPlay?: (id: string) => void;
		onSimilar?: (id: string) => void;
	}>();

	let isPlaying = $state(false);
	let isActive = $state(false);

	// Subscribe to preview store
	const unsub1 = currentAudio.subscribe(a => {
		if (!a) {
			isPlaying = false;
			return;
		}

		try {
			isPlaying = a.src === (track.preview_url ?? "") && !a.paused;
		} catch {
			isPlaying = false;
		}
	});

	const unsub2 = currentPreview.subscribe(p => {
		isActive = p?.id === track.id;
	});

	// Auto-cleanup when component is removed
	$effect(() => {
		return () => {
			unsub1();
			unsub2();
		};
	});

	function togglePreview() {
		const active = get(currentAudio);

		if (active && active.src === (track.preview_url ?? "")) {
			stopPreview();
			return;
		}

		if (!track.preview_url) return;

		playPreview(track.preview_url, {
			id: track.id,
			name: track.name,
			artists: track.artists?.map((a: { name: string }) => a.name),
			albumImage: track.album?.images?.[2]?.url ?? track.album?.images?.[0]?.url ?? null
		});
	}

</script>

<div class="track-item" class:active={isActive}>
	<div class="album-art">
		<img src={track.album?.images?.[0]?.url} alt={track.name} />
	</div>

	<div class="track-info">
		<h3 class="track-name">{track.name}</h3>
		<p class="track-artist">
			{#each track.artists as a, i}
				{a.name}{i < track.artists.length - 1 ? ", " : ""}
			{/each}
		</p>
		<p class="track-album">{track.album?.name}</p>
	</div>

	<div class="track-actions">
		{#if onPlay}
			<button class="action-btn play-btn" onclick={() => onPlay(track.id)}>▶️</button>
		{/if}

		{#if isActive}
			<PlayerBadge {isPlaying} />
		{/if}

		{#if track.preview_url}
			<button class="action-btn preview-btn" onclick={togglePreview}>
				{isPlaying ? "⏸" : "▶ Preview"}
			</button>
		{/if}

		{#if onSimilar}
			<button class="action-btn similar-btn" onclick={() => onSimilar(track.id)}>🔄</button>
		{/if}
	</div>
</div>

<style>
	.track-item {
		display: flex;
		gap: var(--space-16);
		padding: var(--space-12);
		background: var(--color-bg-light);
		border-radius: var(--radius-md);
		transition: background-color var(--transition-base);
	}

	.track-item:hover {
		background: var(--color-bg-medium);
	}

	.track-item.active {
		border: 0.0625rem solid rgba(29,185,84,0.25);
		box-shadow: 0 0.375rem 1rem rgba(0,0,0,0.25);
		transform: translateY(-0.125rem);
	}

	.album-art {
		flex-shrink: 0;
		width: 3.75rem;
		height: 3.75rem;
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.album-art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.track-info {
		flex: 1;
		min-width: 0;
	}

	.track-name {
		margin: 0;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-artist,
	.track-album {
		margin: var(--space-2) 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-actions {
		display: flex;
		gap: var(--space-8);
		align-items: center;
	}

	.action-btn {
		padding: var(--space-8) var(--space-12);
		background: var(--color-primary);
		color: var(--color-text-primary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		transition: all var(--transition-base);
	}

	.preview-btn {
		background: linear-gradient(90deg, var(--color-primary), var(--color-accent-blue));
	}

	.similar-btn {
		background: var(--color-accent-blue);
	}
</style>
