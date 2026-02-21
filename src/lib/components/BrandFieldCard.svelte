<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let fieldKey: string;

	// fieldKey is used in dispatch events and parent component binding
	$: void fieldKey;
	export let label: string;
	export let value: unknown;
	export let type: 'text' | 'color' | 'list' | 'object' | 'archetype' = 'text';
	export let isEditing = false;
	export let editValue = '';

	$: hasValue = value != null && value !== '' && (!Array.isArray(value) || value.length > 0);

	function formatValue(v: unknown): string {
		if (v == null) return '';
		if (typeof v === 'string') return v;
		if (Array.isArray(v)) return v.join(', ');
		return JSON.stringify(v, null, 2);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			dispatch('save');
		}
		if (e.key === 'Escape') {
			dispatch('cancel');
		}
	}
</script>

<div class="field-card" class:empty={!hasValue} class:editing={isEditing}>
	<div class="field-header">
		<span class="field-label">{label}</span>
		<div class="field-actions">
			<button
				class="action-btn history-btn"
				on:click={() => dispatch('history')}
				aria-label="View history for {label}"
				title="Version history"
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
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
			</button>
			{#if !isEditing}
				<button
					class="action-btn edit-btn"
					on:click={() => dispatch('edit')}
					aria-label="Edit {label}"
					title="Edit"
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
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	{#if isEditing}
		<div class="edit-area">
			{#if type === 'text' || type === 'archetype'}
				{#if (editValue?.length || 0) > 80}
					<textarea
						bind:value={editValue}
						on:keydown={handleKeydown}
						class="edit-input textarea"
						rows="3"
						placeholder="Enter {label.toLowerCase()}..."
					/>
				{:else}
					<input
						type="text"
						bind:value={editValue}
						on:keydown={handleKeydown}
						class="edit-input"
						placeholder="Enter {label.toLowerCase()}..."
					/>
				{/if}
			{:else if type === 'color'}
				<div class="color-edit">
					<input type="color" bind:value={editValue} class="color-picker" />
					<input
						type="text"
						bind:value={editValue}
						on:keydown={handleKeydown}
						class="edit-input color-text"
						placeholder="#000000"
					/>
				</div>
			{:else if type === 'list'}
				<textarea
					bind:value={editValue}
					on:keydown={handleKeydown}
					class="edit-input textarea"
					rows="3"
					placeholder="Comma-separated values..."
				/>
			{:else}
				<textarea
					bind:value={editValue}
					on:keydown={handleKeydown}
					class="edit-input textarea"
					rows="4"
					placeholder="JSON value..."
				/>
			{/if}
			<div class="edit-actions">
				<button class="save-btn" on:click={() => dispatch('save')}>Save</button>
				<button class="cancel-btn" on:click={() => dispatch('cancel')}>Cancel</button>
			</div>
		</div>
	{:else if hasValue}
		<div class="field-value">
			{#if type === 'color' && typeof value === 'string'}
				<div class="color-display">
					<span class="color-swatch" style="background-color: {value}"></span>
					<span class="color-code">{value}</span>
				</div>
			{:else if type === 'list' && Array.isArray(value)}
				<div class="tag-list">
					{#each value as item}
						<span class="tag">{item}</span>
					{/each}
				</div>
			{:else if type === 'object' && typeof value === 'object'}
				<pre class="object-display">{JSON.stringify(value, null, 2)}</pre>
			{:else if type === 'archetype' && typeof value === 'string'}
				<span class="archetype-badge">{value}</span>
			{:else}
				<p class="text-value">{formatValue(value)}</p>
			{/if}
		</div>
	{:else}
		<div class="empty-value">
			<span class="empty-text">Not set</span>
			<button class="set-btn" on:click={() => dispatch('edit')}>Set value</button>
		</div>
	{/if}
</div>

<style>
	.field-card {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: border-color var(--transition-fast);
	}

	.field-card:hover {
		border-color: var(--color-border);
	}

	.field-card.editing {
		border-color: var(--color-primary);
		background-color: var(--color-background);
	}

	.field-card.empty .field-label {
		color: var(--color-text-secondary);
	}

	.field-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-xs);
	}

	.field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field-actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.field-card:hover .field-actions,
	.field-card.editing .field-actions {
		opacity: 1;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	/* Value displays */
	.text-value {
		font-size: 0.9rem;
		color: var(--color-text);
		margin: 0;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.color-display {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.color-swatch {
		display: inline-block;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.color-code {
		font-size: 0.85rem;
		font-family: var(--font-mono);
		color: var(--color-text);
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tag {
		display: inline-block;
		padding: 2px var(--spacing-sm);
		background-color: var(--color-surface-hover);
		color: var(--color-text);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
	}

	.object-display {
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--color-text);
		background-color: var(--color-surface-hover);
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.archetype-badge {
		display: inline-block;
		padding: 2px var(--spacing-md);
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		color: var(--color-background);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	/* Empty state */
	.empty-value {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.empty-text {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.set-btn {
		font-size: 0.75rem;
		padding: 2px var(--spacing-sm);
		border: 1px dashed var(--color-border);
		background: none;
		color: var(--color-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.set-btn:hover {
		border-color: var(--color-primary);
		background-color: var(--color-surface);
	}

	/* Edit area */
	.edit-area {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.edit-input {
		width: 100%;
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-background);
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: inherit;
		transition: border-color var(--transition-fast);
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.edit-input.textarea {
		resize: vertical;
		min-height: 60px;
	}

	.color-edit {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.color-picker {
		width: 36px;
		height: 36px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 2px;
	}

	.color-text {
		flex: 1;
	}

	.edit-actions {
		display: flex;
		gap: var(--spacing-xs);
		justify-content: flex-end;
	}

	.save-btn,
	.cancel-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all var(--transition-fast);
	}

	.save-btn {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.save-btn:hover {
		background-color: var(--color-primary-hover);
	}

	.cancel-btn {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	.cancel-btn:hover {
		background-color: var(--color-border);
	}
</style>
