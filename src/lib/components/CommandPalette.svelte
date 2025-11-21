<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	export let show = false;
	
	let searchInput: HTMLInputElement;
	let query = '';
	let selectedIndex = 0;
	
	interface Command {
		id: string;
		label: string;
		description: string;
		action: () => void;
		icon: string;
	}
	
	const commands: Command[] = [
		{
			id: 'home',
			label: 'Home',
			description: 'Go to home page',
			action: () => goto('/'),
			icon: '🏠'
		},
		{
			id: 'chat',
			label: 'Chat',
			description: 'Open LLM chat interface',
			action: () => goto('/chat'),
			icon: '💬'
		},
		{
			id: 'demo',
			label: 'Demo',
			description: 'View drag and drop demo',
			action: () => goto('/demo'),
			icon: '🎯'
		},
		{
			id: 'login',
			label: 'Sign In',
			description: 'Go to login page',
			action: () => goto('/auth/login'),
			icon: '🔐'
		},
		{
			id: 'signup',
			label: 'Sign Up',
			description: 'Create a new account',
			action: () => goto('/auth/signup'),
			icon: '✨'
		}
	];
	
	$: filteredCommands = commands.filter(cmd => 
		cmd.label.toLowerCase().includes(query.toLowerCase()) ||
		cmd.description.toLowerCase().includes(query.toLowerCase())
	);
	
	$: if (show && searchInput) {
		searchInput.focus();
		query = '';
		selectedIndex = 0;
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (!show) return;
		
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			executeCommand(filteredCommands[selectedIndex]);
		}
	}
	
	function executeCommand(command: Command) {
		if (command) {
			command.action();
			show = false;
		}
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			show = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
	<div class="backdrop" on:click={handleBackdropClick} role="presentation" on:keydown={(e) => e.key === 'Escape' && (show = false)}>
		<div class="palette">
			<div class="search-box">
				<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
				<input
					bind:this={searchInput}
					bind:value={query}
					type="text"
					placeholder="Search commands..."
					class="search-input"
				/>
			</div>
			
			<div class="commands">
				{#each filteredCommands as command, i}
					<button
						class="command"
						class:selected={i === selectedIndex}
						on:click={() => executeCommand(command)}
						on:mouseenter={() => selectedIndex = i}
					>
						<span class="command-icon">{command.icon}</span>
						<div class="command-info">
							<div class="command-label">{command.label}</div>
							<div class="command-description">{command.description}</div>
						</div>
					</button>
				{:else}
					<div class="no-results">No commands found</div>
				{/each}
			</div>
			
			<div class="footer">
				<div class="hint">
					<kbd>↑↓</kbd> to navigate
					<kbd>↵</kbd> to select
					<kbd>esc</kbd> to close
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 20vh;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.palette {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 90%;
		max-width: 640px;
		max-height: 60vh;
		display: flex;
		flex-direction: column;
		animation: slideDown 0.2s ease;
	}
	
	@keyframes slideDown {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.search-box {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
	}
	
	.search-icon {
		color: var(--color-text-secondary);
		flex-shrink: 0;
	}
	
	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1rem;
		color: var(--color-text);
	}
	
	.search-input::placeholder {
		color: var(--color-text-secondary);
	}
	
	.commands {
		overflow-y: auto;
		max-height: 400px;
	}
	
	.command {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast);
		text-align: left;
	}
	
	.command:hover,
	.command.selected {
		background: var(--color-surface-hover);
	}
	
	.command-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}
	
	.command-info {
		flex: 1;
		min-width: 0;
	}
	
	.command-label {
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: 0.125rem;
	}
	
	.command-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.no-results {
		padding: var(--spacing-xl);
		text-align: center;
		color: var(--color-text-secondary);
	}
	
	.footer {
		padding: var(--spacing-sm) var(--spacing-md);
		border-top: 1px solid var(--color-border);
	}
	
	.hint {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}
	
	kbd {
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.125rem 0.375rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
	}
</style>
