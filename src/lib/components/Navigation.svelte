<script lang="ts">
	import { page } from '$app/stores';
	
	let mobileMenuOpen = false;
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<nav class="nav">
	<div class="container">
		<div class="nav-content">
			<a href="/" class="logo" on:click={closeMobileMenu}>
				<span class="logo-icon">✨</span>
				<span class="logo-text">NebulaKit</span>
			</a>
			
			<button class="mobile-menu-btn" on:click={toggleMobileMenu} aria-label="Toggle menu">
				{#if mobileMenuOpen}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				{:else}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				{/if}
			</button>
			
			<div class="nav-links" class:open={mobileMenuOpen}>
				<a href="/" class:active={$page.url.pathname === '/'} on:click={closeMobileMenu}>
					Home
				</a>
				<a href="/chat" class:active={$page.url.pathname === '/chat'} on:click={closeMobileMenu}>
					Chat
				</a>
				<a href="/demo" class:active={$page.url.pathname === '/demo'} on:click={closeMobileMenu}>
					Demo
				</a>
				<a href="/auth/login" class:active={$page.url.pathname.startsWith('/auth')} on:click={closeMobileMenu}>
					Sign In
				</a>
			</div>
		</div>
	</div>
</nav>

<style>
	.nav {
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 50;
		backdrop-filter: blur(10px);
	}
	
	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text);
		text-decoration: none;
		transition: opacity var(--transition-fast);
	}
	
	.logo:hover {
		opacity: 0.8;
	}
	
	.logo-icon {
		font-size: 1.5rem;
	}
	
	.mobile-menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--color-text);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
	}
	
	.mobile-menu-btn:hover {
		background: var(--color-surface-hover);
	}
	
	@media (min-width: 768px) {
		.mobile-menu-btn {
			display: none;
		}
	}
	
	.nav-links {
		display: none;
		flex-direction: column;
		position: absolute;
		top: 64px;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		padding: var(--spacing-md);
		gap: var(--spacing-xs);
	}
	
	.nav-links.open {
		display: flex;
	}
	
	@media (min-width: 768px) {
		.nav-links {
			display: flex;
			flex-direction: row;
			position: static;
			border: none;
			padding: 0;
			gap: var(--spacing-md);
		}
	}
	
	.nav-links a {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
		font-weight: 500;
	}
	
	.nav-links a:hover {
		color: var(--color-text);
		background: var(--color-surface-hover);
	}
	
	.nav-links a.active {
		color: var(--color-primary);
		background: var(--color-surface-hover);
	}
</style>
