<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { BrandProfile } from '$lib/types/onboarding';
	import BrandFieldCard from '$lib/components/BrandFieldCard.svelte';
	import BrandFieldHistory from '$lib/components/BrandFieldHistory.svelte';

	export let data: PageData;

	// data is used by SvelteKit for page load data
	$: void data;

	interface BrandFieldItem {
		key: string;
		label: string;
		value: unknown;
		type: 'text' | 'color' | 'list' | 'object' | 'archetype';
	}

	interface BrandSection {
		id: string;
		title: string;
		icon: string;
		fields: BrandFieldItem[];
	}

	let profile: BrandProfile | null = null;
	let sections: BrandSection[] = [];
	let isLoading = true;
	let error: string | null = null;

	// Field history modal
	let historyFieldKey: string | null = null;
	let historyFieldLabel: string | null = null;

	// Editing state
	let editingField: string | null = null;
	let editValue = '';

	// Completion stats
	$: filledFields = sections.reduce((count, section) => {
		return count + section.fields.filter((f) => f.value != null && f.value !== '').length;
	}, 0);

	$: totalFields = sections.reduce((count, section) => count + section.fields.length, 0);

	$: completionPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

	onMount(async () => {
		await loadProfile();
	});

	async function loadProfile() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch('/api/brand/profile');
			if (!res.ok) throw new Error('Failed to load brand profile');
			const result = await res.json();
			profile = result.profile;
			sections = result.sections || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load';
		} finally {
			isLoading = false;
		}
	}

	function openHistory(fieldKey: string, fieldLabel: string) {
		historyFieldKey = fieldKey;
		historyFieldLabel = fieldLabel;
	}

	function closeHistory() {
		historyFieldKey = null;
		historyFieldLabel = null;
	}

	function startEditing(fieldKey: string, currentValue: unknown) {
		editingField = fieldKey;
		if (currentValue == null) {
			editValue = '';
		} else if (typeof currentValue === 'string') {
			editValue = currentValue;
		} else if (Array.isArray(currentValue)) {
			editValue = currentValue.join(', ');
		} else {
			editValue = JSON.stringify(currentValue, null, 2);
		}
	}

	function cancelEditing() {
		editingField = null;
		editValue = '';
	}

	async function saveField(fieldKey: string, fieldType: string) {
		if (!profile) return;

		let parsedValue: unknown = editValue;

		// Parse list fields
		if (fieldType === 'list' && typeof editValue === 'string') {
			parsedValue = editValue
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		}

		// Parse object fields
		if (fieldType === 'object' && typeof editValue === 'string') {
			try {
				parsedValue = JSON.parse(editValue);
			} catch {
				// Keep as string if not valid JSON
			}
		}

		try {
			const res = await fetch('/api/brand/update-field', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: profile.id,
					fieldName: fieldKey,
					newValue: parsedValue,
					changeSource: 'manual'
				})
			});

			if (!res.ok) throw new Error('Failed to save');

			editingField = null;
			editValue = '';
			await loadProfile();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save field';
		}
	}

	async function handleRevert(event: CustomEvent<{ versionId: string }>) {
		if (!profile || !historyFieldKey) return;

		try {
			const res = await fetch('/api/brand/revert-field', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: profile.id,
					fieldName: historyFieldKey,
					versionId: event.detail.versionId
				})
			});

			if (!res.ok) throw new Error('Failed to revert');

			closeHistory();
			await loadProfile();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to revert';
		}
	}
</script>

<svelte:head>
	<title>Brand — Your Brand Profile | NebulaKit</title>
	<meta
		name="description"
		content="View and manage your brand profile, identity, visual assets, and style guide."
	/>
</svelte:head>

<div class="brand-page">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading your brand...</p>
		</div>
	{:else if !profile}
		<div class="empty-state">
			<div class="empty-icon">✨</div>
			<h2>No Brand Profile Yet</h2>
			<p>Start building your brand with our AI-powered Brand Architect.</p>
			<a href="/onboarding" class="cta-button"> Launch Brand Architect → </a>
		</div>
	{:else}
		<!-- Header -->
		<header class="brand-header">
			<div class="header-content">
				<div class="header-left">
					<h1 class="brand-title">
						{profile.brandName || 'Your Brand'}
					</h1>
					{#if profile.tagline}
						<p class="brand-tagline">{profile.tagline}</p>
					{/if}
				</div>
				<div class="header-actions">
					<a href="/onboarding" class="architect-link">
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
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
						Brand Architect
					</a>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="completion-bar">
				<div class="completion-info">
					<span class="completion-label">Profile Completion</span>
					<span class="completion-value">{completionPercent}%</span>
				</div>
				<div class="progress-track">
					<div class="progress-fill" style="width: {completionPercent}%"></div>
				</div>
				<div class="completion-detail">
					{filledFields} of {totalFields} fields completed
				</div>
			</div>
		</header>

		<!-- Error message -->
		{#if error}
			<div class="error-banner">
				<span>{error}</span>
				<button on:click={() => (error = null)} aria-label="Dismiss error">×</button>
			</div>
		{/if}

		<!-- Sections -->
		<div class="sections-grid">
			{#each sections as section}
				<section class="brand-section">
					<div class="section-header">
						<span class="section-icon">{section.icon}</span>
						<h2 class="section-title">{section.title}</h2>
					</div>

					<div class="fields-list">
						{#each section.fields as field}
							<BrandFieldCard
								fieldKey={field.key}
								label={field.label}
								value={field.value}
								type={field.type}
								isEditing={editingField === field.key}
								bind:editValue
								on:edit={() => startEditing(field.key, field.value)}
								on:save={() => saveField(field.key, field.type)}
								on:cancel={cancelEditing}
								on:history={() => openHistory(field.key, field.label)}
							/>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}

	<!-- Field History Modal -->
	{#if historyFieldKey && profile}
		<BrandFieldHistory
			profileId={profile.id}
			fieldName={historyFieldKey}
			fieldLabel={historyFieldLabel || historyFieldKey}
			on:close={closeHistory}
			on:revert={handleRevert}
		/>
	{/if}
</div>

<style>
	.brand-page {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-md);
		min-height: calc(100vh - 60px);
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
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: background-color var(--transition-fast);
	}

	.cta-button:hover {
		background-color: var(--color-primary-hover);
	}

	/* Header */
	.brand-header {
		margin-bottom: var(--spacing-xl);
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.brand-title {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--color-text);
		margin: 0;
		line-height: 1.2;
	}

	.brand-tagline {
		color: var(--color-text-secondary);
		font-size: 1rem;
		margin: var(--spacing-xs) 0 0;
		font-style: italic;
	}

	.architect-link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-primary);
		color: var(--color-background);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.8rem;
		white-space: nowrap;
		transition: background-color var(--transition-fast);
	}

	.architect-link:hover {
		background-color: var(--color-primary-hover);
	}

	/* Completion bar */
	.completion-bar {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.completion-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.completion-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.completion-value {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.progress-track {
		height: 6px;
		background-color: var(--color-border);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
		border-radius: 3px;
		transition: width var(--transition-base);
	}

	.completion-detail {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-xs);
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

	/* Sections grid */
	.sections-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
	}

	@media (min-width: 768px) {
		.sections-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.brand-section {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.section-icon {
		font-size: 1.3rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.fields-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	@media (max-width: 480px) {
		.header-content {
			flex-direction: column;
		}

		.brand-title {
			font-size: 1.4rem;
		}
	}
</style>
