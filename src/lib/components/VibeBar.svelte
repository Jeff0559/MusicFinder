<script lang="ts">
	export let label: string = 'Vibe';
	export let value: number = 50;
	export let max: number = 100;
	export let color: string = 'var(--color-primary)';
	export let unit: string = '';

	$: percentage = (value / max) * 100;
</script>

<div class="vibe-bar-container">
	<div class="bar-header">
		<div class="bar-label">{label}</div>
		<span class="bar-value">{Math.round(value)}{unit}</span>
	</div>

	<div class="bar-background">
		<div class="bar-fill" style="width: {percentage}%; background-color: {color};"></div>
	</div>
</div>

<style>
	.vibe-bar-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.bar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.bar-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		margin: 0;
	}

	.bar-value {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
	}

	.bar-background {
		width: 100%;
		height: 0.5rem;
		background: var(--color-bg-light);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width var(--transition-base);
	}
</style>
