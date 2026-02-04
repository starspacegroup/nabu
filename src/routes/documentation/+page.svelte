<script lang="ts">
	// No runtime state needed
</script>

<svelte:head>
	<title>Documentation - NebulaKit</title>
	<meta
		name="description"
		content="NebulaKit documentation - Learn how to build with the cosmic-grade SvelteKit starter powered by Cloudflare"
	/>
</svelte:head>

<main class="docs-page">
	<div class="docs-container">
		<header class="docs-header">
			<h1>✨ NebulaKit Documentation</h1>
			<p class="docs-intro">
				A cosmic-grade SvelteKit starter template powered by Cloudflare's full stack.
				Production-ready with Cloudflare Workers integration (D1, KV, R2, Queues, Turnstile), a
				complete theme system, command palette, LLM chat UI, full authentication, and polished
				drag-and-drop.
			</p>
		</header>

		<nav class="docs-nav" aria-label="Documentation navigation">
			<a href="#features">Features</a>
			<a href="#quick-start">Quick Start</a>
			<a href="#testing">Testing</a>
			<a href="#project-structure">Structure</a>
			<a href="#theming">Theming</a>
			<a href="#authentication">Auth</a>
			<a href="#cloudflare">Cloudflare</a>
			<a href="#deployment">Deployment</a>
			<a href="#contributing">Contributing</a>
		</nav>

		<section id="features" class="docs-section">
			<h2>🌟 Features</h2>
			<div class="feature-grid">
				<div class="feature-card">
					<h3>🚀 Cloudflare Full Stack</h3>
					<p>D1 database, KV storage, R2 buckets, Queues, and Turnstile built-in.</p>
				</div>
				<div class="feature-card">
					<h3>🎨 Theme System</h3>
					<p>Light/dark modes with extensible CSS variables and WCAG AA compliance.</p>
				</div>
				<div class="feature-card">
					<h3>⌨️ Command Palette</h3>
					<p>Keyboard-first navigation with Cmd/Ctrl + K.</p>
				</div>
				<div class="feature-card">
					<h3>💬 LLM Chat UI</h3>
					<p>Ready-to-use chat interface for AI integration with multiple providers.</p>
				</div>
				<div class="feature-card">
					<h3>🔐 Full Authentication</h3>
					<p>Email/password + SSO (Google, GitHub) with account linking.</p>
				</div>
				<div class="feature-card">
					<h3>📱 Mobile-First</h3>
					<p>Responsive layouts optimized for all devices.</p>
				</div>
				<div class="feature-card">
					<h3>🎯 Drag & Drop</h3>
					<p>Polished DnD with cross-column and mobile support.</p>
				</div>
				<div class="feature-card">
					<h3>⚡ TypeScript</h3>
					<p>Full type safety with Cloudflare Workers types.</p>
				</div>
				<div class="feature-card">
					<h3>🎨 UI Components</h3>
					<p>Beautiful, accessible components out of the box.</p>
				</div>
			</div>
		</section>

		<section id="quick-start" class="docs-section">
			<h2>🚀 Quick Start</h2>
			<pre><code
					># Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy</code
				></pre>
			<p>
				Visit <code>http://localhost:5173</code> to see your app!
			</p>
		</section>

		<section id="testing" class="docs-section">
			<h2>🧪 Testing (TDD Required!)</h2>
			<p>
				NebulaKit follows <strong>Test-Driven Development</strong> with 90%+ code coverage requirements.
			</p>
			<pre><code
					># Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Check coverage (must be ≥90%)
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests (unit + E2E)
npm run test:all</code
				></pre>
			<p>
				<strong>Important:</strong> All features and bug fixes require tests written FIRST.
			</p>
		</section>

		<section id="project-structure" class="docs-section">
			<h2>🏗️ Project Structure</h2>
			<pre><code
					>NebulaKit/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores (theme, etc.)
