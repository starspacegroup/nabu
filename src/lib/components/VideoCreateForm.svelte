<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface VideoModel {
		id: string;
		displayName: string;
		provider: string;
	}

	export let models: VideoModel[] = [];

	let prompt = '';
	let aspectRatio = '16:9';
	let duration = 8;
	let selectedModel = '';
	let generating = false;

	const aspectRatios = ['16:9', '9:16', '1:1'];
	const durations = [4, 8, 12];

	const dispatch = createEventDispatcher<{
		generate: { prompt: string; aspectRatio: string; duration: number; model: string; provider: string };
	}>();

	$: hasModels = models.length > 0;
	$: if (hasModels && !selectedModel) {
		selectedModel = models[0].id;
	}
	$: canGenerate = prompt.trim().length > 0 && hasModels && !generating;

	function handleGenerate() {
		if (!canGenerate) return;
		const model = models.find((m) => m.id === selectedModel);
		if (!model) return;

		generating = true;
		dispatch('generate', {
			prompt: prompt.trim(),
			aspectRatio,
			duration,
			model: selectedModel,
			provider: model.provider
		});
	}

	export function resetForm() {
		prompt = '';
		generating = false;
	}
</script>

<div class="create-form" role="region" aria-label="Create video">
	{#if !hasModels}
		<div class="no-provider">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p>No video provider configured.</p>
			<p class="no-provider-hint">Go to <a href="/admin/ai-keys">Admin &rarr; AI Keys</a>, edit your OpenAI key, and enable the <strong>Video Generation</strong> toggle with a Sora model selected.</p>
		</div>
	{:else}
		<div class="form-body">
			<div class="prompt-section">
				<textarea
					bind:value={prompt}
					placeholder="Describe your video..."
					rows="3"
					maxlength="4000"
					class="prompt-input"
				></textarea>
				<span class="char-count">{prompt.length}/4000</span>
			</div>

			<div class="form-options">
				<div class="option-group">
					<label class="option-label">Aspect Ratio</label>
					<div class="ratio-selector" role="radiogroup" aria-label="Aspect ratio">
						{#each aspectRatios as ratio}
							<button
								type="button"
								class="ratio-btn"
								class:active={aspectRatio === ratio}
								on:click={() => (aspectRatio = ratio)}
								role="radio"
								aria-checked={aspectRatio === ratio}
							>
								{ratio}
							</button>
						{/each}
					</div>
				</div>

				<div class="option-group">
					<label class="option-label">Duration</label>
					<div class="ratio-selector" role="radiogroup" aria-label="Video duration">
						{#each durations as d}
							<button
								type="button"
								class="ratio-btn"
								class:active={duration === d}
								on:click={() => (duration = d)}
								role="radio"
								aria-checked={duration === d}
							>
								{d}s
							</button>
						{/each}
					</div>
				</div>

				{#if models.length > 1}
					<div class="option-group">
						<label class="option-label" for="model-select">Model</label>
						<select id="model-select" bind:value={selectedModel} class="model-select">
							{#each models as model}
								<option value={model.id}>{model.displayName}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<button
				type="button"
				class="generate-btn"
				disabled={!canGenerate}
				on:click={handleGenerate}
			>
				{#if generating}
					<span class="spinner"></span>
					Generating...
				{:else}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="5,3 19,12 5,21" />
					</svg>
					Generate Video
				{/if}
			</button>
		</div>
	{/if}
</div>

<style>
	.create-form {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.no-provider {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--color-text-secondary);
		padding: var(--spacing-lg);
		text-align: center;
	}

	.no-provider svg {
		flex-shrink: 0;
		color: var(--color-warning);
	}

	.no-provider-hint {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.no-provider-hint a {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.form-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.prompt-section {
		position: relative;
	}

	.prompt-input {
		width: 100%;
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-background);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		resize: vertical;
		transition: border-color var(--transition-fast);
	}

	.prompt-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.prompt-input::placeholder {
		color: var(--color-text-secondary);
	}

	.char-count {
		position: absolute;
		bottom: var(--spacing-sm);
		right: var(--spacing-sm);
		font-size: 0.7rem;
		color: var(--color-text-secondary);
	}

	.form-options {
		display: flex;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.option-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ratio-selector {
		display: flex;
		gap: var(--spacing-xs);
	}

	.ratio-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-background);
		color: var(--color-text);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.ratio-btn.active {
		background-color: var(--color-primary);
		color: var(--color-background);
		border-color: var(--color-primary);
	}

	.ratio-btn:hover:not(.active) {
		background-color: var(--color-surface-hover);
	}

	.model-select {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-background);
		color: var(--color-text);
		font-size: 0.8rem;
	}

	.generate-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		background-color: var(--color-primary);
		color: var(--color-background);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color var(--transition-fast);
		align-self: flex-start;
	}

	.generate-btn:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
	}

	.generate-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-background);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
