<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>Documentation - NebulaKit</title>
	<meta
		name="description"
		content="NebulaKit documentation - Learn how to build with the cosmic-grade SvelteKit starter"
	/>
</svelte:head>

<main class="docs-page">
	<div class="docs-container">
		<header class="docs-header">
			<h1>Documentation</h1>
			<p class="docs-intro">
				Everything you need to know about building with NebulaKit, the cosmic-grade SvelteKit
				starter powered by Cloudflare.
			</p>
		</header>

		<nav class="docs-nav" aria-label="Documentation navigation">
			<a href="#getting-started">Getting Started</a>
			<a href="#features">Features</a>
			<a href="#architecture">Architecture</a>
			<a href="#development">Development</a>
			<a href="#deployment">Deployment</a>
		</nav>

		<section id="getting-started" class="docs-section">
			<h2>Getting Started</h2>
			<p>
				NebulaKit is a full-stack SvelteKit starter template optimized for Cloudflare Workers. It
				comes with authentication, database integration, AI capabilities, and a beautiful UI out of
				the box.
			</p>

			<h3>Prerequisites</h3>
			<ul>
				<li>Node.js 18+ installed</li>
				<li>A Cloudflare account</li>
				<li>Wrangler CLI installed globally</li>
			</ul>

			<h3>Quick Setup</h3>
			<ol>
				<li>
					Clone the repository from <a
						href="https://github.com/starspacegroup/NebulaKit"
						target="_blank"
						rel="noopener noreferrer">GitHub</a
					>
				</li>
				<li>Run <code>npm install</code> to install dependencies</li>
				<li>
					Copy <code>.dev.vars.example</code> to <code>.dev.vars</code> and configure your environment
				</li>
				<li>Run <code>npm run dev</code> to start the development server</li>
			</ol>
		</section>

		<section id="features" class="docs-section">
			<h2>Features</h2>
			<div class="feature-grid">
				<div class="feature-card">
					<h3>🔐 Authentication</h3>
					<p>
						Built-in authentication with OAuth providers (GitHub, Google) and email/password support
						via Auth.js.
					</p>
				</div>
				<div class="feature-card">
					<h3>💾 Database</h3>
					<p>Cloudflare D1 SQLite database with migrations and type-safe queries.</p>
				</div>
				<div class="feature-card">
					<h3>🤖 AI Chat</h3>
					<p>
						Integrated AI chat interface with multiple provider support (OpenAI, Anthropic,
						Cloudflare Workers AI).
					</p>
				</div>
				<div class="feature-card">
					<h3>🎨 Theme System</h3>
					<p>
						Light and dark mode with CSS custom properties and WCAG AA compliant contrast ratios.
					</p>
				</div>
				<div class="feature-card">
					<h3>⌨️ Command Palette</h3>
					<p>Keyboard-first navigation with a powerful command palette (Ctrl/Cmd + K).</p>
				</div>
				<div class="feature-card">
					<h3>🔧 Admin Dashboard</h3>
					<p>Full admin interface for managing users, API keys, and system configuration.</p>
				</div>
			</div>
		</section>

		<section id="architecture" class="docs-section">
			<h2>Architecture</h2>
			<p>
				NebulaKit follows a Cloudflare-first architecture, leveraging edge computing for optimal
				performance.
			</p>

			<h3>Tech Stack</h3>
			<ul>
				<li><strong>Framework:</strong> SvelteKit with TypeScript</li>
				<li><strong>Runtime:</strong> Cloudflare Workers</li>
				<li><strong>Database:</strong> Cloudflare D1 (SQLite)</li>
				<li><strong>Storage:</strong> Cloudflare R2 (optional)</li>
				<li><strong>Auth:</strong> Auth.js (NextAuth)</li>
				<li><strong>Testing:</strong> Vitest + Playwright</li>
			</ul>

			<h3>Project Structure</h3>
			<pre><code
					>src/