│   │   ├── server/         # Server-side utilities
│   │   └── utils/          # Helper functions
│   ├── routes/             # SvelteKit routes
│   │   ├── auth/          # Authentication pages
│   │   ├── chat/          # LLM chat interface
│   │   └── demo/          # Feature demonstrations
│   ├── app.css            # Global styles & theme
│   └── app.html           # HTML template
├── static/                 # Static assets
└── wrangler.toml          # Cloudflare configuration</code
				></pre>
		</section>

		<section id="theming" class="docs-section">
			<h2>🎨 Theming</h2>
			<p>NebulaKit includes a comprehensive theme system with:</p>
			<ul>
				<li><strong>WCAG AA compliant</strong> colors (4.5:1 contrast minimum)</li>
				<li>Light and dark modes with automatic system detection</li>
				<li>CSS custom properties for all design tokens</li>
				<li>Accessibility-first design approach</li>
				<li>Automated contrast validation</li>
			</ul>
			<pre><code
					>/* All colors use CSS variables - never hardcode! */
.button &#123;
  background-color: var(--color-primary);
  color: var(--color-background);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
&#125;</code
				></pre>
			<h3>Validate Theme Contrast</h3>
			<pre><code>npm run validate:contrast</code></pre>
		</section>

		<section id="authentication" class="docs-section">
			<h2>🔐 Authentication</h2>
			<p>Built-in auth pages with support for:</p>
			<ul>
				<li>Email/password authentication</li>
				<li>OAuth providers (Google, GitHub)</li>
				<li>Session management</li>
				<li>Account linking</li>
			</ul>
			<p>
				Easily extend with <a href="https://authjs.dev/" target="_blank" rel="noopener noreferrer"
					>@auth/sveltekit</a
				> for more providers.
			</p>
		</section>

		<section id="cloudflare" class="docs-section">
			<h2>☁️ Cloudflare Integration</h2>

			<h3>D1 Database</h3>
			<pre><code
					>const result = await platform.env.DB
  .prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();</code
				></pre>

			<h3>KV Storage</h3>
			<pre><code
					>await platform.env.KV.put('key', 'value');
const value = await platform.env.KV.get('key');</code
				></pre>

			<h3>R2 Storage</h3>
			<pre><code
					>await platform.env.BUCKET.put('file.jpg', fileData);
