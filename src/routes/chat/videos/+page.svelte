<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	interface VideoItem {
		id: string;
		prompt: string;
		provider: string;
		model: string;
		status: string;
		videoUrl: string | null;
		thumbnailUrl: string | null;
		r2Key: string | null;
		duration: number | null;
		aspectRatio: string | null;
		cost: number | null;
		error: string | null;
		createdAt: string;
		completedAt: string | null;
	}

	let videos: VideoItem[] = [];
	let loading = true;
	let errorMessage = '';
	let total = 0;
	let offset = 0;
	const limit = 20;
	let filter: string | null = null;

	async function loadVideos(append = false) {
		loading = true;
		errorMessage = '';
		try {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: (append ? offset : 0).toString()
			});
			if (filter) params.set('status', filter);

			const res = await fetch(`/api/video?${params}`);
			if (!res.ok) throw new Error('Failed to load videos');

			const data = await res.json();
			if (append) {
				videos = [...videos, ...data.videos];
			} else {
				videos = data.videos;
			}
			total = data.total;
			offset = videos.length;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
		} finally {
			loading = false;
		}
	}

	function setFilter(status: string | null) {
		filter = status;
		offset = 0;
		loadVideos();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		loadVideos();
	});
</script>

<svelte:head>
	<title>Video Gallery - Nabu</title>
</svelte:head>

<div class="gallery-page">
	<div class="gallery-header">
		<div class="header-content">
			<h1>Video Gallery</h1>
			<p class="subtitle">Your AI-generated videos</p>
		</div>
		<div class="filter-bar">
			<button class="filter-btn" class:active={filter === null} on:click={() => setFilter(null)}>
				All
			</button>
			<button
				class="filter-btn"
				class:active={filter === 'complete'}
				on:click={() => setFilter('complete')}
			>
				Completed
			</button>
			<button
				class="filter-btn"
				class:active={filter === 'processing'}
				on:click={() => setFilter('processing')}
			>
				Processing
			</button>
			<button
				class="filter-btn"
				class:active={filter === 'error'}
				on:click={() => setFilter('error')}
			>
				Failed
			</button>
		</div>
	</div>

	{#if loading && videos.length === 0}
		<div class="loading-state">
			<div class="loading-grid">
				{#each Array(6) as _}
					<div class="skeleton-card">
						<div class="skeleton-video"></div>
						<div class="skeleton-text"></div>
						<div class="skeleton-text short"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if errorMessage}
		<div class="error-state">
			<p>{errorMessage}</p>
			<button class="retry-btn" on:click={() => loadVideos()}>Retry</button>
		</div>
	{:else if videos.length === 0}
		<div class="empty-state">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<rect x="2" y="4" width="20" height="16" rx="2" />
				<polygon points="10,9 16,12 10,15" />
			</svg>
			<h2>No videos yet</h2>
			<p>Generate your first video from the <a href="/chat">AI Chat</a></p>
		</div>
	{:else}
		<div class="video-grid">
			{#each videos as video (video.id)}
				<div class="video-card" in:fade={{ duration: 200 }}>
					{#if video.status === 'complete' && video.videoUrl}
						<div class="video-wrapper">
							<!-- svelte-ignore a11y-media-has-caption -->
							<video
								class="video-thumb"
								controls
								preload="metadata"
								poster={video.thumbnailUrl || undefined}
								playsinline
							>
								<source src={video.videoUrl} type="video/mp4" />
							</video>
							{#if video.duration}
								<span class="duration-badge">{formatDuration(video.duration)}</span>
							{/if}
						</div>
					{:else if video.status === 'processing' || video.status === 'queued'}
						<div class="video-wrapper processing">
							<div class="processing-indicator">
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<polygon points="10,9 16,12 10,15" />
								</svg>
								<span>Processing...</span>
							</div>
						</div>
					{:else}
						<div class="video-wrapper error-state-card">
							<span class="error-label">Failed</span>
						</div>
					{/if}
					<div class="video-info">
						<p class="video-prompt">{video.prompt}</p>
						<div class="video-meta">
							<span class="meta-item">{video.model}</span>
							{#if video.aspectRatio}
								<span class="meta-item">{video.aspectRatio}</span>
							{/if}
							<span class="meta-item">{formatDate(video.createdAt)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if videos.length < total}
			<div class="load-more">
				<button class="load-more-btn" disabled={loading} on:click={() => loadVideos(true)}>
					{loading ? 'Loading...' : 'Load More'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.gallery-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-md) var(--spacing-sm);
	}

	.gallery-header {
		margin-bottom: var(--spacing-xl);
	}

	.header-content {
		margin-bottom: var(--spacing-md);
	}

	.gallery-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		margin: var(--spacing-xs) 0 0;
	}

	.filter-bar {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-full, 50px);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.813rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.filter-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-text);
	}

	.filter-btn.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.video-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
	}

	.video-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-base);
	}

	.video-card:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.video-wrapper {
		position: relative;
		aspect-ratio: 16/9;
		background: var(--color-background);
	}

	.video-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.duration-badge {
		position: absolute;
		bottom: var(--spacing-xs);
		right: var(--spacing-xs);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.75rem;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-variant-numeric: tabular-nums;
	}

	.video-wrapper.processing,
	.video-wrapper.error-state-card {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.processing-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.processing-indicator svg {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.error-label {
		color: var(--color-error, #ef4444);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.video-info {
		padding: var(--spacing-md);
	}

	.video-prompt {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0 0 var(--spacing-xs);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.video-meta {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.meta-item + .meta-item::before {
		content: '·';
		margin-right: var(--spacing-sm);
	}

	/* Loading skeletons */
	.loading-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
	}

	.skeleton-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.skeleton-video {
		aspect-ratio: 16/9;
		background: var(--color-border);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-text {
		height: 14px;
		margin: var(--spacing-md);
		background: var(--color-border);
		border-radius: var(--radius-sm);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.skeleton-text.short {
		width: 60%;
		margin-top: var(--spacing-xs);
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	/* Empty / Error states */
	.empty-state,
	.error-state {
		text-align: center;
		padding: var(--spacing-3xl, 80px) var(--spacing-lg);
		color: var(--color-text-secondary);
	}

	.empty-state h2 {
		margin: var(--spacing-md) 0 var(--spacing-xs);
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.empty-state a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.empty-state a:hover {
		text-decoration: underline;
	}

	.retry-btn,
	.load-more-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.retry-btn:hover,
	.load-more-btn:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}

	.load-more {
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	@media (min-width: 769px) {
		.gallery-page {
			padding: var(--spacing-lg) var(--spacing-xl);
		}

		.video-grid,
		.loading-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		}

		.gallery-header h1 {
			font-size: 1.5rem;
		}
	}
</style>
