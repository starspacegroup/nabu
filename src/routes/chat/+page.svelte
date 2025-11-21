<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}
	
	let messages: Message[] = [
		{
			id: '1',
			role: 'assistant',
			content: 'Hello! I\'m your AI assistant. How can I help you today?',
			timestamp: new Date()
		}
	];
	
	let input = '';
	let isLoading = false;
	let chatContainer: HTMLDivElement;
	
	onMount(() => {
		scrollToBottom();
	});
	
	function scrollToBottom() {
		if (chatContainer) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
	}
	
	async function sendMessage() {
		if (!input.trim() || isLoading) return;
		
		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: input.trim(),
			timestamp: new Date()
		};
		
		messages = [...messages, userMessage];
		input = '';
		isLoading = true;
		scrollToBottom();
		
		// Simulate AI response
		setTimeout(() => {
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: 'This is a demo response. In a real implementation, this would connect to your LLM API endpoint.',
				timestamp: new Date()
			};
			messages = [...messages, assistantMessage];
			isLoading = false;
			scrollToBottom();
		}, 1000);
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>Chat - NebulaKit</title>
</svelte:head>

<div class="chat-page">
	<div class="chat-header">
		<h2>AI Chat</h2>
		<p class="subtitle">Ask me anything</p>
	</div>
	
	<div class="chat-container" bind:this={chatContainer}>
		{#each messages as message (message.id)}
			<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
				<div class="message-avatar">
					{#if message.role === 'user'}
						<span>👤</span>
					{:else}
						<span>🤖</span>
					{/if}
				</div>
				<div class="message-content">
					<div class="message-text">{message.content}</div>
					<div class="message-time">
						{message.timestamp.toLocaleTimeString()}
					</div>
				</div>
			</div>
		{/each}
		
		{#if isLoading}
			<div class="message assistant">
				<div class="message-avatar">
					<span>🤖</span>
				</div>
				<div class="message-content">
					<div class="typing-indicator">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			</div>
		{/if}
	</div>
	
	<div class="chat-input-container">
		<textarea
			bind:value={input}
			on:keydown={handleKeydown}
			placeholder="Type your message... (Shift + Enter for new line)"
			class="chat-input"
			rows="1"
		></textarea>
		<button
			on:click={sendMessage}
			disabled={!input.trim() || isLoading}
			class="send-button"
			aria-label="Send message"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="22" y1="2" x2="11" y2="13"></line>
				<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
			</svg>
		</button>
	</div>
</div>

<style>
	.chat-page {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 64px);
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.chat-header {
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	
	.chat-header h2 {
		margin-bottom: var(--spacing-xs);
	}
	
	.subtitle {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}
	
	.chat-container {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}
	
	.message {
		display: flex;
		gap: var(--spacing-md);
		max-width: 80%;
	}
	
	.message.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}
	
	.message.assistant {
		align-self: flex-start;
	}
	
	.message-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	
	.message-content {
		flex: 1;
		min-width: 0;
	}
	
	.message-text {
		background: var(--color-surface);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		word-wrap: break-word;
		white-space: pre-wrap;
	}
	
	.message.user .message-text {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	
	.message-time {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-xs);
		padding: 0 var(--spacing-sm);
	}
	
	.typing-indicator {
		display: flex;
		gap: 0.25rem;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}
	
	.typing-indicator span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-text-secondary);
		animation: typing 1.4s infinite;
	}
	
	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}
	
	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}
	
	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.7;
		}
		30% {
			transform: translateY(-10px);
			opacity: 1;
		}
	}
	
	.chat-input-container {
		padding: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
		display: flex;
		gap: var(--spacing-md);
		align-items: flex-end;
	}
	
	.chat-input {
		flex: 1;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		font-family: inherit;
		font-size: 1rem;
		color: var(--color-text);
		resize: none;
		min-height: 44px;
		max-height: 200px;
	}
	
	.chat-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.send-button {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-lg);
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}
	
	.send-button:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: scale(1.05);
	}
	
	.send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	@media (max-width: 640px) {
		.message {
			max-width: 90%;
		}
	}
</style>
