<script lang="ts">
	export let isPlaying: boolean = false;

	let bars = [1, 2, 3, 4, 5];
</script>

<div class="player-badge" class:playing={isPlaying}>
	<div class="equalizer">
		{#each bars as bar (bar)}
			<div class="bar"></div>
		{/each}
	</div>
	<div class="turntable">
		<div class="record" class:spinning={isPlaying}></div>
		<div class="label"></div>
	</div>
</div>

<style>
	.player-badge {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-8) var(--space-12);
		background: var(--color-bg-light);
		border-radius: var(--radius-md);
		border: 2px solid var(--color-primary);
		transition: all var(--transition-base);
	}

	.player-badge.playing {
		box-shadow: 0 0 12px rgba(29, 185, 84, 0.3);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 12px rgba(29, 185, 84, 0.3);
		}
		50% {
			box-shadow: 0 0 20px rgba(29, 185, 84, 0.5);
		}
		100% {
			box-shadow: 0 0 12px rgba(29, 185, 84, 0.3);
		}
	}

	.equalizer {
		display: flex;
		gap: var(--space-2);
		align-items: flex-end;
		height: 24px;
	}

	.bar {
		width: 3px;
		height: 100%;
		background: var(--color-primary);
		border-radius: var(--radius-xs);
		animation: bounce 0.5s infinite;
	}

	.bar:nth-child(1) {
		animation-delay: 0s;
	}

	.bar:nth-child(2) {
		animation-delay: 0.1s;
	}

	.bar:nth-child(3) {
		animation-delay: 0.2s;
	}

	.bar:nth-child(4) {
		animation-delay: 0.1s;
	}

	.bar:nth-child(5) {
		animation-delay: 0s;
	}

	@keyframes bounce {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: 20px;
		}
	}

	.turntable {
		position: relative;
		width: 32px;
		height: 32px;
	}

	.record {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 30% 30%, #333, #000);
		border-radius: 50%;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.record::before {
		content: '';
		position: absolute;
		inset: 8px;
		background: radial-gradient(circle, #1db954, #000);
		border-radius: 50%;
	}

	.record.spinning {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.label {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 12px;
		height: 12px;
		background: var(--color-primary);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		z-index: 1;
	}
</style>
