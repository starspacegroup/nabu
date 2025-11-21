<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/stores/theme';
	
	let currentTheme: string;
	
	themeStore.subscribe(value => {
		currentTheme = value;
	});
	
	function toggleTheme() {
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		themeStore.set(newTheme);
	}
	
	onMount(() => {
		// Apply theme on mount
		document.documentElement.setAttribute('data-theme', currentTheme);
	});
	
	$: if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', currentTheme);
	}
</script>

<button class="theme-switcher" on:click={toggleTheme} aria-label="Toggle theme">
	{#if currentTheme === 'light'}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
		</svg>
	{:else}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		</svg>
	{/if}
</button>

<style>
	.theme-switcher {
		position: fixed;
		bottom: var(--spacing-lg);
		right: var(--spacing-lg);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-md);
		z-index: 100;
	}
	
	.theme-switcher:hover {
		transform: scale(1.1);
		box-shadow: var(--shadow-lg);
	}
	
	.theme-switcher:active {
		transform: scale(0.95);
	}
	
	svg {
		color: var(--color-text);
	}
</style>