const file = await platform.env.BUCKET.get('file.jpg');</code
				></pre>

			<h3>Queues</h3>
			<pre><code>await platform.env.QUEUE.send(&#123; data: 'message' &#125;);</code></pre>
		</section>

		<section id="deployment" class="docs-section">
			<h2>🚀 Deployment</h2>
			<p>
				NebulaKit is designed to be deployed via <strong>Cloudflare Pages</strong> connected to your
				GitHub repository for automatic deployments.
			</p>

			<h3>Step 1: Fork or Clone the Repository</h3>
			<p>
				Fork <a
					href="https://github.com/starspacegroup/NebulaKit"
					target="_blank"
					rel="noopener noreferrer">NebulaKit on GitHub</a
				> to your own account, or create a new repository from the template.
			</p>

			<h3>Step 2: Create a Pages Application</h3>
			<ol>
				<li>
					Log in to the <a
						href="https://dash.cloudflare.com/"
						target="_blank"
						rel="noopener noreferrer">Cloudflare Dashboard</a
					>
				</li>
				<li>Navigate to <strong>Workers & Pages</strong> in the sidebar</li>
				<li>
					Click <strong>Create</strong> → <strong>Pages</strong> → <strong>Connect to Git</strong>
				</li>
				<li>Authorize Cloudflare to access your GitHub account</li>
				<li>Select your NebulaKit repository</li>
			</ol>

			<h3>Step 3: Configure Build Settings</h3>
			<ul>
				<li><strong>Framework preset:</strong> SvelteKit</li>
				<li><strong>Build command:</strong> <code>npm run build</code></li>
				<li><strong>Build output directory:</strong> <code>.svelte-kit/cloudflare</code></li>
			</ul>

			<h3>Step 4: Set Up D1 Database</h3>
			<ol>
				<li>
					In the Cloudflare Dashboard, go to <strong>Workers & Pages</strong> → <strong>D1</strong>
				</li>
				<li>
					Click <strong>Create database</strong> and name it (e.g., <code>nebulakit-db</code>)
				</li>
				<li>Run the schema migration from the <code>migrations/schema.sql</code> file</li>
				<li>
					In your Pages project settings, go to <strong>Settings</strong> →
					<strong>Functions</strong> → <strong>D1 database bindings</strong>
				</li>
				<li>Add a binding with variable name <code>DB</code> pointing to your database</li>
			</ol>

			<h3>Step 5: Configure Environment Variables</h3>
			<p>
				In your Pages project, go to <strong>Settings</strong> →
				<strong>Environment variables</strong> and add:
			</p>
			<ul>
				<li><code>AUTH_SECRET</code> - A random secret for session encryption</li>
				<li><code>AUTH_TRUST_HOST</code> - Set to <code>true</code></li>
				<li><code>GITHUB_ID</code> / <code>GITHUB_SECRET</code> - For GitHub OAuth (optional)</li>
				<li><code>GOOGLE_ID</code> / <code>GOOGLE_SECRET</code> - For Google OAuth (optional)</li>
				<li><code>OPENAI_API_KEY</code> - For AI chat features (optional)</li>
			</ul>

			<h3>Step 6: Deploy</h3>
			<p>
				Click <strong>Save and Deploy</strong>. Cloudflare will build and deploy your app. Future
				pushes to your main branch will trigger automatic deployments, and pull requests will get
				preview deployments.
			</p>

			<h3>Custom Domain (Optional)</h3>
			<p>
				In your Pages project, go to <strong>Custom domains</strong> to add your own domain. Cloudflare
				will automatically provision SSL certificates.
			</p>
		</section>

		<section id="tech-stack" class="docs-section">
			<h2>🛠️ Tech Stack</h2>
			<ul>
				<li>
					<a href="https://kit.svelte.dev/" target="_blank" rel="noopener noreferrer">SvelteKit</a> -
					Web framework
				</li>
				<li>
					<a href="https://workers.cloudflare.com/" target="_blank" rel="noopener noreferrer"
						>Cloudflare Workers</a
					> - Edge runtime
				</li>
				<li>
					<a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer"
						>TypeScript</a
					> - Type safety
				</li>
				<li>
					<a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">Vite</a> - Build tool
				</li>
				<li>
					<a href="https://vitest.dev/" target="_blank" rel="noopener noreferrer">Vitest</a> - Unit testing
				</li>
				<li>
					<a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a>
					- E2E testing
				</li>
			</ul>
		</section>

		<section id="contributing" class="docs-section">
			<h2>🤝 Contributing</h2>
			<p>We welcome contributions! Key requirements:</p>
			<ul>
				<li>✅ Test-Driven Development (TDD) - write tests first</li>
				<li>✅ 90%+ code coverage on all changes</li>
				<li>✅ Cloudflare-first architecture</li>
				<li>✅ Minimal external dependencies</li>
				<li>✅ All tests passing before PR</li>
			</ul>
		</section>

		<section id="resources" class="docs-section">
			<h2>📚 Additional Resources</h2>
			<ul>
				<li>
					<a
						href="https://github.com/starspacegroup/NebulaKit"
						target="_blank"
						rel="noopener noreferrer">GitHub Repository</a
					>
				</li>
				<li>
					<a
						href="https://developers.cloudflare.com/workers/"
						target="_blank"
						rel="noopener noreferrer">Cloudflare Workers Docs</a
					>
				</li>
				<li>
					<a href="https://developers.cloudflare.com/d1/" target="_blank" rel="noopener noreferrer"
						>Cloudflare D1 Docs</a
					>
				</li>
				<li>
					<a href="https://kit.svelte.dev/docs" target="_blank" rel="noopener noreferrer"
						>SvelteKit Docs</a
					>
				</li>
				<li>
					<a href="https://vitest.dev/" target="_blank" rel="noopener noreferrer">Vitest Docs</a>
				</li>
				<li>
					<a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer"
						>Playwright Docs</a
					>
				</li>
			</ul>
		</section>

		<footer class="docs-footer">
			<p>
				⭐ If you find NebulaKit useful, please consider giving it a star on <a
					href="https://github.com/starspacegroup/NebulaKit"
					target="_blank"
					rel="noopener noreferrer">GitHub</a
				>!
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
		scroll-margin-top: 5rem;
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
