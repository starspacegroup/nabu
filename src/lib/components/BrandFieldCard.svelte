<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';

	const dispatch = createEventDispatcher();

	export let fieldKey: string;
	$: void fieldKey;
	export let label: string;
	export let value: unknown;
	export let type: 'text' | 'color' | 'list' | 'object' | 'archetype' = 'text';
	export let isEditing = false;
	export let editValue = '';

	$: hasValue = value != null && value !== '' && (!Array.isArray(value) || value.length > 0);

	let inputEl: HTMLInputElement | HTMLTextAreaElement | null = null;
	let cancelledByEscape = false;

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
			cancelledByEscape = true;
			dispatch('cancel');
		}
	}

	function handleBlur() {
		if (cancelledByEscape) {
			cancelledByEscape = false;
			return;
		}
		dispatch('save');
	}

	function handleValueClick() {
		dispatch('edit');
	}

	function handleValueKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			dispatch('edit');
		}
	}

	// Auto-focus the input when editing starts
	$: if (isEditing) {
		tick().then(() => {
			inputEl?.focus();
		});
	}
</script>

<div class="field-card" class:empty={!hasValue} class:editing={isEditing}>
	<div class="field-header">
		<span class="field-label">{label}</span>
		<button
			class="action-btn history-btn"
			on:click|stopPropagation={() => dispatch('history')}
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
	</div>

	{#if isEditing}
		<div class="edit-area">
			{#if type === 'text' || type === 'archetype'}
				{#if (editValue?.length || 0) > 80}
					<textarea
						bind:this={inputEl}
						bind:value={editValue}
						on:keydown={handleKeydown}
						on:blur={handleBlur}
						class="edit-input textarea"
						rows="3"
						placeholder="{label}..."
					/>
				{:else}
					<input
						bind:this={inputEl}
						type="text"
						bind:value={editValue}
						on:keydown={handleKeydown}
						on:blur={handleBlur}
						class="edit-input"
						placeholder="{label}..."
					/>
				{/if}
			{:else if type === 'color'}
				<div class="color-edit">
					<input type="color" bind:value={editValue} class="color-picker" />
					<input
						bind:this={inputEl}
						type="text"
						bind:value={editValue}
						on:keydown={handleKeydown}
						on:blur={handleBlur}
						class="edit-input color-text"
						placeholder="#000000"
					/>
				</div>
			{:else if type === 'list'}
				<textarea
					bind:this={inputEl}
					bind:value={editValue}
					on:keydown={handleKeydown}
					on:blur={handleBlur}
					class="edit-input textarea"
					rows="3"
					placeholder="Comma-separated values..."
				/>
			{:else}
				<textarea
					bind:this={inputEl}
					bind:value={editValue}
					on:keydown={handleKeydown}
					on:blur={handleBlur}
					class="edit-input textarea"
					rows="4"
					placeholder="JSON value..."
				/>
			{/if}
			<div class="edit-hint">
				<span>Enter to save · Esc to cancel</span>
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div
			class="field-value-area"
			class:empty={!hasValue}
			role="button"
			tabindex="0"
			aria-label="Edit {label}"
			on:click={handleValueClick}
			on:keydown={handleValueKeydown}
		>
			{#if hasValue}
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
			{:else}
				<span class="placeholder-text">Add {label.toLowerCase()}...</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.field-card {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast);
	}

	.field-card:hover {
		border-color: var(--color-border);
	}

	.field-card.editing {
		border-color: var(--color-primary);
		background-color: var(--color-background);
	}

	.field-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2px;
	}

	.field-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* History button - always visible but subtle */
	.history-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		opacity: 0.3;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.field-card:hover .history-btn {
		opacity: 0.6;
	}

	.history-btn:hover {
		opacity: 1 !important;
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	/* Touch devices: always visible */
	@media (hover: none) {
		.history-btn {
			opacity: 0.5;
		}
	}

	/* Clickable value area */
	.field-value-area {
		cursor: pointer;
		padding: var(--spacing-xs) 0;
		border-radius: var(--radius-sm);
		transition: background-color var(--transition-fast);
		min-height: 32px;
		display: flex;
		align-items: center;
	}

	.field-value-area:hover {
		background-color: var(--color-surface-hover);
		margin: 0 calc(-1 * var(--spacing-xs));
		padding-left: var(--spacing-xs);
		padding-right: var(--spacing-xs);
	}

	.field-value-area:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.field-value-area.empty {
		border-bottom: 1px dashed var(--color-border);
		border-radius: 0;
	}

	.field-value-area.empty:hover {
		border-bottom-color: var(--color-primary);
		background-color: transparent;
		margin: 0;
		padding-left: 0;
		padding-right: 0;
	}

	/* Placeholder for empty fields */
	.placeholder-text {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		opacity: 0.5;
		font-style: italic;
		transition: opacity var(--transition-fast);
	}

	.field-value-area:hover .placeholder-text {
		opacity: 0.8;
		color: var(--color-primary);
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
		flex-shrink: 0;
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

	/* Edit area */
	.edit-area {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.edit-input {
		width: 100%;
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-sm);
		background-color: var(--color-background);
		color: var(--color-text);
		font-size: 0.9rem;
		font-family: inherit;
		transition: border-color var(--transition-fast);
		box-sizing: border-box;
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
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
		width: 40px;
		height: 40px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 2px;
		flex-shrink: 0;
	}

	.color-text {
		flex: 1;
	}

	.edit-hint {
		display: flex;
		justify-content: flex-end;
	}

	.edit-hint span {
		font-size: 0.65rem;
		color: var(--color-text-secondary);
		opacity: 0.6;
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.field-card {
			padding: var(--spacing-sm);
		}

		.field-value-area {
			min-height: 40px;
			padding: var(--spacing-sm) 0;
		}

		.edit-input {
			font-size: 1rem;
			padding: var(--spacing-sm);
		}

		.edit-hint {
			display: none;
		}
	}
</style>
