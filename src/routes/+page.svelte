<script lang="ts">
	import { onMount } from 'svelte';
	
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>NebulaKit - Cosmic SvelteKit Starter</title>
	<meta name="description" content="A cosmic-grade SvelteKit starter powered by Cloudflare" />
</svelte:head>

<div class="hero">
	<div class="container">
		<div class="hero-content" class:mounted>
			<h1>
				<span class="gradient-text">NebulaKit</span>
			</h1>
			<p class="tagline">
				A cosmic-grade SvelteKit starter powered by Cloudflare's full stack
			</p>
			
			<div class="features">
				<div class="feature-card">
					<div class="icon">🚀</div>
					<h3>Cloudflare Powered</h3>
					<p>D1, KV, R2, Queues, and Turnstile built-in</p>
				</div>
				
				<div class="feature-card">
					<div class="icon">🎨</div>
					<h3>Theme System</h3>
					<p>Light/dark modes with extensible theming</p>
				</div>
				
				<div class="feature-card">
					<div class="icon">⌨️</div>
					<h3>Command Palette</h3>
					<p>Press <kbd>Cmd/Ctrl + K</kbd> to open</p>
				</div>
				
				<div class="feature-card">
					<div class="icon">💬</div>
					<h3>LLM Chat UI</h3>
					<p>Ready-to-use chat interface</p>
				</div>
				
				<div class="feature-card">
					<div class="icon">🔐</div>
					<h3>Full Auth</h3>
					<p>SSO, email, and account linking</p>
				</div>
				
				<div class="feature-card">
					<div class="icon">📱</div>
					<h3>Mobile First</h3>
					<p>Responsive layouts out of the box</p>
				</div>
			</div>
			
			<div class="cta-buttons">
				<a href="/chat" class="btn btn-primary">Try Chat</a>
				<a href="/auth/login" class="btn btn-secondary">Sign In</a>
				<a href="/demo" class="btn btn-outline">View Demo</a>
			</div>
		</div>
	</div>
</div>

<style>
	.hero {
		padding: var(--spacing-2xl) 0;
		min-height: calc(100vh - 80px);
		display: flex;
		align-items: center;
	}
	
	.hero-content {
		text-align: center;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.6s ease, transform 0.6s ease;
	}
	
	.hero-content.mounted {
		opacity: 1;
		transform: translateY(0);
	}
	
	h1 {
		margin-bottom: var(--spacing-md);
		font-size: 2.5rem;
	}
	
	@media (min-width: 768px) {
		h1 {
			font-size: 4rem;
		}
	}
	
	.gradient-text {
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.tagline {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-2xl);
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	@media (min-width: 768px) {
		.tagline {
			font-size: 1.5rem;
		}
	}
	
	.features {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-2xl);
		max-width: 1000px;
		margin-left: auto;
		margin-right: auto;
	}
	
	@media (min-width: 640px) {
		.features {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	
	@media (min-width: 1024px) {
		.features {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	
	.feature-card {
		background: var(--color-surface);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		transition: transform var(--transition-base), box-shadow var(--transition-base);
	}
	
	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}
	
	.icon {
		font-size: 2.5rem;
		margin-bottom: var(--spacing-sm);
	}
	
	.feature-card h3 {
		margin-bottom: var(--spacing-xs);
		font-size: 1.125rem;
	}
	
	.feature-card p {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}
	
	kbd {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.125rem 0.375rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}
	
	.cta-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		max-width: 400px;
		margin: 0 auto;
	}
	
	@media (min-width: 640px) {
		.cta-buttons {
			flex-direction: row;
			justify-content: center;
		}
	}
	
	.btn {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		font-weight: 500;
		text-align: center;
		transition: all var(--transition-fast);
		text-decoration: none;
	}
	
	.btn-primary {
		background: var(--color-primary);
		color: white;
	}
	
	.btn-primary:hover {
		background: var(--color-primary-hover);
		color: white;
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.btn-secondary {
		background: var(--color-secondary);
		color: white;
	}
	
	.btn-secondary:hover {
		background: var(--color-secondary-hover);
		color: white;
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.btn-outline {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}
	
	.btn-outline:hover {
		background: var(--color-surface);
		color: var(--color-text);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
