<!--
  Admin CMS Dashboard

  Shows all registered content types with links to manage their content.
-->
<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: contentTypes = data.contentTypes || [];

	function getIconPath(icon: string): string {
		switch (icon) {
			case 'article':
				return 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
			case 'help-circle':
				return 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01';
			default:
				return 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6';
		}
	}
</script>

<svelte:head>
	<title>CMS - NebulaKit Admin</title>
</svelte:head>

<div class="cms-dashboard">
	<div class="cms-dashboard-header">
		<h1>Content Management</h1>
		<p class="cms-dashboard-subtitle">
			Manage your content types and entries. New types can be added in the content type registry.
		</p>
	</div>

	{#if contentTypes.length === 0}
		<div class="cms-empty-state">
			<p>No content types registered yet.</p>
			<p class="cms-help-text">
				Add content types in <code>src/lib/cms/registry.ts</code> to get started.
			</p>
		</div>
	{:else}
		<div class="cms-types-grid">
			{#each contentTypes as ct}
				<a href="/admin/cms/{ct.slug}" class="cms-type-card">
					<div class="cms-type-card-icon">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d={getIconPath(ct.icon)} />
						</svg>
					</div>
					<div class="cms-type-card-info">
						<h2>{ct.name}</h2>
						{#if ct.description}
							<p>{ct.description}</p>
						{/if}
						<span class="cms-type-card-fields">{ct.fields.length} custom fields</span>
					</div>
					<div class="cms-type-card-arrow">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cms-dashboard {
		max-width: 800px;
	}

	.cms-dashboard-header {
		margin-bottom: var(--spacing-2xl);
	}

	.cms-dashboard-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
	}

	.cms-dashboard-subtitle {
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
	}

	.cms-empty-state {
		text-align: center;
		padding: var(--spacing-2xl);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
	}

	.cms-help-text {
		font-size: 0.875rem;
		margin-top: var(--spacing-sm);
	}

	.cms-help-text code {
		background: var(--color-surface);
		padding: 0.125em 0.375em;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
	}

	.cms-types-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.cms-type-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-text);
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cms-type-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.cms-type-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: var(--color-background);
		border-radius: var(--radius-md);
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.cms-type-card-info {
		flex: 1;
	}

	.cms-type-card-info h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: var(--spacing-xs);
	}

	.cms-type-card-info p {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xs);
	}

	.cms-type-card-fields {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.cms-type-card-arrow {
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}
</style>
