<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { MediaAttachment } from '$lib/stores/chatHistory';

	export let media: MediaAttachment;
	export let prompt: string = '';

	const dispatch = createEventDispatcher<{
		retry: { prompt: string };
	}>();

	$: isGenerating = media.status === 'generating';
	$: isComplete = media.status === 'complete';
	$: isError = media.status === 'error';
	$: progressPercent = media.progress ?? 0;
	$: videoUrl = media.url ?? '';
	$: thumbnailUrl = media.thumbnailUrl ?? '';
	$: duration = media.duration ?? 0;

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleRetry() {
		dispatch('retry', { prompt });
	}
</script>

<div class="video-card" class:generating={isGenerating} class:error={isError}>
	{#if isGenerating}
		<div class="video-placeholder" in:fade={{ duration: 200 }}>
			<div class="generating-animation">
				<div class="pulse-ring"></div>
				<div class="pulse-ring delay-1"></div>
				<div class="pulse-ring delay-2"></div>
				<svg
					class="video-icon"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="2" y="4" width="20" height="16" rx="2" />
					<polygon points="10,9 16,12 10,15" />
				</svg>
			</div>
			<div class="generating-info">
				<span class="generating-label">Generating video...</span>
				{#if progressPercent > 0}
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progressPercent}%"></div>
					</div>
					<span class="progress-text">{Math.round(progressPercent)}%</span>
				{:else}
					<div class="progress-bar indeterminate">
						<div class="progress-fill shimmer"></div>
					</div>
				{/if}
			</div>
		</div>
	{:else if isComplete && videoUrl}
		<div class="video-container" in:fade={{ duration: 300 }}>
			<!-- svelte-ignore a11y-media-has-caption -->
			<video
				class="video-player"
				controls
				preload="metadata"
				poster={thumbnailUrl || undefined}
				playsinline
			>
				<source src={videoUrl} type="video/mp4" />
				Your browser does not support video playback.
			</video>
			{#if duration > 0}
				<div class="video-meta">
					<span class="duration-badge">{formatDuration(duration)}</span>
				</div>
			{/if}
		</div>
	{:else if isError}
		<div class="error-container" in:fade={{ duration: 200 }}>
			<div class="error-icon">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<span class="error-message">{media.error || 'Video generation failed'}</span>
			<button class="retry-button" on:click={handleRetry}>
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
					<polyline points="23,4 23,10 17,10" />
					<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
				</svg>
				Retry
			</button>
		</div>
	{/if}
</div>

<style>
	.video-card {
		width: 100%;
		max-width: 420px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.video-card.error {
		border-color: var(--color-error, #ef4444);
	}

	/* Generating state */
	.video-placeholder {
		padding: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		min-height: 200px;
		justify-content: center;
	}

	.generating-animation {
		position: relative;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pulse-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2px solid var(--color-primary);
		opacity: 0;
		animation: pulse-ring 2s ease-out infinite;
	}

	.pulse-ring.delay-1 {
		animation-delay: 0.6s;
	}

	.pulse-ring.delay-2 {
		animation-delay: 1.2s;
	}

	@keyframes pulse-ring {
		0% {
			transform: scale(0.5);
			opacity: 0.8;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	.video-icon {
		color: var(--color-primary);
		z-index: 1;
		animation: icon-pulse 2s ease-in-out infinite;
	}

	@keyframes icon-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.1);
			opacity: 1;
		}
	}

	.generating-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		width: 100%;
		max-width: 200px;
	}

	.generating-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.progress-bar.indeterminate .progress-fill {
		width: 40%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(350%);
		}
	}

	.progress-text {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-variant-numeric: tabular-nums;
	}

	/* Complete state */
	.video-container {
		position: relative;
	}

	.video-player {
		width: 100%;
		display: block;
		border-radius: var(--radius-lg);
		background: var(--color-background);
	}

	.video-meta {
		position: absolute;
		bottom: var(--spacing-sm);
		right: var(--spacing-sm);
		display: flex;
		gap: var(--spacing-xs);
	}

	.duration-badge {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.75rem;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-variant-numeric: tabular-nums;
	}

	/* Error state */
	.error-container {
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		min-height: 120px;
		justify-content: center;
	}

	.error-icon {
		color: var(--color-error, #ef4444);
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-align: center;
		line-height: 1.4;
	}

	.retry-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.813rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.retry-button:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.video-card {
			max-width: 100%;
		}

		.video-placeholder {
			min-height: 160px;
			padding: var(--spacing-lg);
		}
	}
</style>