├── lib/
│   ├── components/    # Svelte components
│   ├── services/      # Business logic
│   ├── stores/        # Svelte stores
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes
└── app.css           # Global styles</code
				></pre>
		</section>

		<section id="development" class="docs-section">
			<h2>Development</h2>
			<p>
				NebulaKit follows Test-Driven Development (TDD) practices with a minimum 90% code coverage
				requirement.
			</p>

			<h3>Commands</h3>
			<ul>
				<li><code>npm run dev</code> - Start development server</li>
				<li><code>npm run test</code> - Run unit tests</li>
				<li><code>npm run test:coverage</code> - Run tests with coverage</li>
				<li><code>npm run check</code> - Type-check the project</li>
				<li><code>npm run build</code> - Build for production</li>
			</ul>
		</section>

		<section id="deployment" class="docs-section">
			<h2>Deployment</h2>
			<p>Deploy to Cloudflare Workers with a single command:</p>
			<pre><code>npm run deploy</code></pre>
			<p>
				For detailed deployment instructions, including setting up D1 databases and environment
				variables, visit the <a
					href="https://github.com/starspacegroup/NebulaKit"
					target="_blank"
					rel="noopener noreferrer">GitHub repository</a
				>.
			</p>
		</section>

		<footer class="docs-footer">
			<p>
				Need more help? Check out our <a
					href="https://github.com/starspacegroup/NebulaKit"
					target="_blank"
					rel="noopener noreferrer">GitHub</a
				>
				or reach out to the community.
			</p>
		</footer>
	</div>
</main>

<style>
	.docs-page {
		min-height: 100vh;
		padding: var(--spacing-xl) var(--spacing-md);
		background-color: var(--color-background);
	}

	.docs-container {
		max-width: 900px;
		margin: 0 auto;
	}

	.docs-header {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
		padding-bottom: var(--spacing-xl);
		border-bottom: 1px solid var(--color-border);
	}

	.docs-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-md);
	}

	.docs-intro {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
		max-width: 600px;
		margin: 0 auto;
	}

	.docs-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		justify-content: center;
		margin-bottom: var(--spacing-2xl);
		padding: var(--spacing-md);
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
	}

	.docs-nav a {
		padding: var(--spacing-sm) var(--spacing-md);
		color: var(--color-text-secondary);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.docs-nav a:hover {
		color: var(--color-primary);
		background-color: var(--color-surface-hover);
	}

	.docs-section {
		margin-bottom: var(--spacing-2xl);
		padding-bottom: var(--spacing-xl);
		border-bottom: 1px solid var(--color-border);
	}

	.docs-section:last-of-type {
		border-bottom: none;
	}

	.docs-section h2 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--spacing-lg);
	}

	.docs-section h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
	}

	.docs-section p {
		color: var(--color-text-secondary);
		line-height: 1.7;
		margin-bottom: var(--spacing-md);
	}

	.docs-section ul,
	.docs-section ol {
		color: var(--color-text-secondary);
		margin-left: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
	}

	.docs-section li {
		margin-bottom: var(--spacing-sm);
		line-height: 1.6;
	}

	.docs-section code {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		padding: 0.125rem 0.375rem;
		background-color: var(--color-surface);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
	}

	.docs-section pre {
		background-color: var(--color-surface);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin-bottom: var(--spacing-md);
	}

	.docs-section pre code {
		padding: 0;
		background: none;
	}

	.docs-section a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.docs-section a:hover {
		text-decoration: underline;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--spacing-lg);
		margin-top: var(--spacing-lg);
	}

	.feature-card {
		padding: var(--spacing-lg);
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.feature-card h3 {
		margin-top: 0;
		margin-bottom: var(--spacing-sm);
		font-size: 1.125rem;
	}

	.feature-card p {
		margin-bottom: 0;
		font-size: 0.9375rem;
	}

	.docs-footer {
		text-align: center;
		padding-top: var(--spacing-xl);
		color: var(--color-text-secondary);
	}

	.docs-footer a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.docs-footer a:hover {
		text-decoration: underline;
	}

	@media (min-width: 768px) {
		.docs-page {
			padding: var(--spacing-2xl);
		}

		.docs-header h1 {
			font-size: 3rem;
		}
	}
</style>
