<script lang="ts">
	import { page } from '$app/stores';
</script>

<nav class="navbar">
	<div class="navbar-container">
		<div class="navbar-brand">
			<span class="brand-logo">🎵</span>
			<span class="brand-name">MusicFinder</span>
		</div>

		<ul class="navbar-menu">
			<li>
				<a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>
					🏠 Home
				</a>
			</li>
			<li>
				<a href="/reviews" class="nav-link" class:active={$page.url.pathname.startsWith('/reviews')}>
					⭐ Reviews & Albums
				</a>
			</li>
			<li>
				<a href="/scoreboard" class="nav-link" class:active={$page.url.pathname === '/scoreboard'}>
					📊 Scoreboard
				</a>
			</li>
		</ul>
	</div>
</nav>

<style>
	.navbar {
		background: linear-gradient(135deg, var(--color-bg-light) 0%, var(--color-bg-medium) 100%);
		border-bottom: 2px solid var(--color-primary);
		box-shadow: var(--shadow-md);
		position: sticky;
		top: 0;
		z-index: var(--z-fixed);
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-16) var(--space-24);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
		color: var(--color-primary);
	}

	.brand-logo {
		font-size: 28px;
		animation: bounce-slow 2s infinite;
	}

	@keyframes bounce-slow {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.brand-name {
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent-blue));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.navbar-menu {
		display: flex;
		list-style: none;
		gap: var(--space-16);
		margin: 0;
		padding: 0;
	}

	.nav-link {
		all: unset;
		padding: var(--space-8) var(--space-16);
		background: transparent;
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		border: 2px solid transparent;
		text-decoration: none;
		display: inline-block;
	}

	.nav-link:hover {
		color: var(--color-primary);
		background: rgba(29, 185, 84, 0.1);
	}

	.nav-link.active {
		color: var(--color-primary);
		background: rgba(29, 185, 84, 0.2);
		border-color: var(--color-primary);
	}

	.nav-link:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.navbar-container {
			padding: var(--space-12) var(--space-16);
		}

		.brand-name {
			display: none;
		}

		.navbar-menu {
			gap: var(--space-8);
		}

		.nav-link {
			padding: var(--space-6) var(--space-12);
			font-size: var(--font-size-sm);
		}
	}
</style>
