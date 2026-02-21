<script lang="ts">
	/**
	 * OnboardingChat - The main AI-driven brand building conversation interface.
	 * Acts as a world-class marketing expert guiding users through brand creation.
	 */
	import { onMount, afterUpdate, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import OnboardingProgress from './OnboardingProgress.svelte';
	import {
		onboardingStore,
		sendMessage,
		updateStep,
		updateBrandData,
		startOnboarding,
		loadExistingProfile,
		resetOnboarding
	} from '$lib/stores/onboarding';
	import type { OnboardingStep } from '$lib/types/onboarding';
	import { ONBOARDING_STEPS, getNextStep, STEP_COMPLETE_MARKER } from '$lib/services/onboarding';

	export let userId: string;
	void userId; // Prop reserved for future use; auth handled via server session

	let input = '';
	let chatContainer: HTMLDivElement;
	let textareaElement: HTMLTextAreaElement;
	let initialized = false;
	let showWelcomeScreen = true;
	let stepTransition: { from: string; to: string } | null = null;
	let previousStep: OnboardingStep | null = null;

	// Watch for step changes to show transition notification
	$: {
		const current = $onboardingStore.currentStep;
		if (previousStep && previousStep !== current && initialized) {
			const fromConfig = ONBOARDING_STEPS.find(s => s.id === previousStep);
			const toConfig = ONBOARDING_STEPS.find(s => s.id === current);
			stepTransition = {
				from: fromConfig?.title || '',
				to: toConfig?.title || ''
			};
			setTimeout(() => { stepTransition = null; }, 4000);
		}
		previousStep = current;
	}

	const MAX_INPUT_LENGTH = 4000;
	$: inputLength = input.length;
	$: canSend = input.trim().length > 0 && !$onboardingStore.isStreaming && !$onboardingStore.isLoading;
	$: showCharCount = inputLength > MAX_INPUT_LENGTH * 0.8;

	onMount(async () => {
		// Check if user already has a profile
		const existingProfile = await loadExistingProfile();
		if (existingProfile) {
			showWelcomeScreen = false;
			initialized = true;
			await tick();
			scrollToBottom();
		}
	});

	afterUpdate(() => {
		if ($onboardingStore.isStreaming) {
			scrollToBottom();
		}
	});

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function handleStartOnboarding() {
		showWelcomeScreen = false;
		initialized = true;
		await startOnboarding();
		await tick();
		scrollToBottom();
		textareaElement?.focus();
	}

	async function handleSend() {
		if (!canSend) return;
		const message = input.trim();
		input = '';
		autoResizeTextarea();
		await sendMessage(message);
		await tick();
		scrollToBottom();
		textareaElement?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function autoResizeTextarea() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = Math.min(textareaElement.scrollHeight, 200) + 'px';
		}
	}

	async function handleNextStep() {
		const next = getNextStep($onboardingStore.currentStep);
		if (next) {
			await updateStep(next);
			await tick();
			scrollToBottom();
		}
	}

	async function handleRestartOnboarding() {
		resetOnboarding();
		showWelcomeScreen = true;
	}

	/**
	 * Render markdown-like formatting in messages
	 */
	function formatMessage(content: string): string {
		return content
			// Strip step completion marker if it leaked into display
			.replace(STEP_COMPLETE_MARKER, '')
			// Bold
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			// Italic
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			// Headers
			.replace(/^### (.*$)/gm, '<h4>$1</h4>')
			.replace(/^## (.*$)/gm, '<h3>$1</h3>')
			// Lists
			.replace(/^- (.*$)/gm, '<li>$1</li>')
			.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
			// Line breaks
			.replace(/\n\n/g, '</p><p>')
			.replace(/\n/g, '<br>');
	}

	$: currentStepConfig = ONBOARDING_STEPS.find(s => s.id === $onboardingStore.currentStep);
</script>

<div class="onboarding-container">
	{#if showWelcomeScreen}
		<!-- Welcome/Landing Screen -->
		<div class="welcome-screen" in:fade={{ duration: 300 }}>
			<div class="welcome-content">
				<div class="welcome-icon">✨</div>
				<h1>Brand Architect</h1>
				<p class="welcome-subtitle">
					Your AI-powered brand strategist, combining psychology, philosophy,
					and world-class marketing expertise to build your perfect brand.
				</p>

				<div class="welcome-features">
					<div class="feature">
						<span class="feature-icon">🧠</span>
						<div>
							<strong>Psychology-Driven</strong>
							<p>Using Jungian archetypes, behavioral economics, and cognitive psychology</p>
						</div>
					</div>
					<div class="feature">
						<span class="feature-icon">🎯</span>
						<div>
							<strong>Market Expert</strong>
							<p>Strategic positioning, audience targeting, and competitive analysis</p>
						</div>
					</div>
					<div class="feature">
						<span class="feature-icon">🎨</span>
						<div>
							<strong>Visual Identity</strong>
							<p>Color psychology, typography, and complete brand style guides</p>
						</div>
					</div>
					<div class="feature">
						<span class="feature-icon">📖</span>
						<div>
							<strong>Brand Storytelling</strong>
							<p>Hero's journey, narrative psychology, and authentic brand stories</p>
						</div>
					</div>
				</div>

				<div class="welcome-cta">
					<p class="cta-note">
						Whether you have an existing brand to refine or are starting from scratch —
						even if you have no idea yet — we'll build something extraordinary together.
					</p>
					<button class="start-button" on:click={handleStartOnboarding}>
						Begin Your Brand Journey
						<span class="arrow">→</span>
					</button>
				</div>
			</div>
		</div>

	{:else}
		<!-- Onboarding Chat Interface -->
		<div class="chat-layout" in:fade={{ duration: 200 }}>
			<OnboardingProgress currentStep={$onboardingStore.currentStep} />

			<div class="chat-area" bind:this={chatContainer}>
				{#if $onboardingStore.isLoading && $onboardingStore.messages.length === 0}
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<p>Preparing your brand architect...</p>
					</div>
				{/if}

				{#each $onboardingStore.messages as message, i (message.id)}
					<div
						class="message {message.role}"
						in:fly={{ y: 20, duration: 300, easing: quintOut }}
					>
						<div class="message-avatar">
							{#if message.role === 'assistant'}
								<span class="avatar-icon">✨</span>
							{:else}
								<span class="avatar-icon">👤</span>
							{/if}
						</div>
						<div class="message-content">
							{#if message.role === 'assistant'}
								<div class="message-header">
									<span class="message-sender">Brand Architect</span>
									{#if message.step}
										<span class="message-step">{message.step.replace(/_/g, ' ')}</span>
									{/if}
								</div>
							{/if}
							<div class="message-text">
								{@html formatMessage(message.content)}
								{#if $onboardingStore.isStreaming && i === $onboardingStore.messages.length - 1 && message.role === 'assistant'}
									<span class="cursor-blink">▊</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}

				{#if stepTransition}
					<div class="step-transition" in:fly={{ y: 20, duration: 400 }} out:fade={{ duration: 300 }}>
						<span class="transition-icon">✅</span>
						<span class="transition-text">
							<strong>{stepTransition.from}</strong> complete — moving to <strong>{stepTransition.to}</strong>
						</span>
					</div>
				{/if}

				{#if $onboardingStore.error}
					<div class="error-message" in:fade>
						<span>⚠️</span>
						<p>{$onboardingStore.error}</p>
						<button on:click={() => onboardingStore.update(s => ({ ...s, error: null }))}>
							Dismiss
						</button>
					</div>
				{/if}
			</div>

			<!-- Bottom bar: stuck to bottom -->
			<div class="bottom-bar">
				<!-- Step info + manual skip -->
				{#if !$onboardingStore.isStreaming && $onboardingStore.messages.length > 0 && $onboardingStore.currentStep !== 'complete'}
					<div class="step-navigation">
						{#if currentStepConfig}
							<span class="step-hint">
								{currentStepConfig.title} — {currentStepConfig.description}
							</span>
						{/if}
						<button
							class="skip-step-btn"
							on:click={handleNextStep}
							title="Skip to next step"
						>
							Skip →
						</button>
					</div>
				{/if}

				{#if $onboardingStore.currentStep === 'complete'}
					<div class="completion-banner" in:fly={{ y: 20 }}>
						<h3>🎉 Brand Foundation Complete!</h3>
						<p>Your brand style guide is ready. You can continue chatting to refine any details.</p>
						<div class="completion-actions">
							<button class="secondary-btn" on:click={handleRestartOnboarding}>
								Start New Brand
							</button>
						</div>
					</div>
				{/if}

				<!-- Input area -->
				<div class="input-area">
				<div class="input-wrapper" class:focused={true}>
					<textarea
						bind:this={textareaElement}
						bind:value={input}
						on:keydown={handleKeydown}
						on:input={autoResizeTextarea}
						placeholder={$onboardingStore.isStreaming ? 'AI is responding...' : 'Type your message...'}
						disabled={$onboardingStore.isStreaming || $onboardingStore.isLoading}
						maxlength={MAX_INPUT_LENGTH}
						rows="1"
						aria-label="Chat message input"
					></textarea>
					<button
						class="send-button"
						on:click={handleSend}
						disabled={!canSend}
						aria-label="Send message"
						title="Send message"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="22" y1="2" x2="11" y2="13"></line>
							<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
						</svg>
					</button>
				</div>
					{#if showCharCount}
						<div class="char-count" class:warning={inputLength > MAX_INPUT_LENGTH * 0.95}>
							{inputLength}/{MAX_INPUT_LENGTH}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.onboarding-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		background-color: var(--color-background);
	}

	/* Welcome Screen */
	.welcome-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--spacing-xl);
	}

	.welcome-content {
		max-width: 640px;
		text-align: center;
	}

	.welcome-icon {
		font-size: 3rem;
		margin-bottom: var(--spacing-md);
	}

	.welcome-content h1 {
		font-size: 2.2rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
		letter-spacing: -0.02em;
	}

	.welcome-subtitle {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: var(--spacing-xl);
	}

	.welcome-features {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
		text-align: left;
		margin-bottom: var(--spacing-xl);
	}

	.feature {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background-color: var(--color-surface);
	}

	.feature-icon {
		font-size: 1.4rem;
		flex-shrink: 0;
	}

	.feature strong {
		display: block;
		font-size: 0.85rem;
		color: var(--color-text);
		margin-bottom: 2px;
	}

	.feature p {
		font-size: 0.72rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
		margin: 0;
	}

	.welcome-cta {
		margin-top: var(--spacing-lg);
	}

	.cta-note {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
		font-style: italic;
	}

	.start-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-xl);
		background-color: var(--color-primary);
		color: var(--color-background);
		border: none;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.start-button:hover {
		background-color: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.start-button .arrow {
		transition: transform var(--transition-fast);
	}

	.start-button:hover .arrow {
		transform: translateX(4px);
	}

	/* Chat Layout */
	.chat-layout {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		height: 100%;
	}

	.chat-area {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	/* Loading state */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		padding: var(--spacing-2xl);
		color: var(--color-text-secondary);
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Messages */
	.message {
		display: flex;
		gap: var(--spacing-sm);
		max-width: 85%;
		animation: messageIn 0.3s ease;
	}

	@keyframes messageIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.message-avatar {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.message.assistant .message-avatar {
		background-color: var(--color-primary);
	}

	.message-content {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		line-height: 1.6;
		font-size: 0.85rem;
	}

	.message.assistant .message-content {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.message.user .message-content {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.message-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-xs);
	}

	.message-sender {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.message-step {
		font-size: 0.6rem;
		padding: 2px 6px;
		background-color: var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	.message-text {
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.message-text :global(h3) {
		font-size: 1rem;
		font-weight: 700;
		margin: var(--spacing-md) 0 var(--spacing-xs);
		color: var(--color-text);
	}

	.message-text :global(h4) {
		font-size: 0.9rem;
		font-weight: 600;
		margin: var(--spacing-sm) 0 var(--spacing-xs);
		color: var(--color-text);
	}

	.message-text :global(strong) {
		font-weight: 600;
	}

	.message-text :global(li) {
		margin-left: var(--spacing-md);
		margin-bottom: var(--spacing-xs);
		list-style: disc;
	}

	.message-text :global(p) {
		margin-bottom: var(--spacing-sm);
	}

	.cursor-blink {
		animation: blink 0.8s infinite;
		color: var(--color-primary);
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	/* Error message */
	.error-message {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-surface);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: 0.8rem;
	}

	.error-message button {
		margin-left: auto;
		padding: 4px 8px;
		border: 1px solid var(--color-error);
		background: none;
		color: var(--color-error);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.7rem;
	}

	/* Bottom bar - pinned to bottom via flex layout */
	.bottom-bar {
		background-color: var(--color-surface);
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	/* Step navigation */
	.step-navigation {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.skip-step-btn {
		padding: 4px var(--spacing-sm);
		background: none;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.65rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.skip-step-btn:hover {
		border-color: var(--color-text-secondary);
		color: var(--color-text);
	}

	.step-hint {
		flex: 1;
		font-size: 0.65rem;
		color: var(--color-text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Step transition notification */
	.step-transition {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		margin: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--color-surface);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		color: var(--color-success);
	}

	.transition-icon {
		font-size: 1rem;
		flex-shrink: 0;
	}

	.transition-text {
		color: var(--color-text-secondary);
	}

	.transition-text strong {
		color: var(--color-text);
	}

	/* Completion banner */
	.completion-banner {
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		text-align: center;
	}

	.completion-banner h3 {
		font-size: 1rem;
		margin-bottom: var(--spacing-xs);
		color: var(--color-text);
	}

	.completion-banner p {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
	}

	.completion-actions {
		display: flex;
		gap: var(--spacing-sm);
		justify-content: center;
	}

	.secondary-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		background: none;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.secondary-btn:hover {
		border-color: var(--color-text-secondary);
		color: var(--color-text);
	}

	/* Input area */
	.input-area {
		padding: var(--spacing-md) var(--spacing-lg);
	}

	.input-wrapper {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: var(--color-background);
		transition: border-color var(--transition-fast);
	}

	.input-wrapper:focus-within {
		border-color: var(--color-primary);
	}

	.input-wrapper textarea {
		flex: 1;
		border: none;
		outline: none;
		background: none;
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: var(--font-sans);
		resize: none;
		padding: var(--spacing-xs);
		line-height: 1.5;
		max-height: 200px;
	}

	.input-wrapper textarea::placeholder {
		color: var(--color-text-secondary);
	}

	.send-button {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background-color: var(--color-primary);
		color: var(--color-background);
		border-radius: 50%;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.send-button:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
		transform: scale(1.05);
	}

	.send-button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.char-count {
		text-align: right;
		font-size: 0.65rem;
		color: var(--color-text-secondary);
		margin-top: 4px;
	}

	.char-count.warning {
		color: var(--color-warning);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.welcome-features {
			grid-template-columns: 1fr;
		}

		.welcome-content h1 {
			font-size: 1.6rem;
		}

		.message {
			max-width: 95%;
		}

		.chat-area {
			padding: var(--spacing-md);
		}

		.input-area {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.step-navigation {
			flex-direction: column;
			align-items: flex-start;
			padding: var(--spacing-sm) var(--spacing-md);
		}
	}
</style>
