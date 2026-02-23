<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { BrandProfile } from '$lib/types/onboarding';

	export let data: PageData;

	// data is used by SvelteKit for page load data
	$: void data;

	let brands: BrandProfile[] = [];
	let isLoading = true;
	let error: string | null = null;

	// Action states
	let duplicatingId: string | null = null;
	let archivingId: string | null = null;
	let confirmArchiveId: string | null = null;
	let creatingBrand = false;

	onMount(async () => {
		await loadBrands();
	});

	async function loadBrands() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch('/api/brand/profiles');
			if (!res.ok) throw new Error('Failed to load brands');
			const result = await res.json();
			brands = result.profiles || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load brands';
		} finally {
			isLoading = false;
		}
	}

	async function duplicateBrand(profileId: string) {
		duplicatingId = profileId;
		try {
			const res = await fetch('/api/brand/profiles/duplicate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceProfileId: profileId })
			});

			if (!res.ok) throw new Error('Failed to duplicate brand');

			await loadBrands();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to duplicate';
		} finally {
			duplicatingId = null;
		}
	}

	async function archiveBrand(profileId: string) {
		archivingId = profileId;
		try {
			const res = await fetch(`/api/brand/profile/${profileId}`, {
				method: 'DELETE'
			});

			if (!res.ok) throw new Error('Failed to archive brand');

			confirmArchiveId = null;
			await loadBrands();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to archive';
		} finally {
			archivingId = null;
		}
	}

	function getCompletionStats(brand: BrandProfile) {
		const fields = [
			brand.brandName,
			brand.tagline,
			brand.missionStatement,
			brand.visionStatement,
			brand.elevatorPitch,
			brand.brandArchetype,
			brand.brandPersonalityTraits,
			brand.toneOfVoice,
			brand.communicationStyle,
			brand.targetAudience,
			brand.customerPainPoints,
			brand.valueProposition,
			brand.primaryColor,
			brand.secondaryColor,
			brand.accentColor,
			brand.colorPalette,
			brand.typographyHeading,
			brand.typographyBody,
			brand.logoConcept,
			brand.industry,
			brand.competitors,
			brand.uniqueSellingPoints,
			brand.marketPosition,
			brand.originStory,
			brand.brandValues,
			brand.brandPromise
		];

		const filled = fields.filter((f) => f != null && f !== '').length;
		const total = fields.length;
		return { filled, total, percent: Math.round((filled / total) * 100) };
	}

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	async function createNewBrand() {
		creatingBrand = true;
		error = null;
		try {
			const res = await fetch('/api/onboarding/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (!res.ok) throw new Error('Failed to create brand');
			const data = await res.json();
			await goto(`/onboarding?brand=${data.profile.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create brand';
		} finally {
			creatingBrand = false;
		}
	}
</script>

<svelte:head>
	<title>Brands — NebulaKit</title>
	<meta name="description" content="Manage all your brand profiles in one place." />
</svelte:head>

<div class="brands-page">
	<header class="page-header">
		<div class="header-left">
			<h1 class="page-title">Brands</h1>
			<p class="page-subtitle">Manage your brand profiles</p>
		</div>
		<div class="header-actions">
			<button class="create-button" on:click={createNewBrand} disabled={creatingBrand}>
				{#if creatingBrand}
					<div class="button-spinner"></div>
					Creating…
				{:else}
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					New Brand
				{/if}
			</button>
		</div>
	</header>

	{#if error}
		<div class="error-banner">
			<span>{error}</span>
			<button on:click={() => (error = null)} aria-label="Dismiss error">×</button>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading your brands...</p>
		</div>
	{:else if brands.length === 0}
		<div class="empty-state">
			<div class="empty-icon">✨</div>
			<h2>No Brands Yet</h2>
			<p>Start building your first brand with our AI-powered Brand Architect.</p>
			<button class="cta-button" on:click={createNewBrand} disabled={creatingBrand}>
				{creatingBrand ? 'Creating…' : 'Launch Brand Architect →'}
			</button>
		</div>
	{:else}
		<div class="brands-grid">
			{#each brands as brand (brand.id)}
				{@const stats = getCompletionStats(brand)}
				<article class="brand-card">
					<a href="/brand/{brand.id}" class="card-link">
						<div class="card-header">
							<div class="brand-colors">
								{#if brand.primaryColor}
									<span
										class="color-dot"
										style="background-color: {brand.primaryColor}"
									></span>
								{/if}
								{#if brand.secondaryColor}
									<span
										class="color-dot"
										style="background-color: {brand.secondaryColor}"
									></span>
								{/if}
								{#if brand.accentColor}
									<span
										class="color-dot"
										style="background-color: {brand.accentColor}"
									></span>
								{/if}
								{#if !brand.primaryColor && !brand.secondaryColor && !brand.accentColor}
									<span class="color-dot placeholder-dot"></span>
								{/if}
							</div>
							<span class="status-badge" class:completed={brand.status === 'completed'}>
								{brand.status === 'completed' ? 'Complete' : 'In Progress'}
							</span>
						</div>

						<h2 class="brand-name" class:codename={!brand.brandNameConfirmed}>
							{brand.brandName || 'New Brand'}
							{#if !brand.brandNameConfirmed}
								<span class="codename-badge">Codename</span>
							{/if}
						</h2>

						{#if brand.tagline}
							<p class="brand-tagline">{brand.tagline}</p>
						{/if}

						{#if brand.industry}
							<span class="brand-industry">{brand.industry}</span>
						{/if}

						<div class="completion-bar">
							<div class="completion-info">
								<span class="completion-text">{stats.percent}% complete</span>
								<span class="completion-count">{stats.filled}/{stats.total}</span>
							</div>
							<div class="progress-track">
								<div class="progress-fill" style="width: {stats.percent}%"></div>
							</div>
						</div>

						<div class="card-meta">
							<span class="meta-date">Updated {formatDate(brand.updatedAt)}</span>
						</div>
					</a>

					<div class="card-actions">
						<button
							class="action-btn"
							title="Duplicate brand"
							disabled={duplicatingId === brand.id}
							on:click|stopPropagation={() => duplicateBrand(brand.id)}
						>
							{#if duplicatingId === brand.id}
								<span class="btn-spinner"></span>
							{:else}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
							{/if}
						</button>

						{#if confirmArchiveId === brand.id}
							<div class="confirm-archive">
								<span>Archive?</span>
								<button
									class="confirm-yes"
									disabled={archivingId === brand.id}
									on:click|stopPropagation={() => archiveBrand(brand.id)}
								>
									{archivingId === brand.id ? '...' : 'Yes'}
								</button>
								<button
									class="confirm-no"
									on:click|stopPropagation={() => (confirmArchiveId = null)}
								>
									No
								</button>
							</div>
						{:else}
							<button
								class="action-btn danger"
								title="Archive brand"
								on:click|stopPropagation={() => (confirmArchiveId = brand.id)}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="3 6 5 6 21 6" />
									<path
										d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.brands-page {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-md);
		min-height: calc(100vh - 60px);
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.page-title {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--color-text);
		margin: 0;
		line-height: 1.2;
	}

	.page-subtitle {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		margin: var(--spacing-xs) 0 0;
	}

	.create-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--color-primary);
		color: var(--color-background);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 600;
		font-size: 0.85rem;
		white-space: nowrap;
		transition: background-color var(--transition-fast);
	}

	.create-button:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
	}

	.create-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.button-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--color-background);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	/* Error banner */
	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-error);
		color: var(--color-background);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-md);
		font-size: 0.85rem;
	}

	.error-banner button {
		background: none;
		border: none;
		color: var(--color-background);
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0 var(--spacing-xs);
	}

	/* Loading */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: var(--spacing-md);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		gap: var(--spacing-sm);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: var(--spacing-sm);
	}

	.empty-state h2 {
		color: var(--color-text);
		font-size: 1.5rem;
		font-weight: 700;
	}

	.empty-state p {
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		max-width: 360px;
		line-height: 1.5;
	}

	.cta-button {
		display: inline-block;
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-xl);
		background-color: var(--color-primary);
		color: var(--color-background);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9rem;
		transition: background-color var(--transition-fast);
	}

	.cta-button:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
	}

	.cta-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Brands grid */
	.brands-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
	}

	@media (min-width: 640px) {
		.brands-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 960px) {
		.brands-grid {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}

	/* Brand card */
	.brand-card {
		position: relative;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.brand-card:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.card-link {
		display: block;
		padding: var(--spacing-lg);
		text-decoration: none;
		color: inherit;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-sm);
	}

	.brand-colors {
		display: flex;
		gap: 4px;
	}

	.color-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid var(--color-border);
	}

	.placeholder-dot {
		background-color: var(--color-border);
	}

	.status-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		background-color: var(--color-border);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.status-badge.completed {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.brand-name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 var(--spacing-xs);
		line-height: 1.3;
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.brand-name.codename {
		font-style: italic;
	}

	.codename-badge {
		font-size: 0.6rem;
		font-weight: 500;
		font-style: normal;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.1em 0.4em;
		white-space: nowrap;
	}

	.brand-tagline {
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		margin: 0 0 var(--spacing-xs);
		font-style: italic;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.brand-industry {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		background-color: var(--color-border);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		margin-bottom: var(--spacing-sm);
	}

	/* Completion */
	.completion-bar {
		margin-top: var(--spacing-sm);
	}

	.completion-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.completion-text {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.completion-count {
		font-size: 0.7rem;
		color: var(--color-text-secondary);
	}

	.progress-track {
		height: 4px;
		background-color: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
		border-radius: 2px;
		transition: width var(--transition-base);
	}

	.card-meta {
		margin-top: var(--spacing-sm);
	}

	.meta-date {
		font-size: 0.7rem;
		color: var(--color-text-secondary);
	}

	/* Card actions */
	.card-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm);
		border-top: 1px solid var(--color-border);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast),
			background-color var(--transition-fast);
	}

	.action-btn:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
		background-color: var(--color-surface-hover);
	}

	.action-btn.danger:hover {
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	/* Confirm archive */
	.confirm-archive {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.confirm-yes,
	.confirm-no {
		padding: 2px 8px;
		font-size: 0.7rem;
		font-weight: 600;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		background: none;
		transition: all var(--transition-fast);
	}

	.confirm-yes {
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.confirm-yes:hover {
		background-color: var(--color-error);
		color: var(--color-background);
	}

	.confirm-no {
		color: var(--color-text-secondary);
	}

	.confirm-no:hover {
		background-color: var(--color-surface-hover);
	}

	@media (max-width: 480px) {
		.page-header {
			flex-direction: column;
		}

		.page-title {
			font-size: 1.4rem;
		}
	}
</style>
