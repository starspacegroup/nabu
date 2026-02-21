<script lang="ts">
	/**
	 * OnboardingProgress - Visual step progress indicator for the brand onboarding wizard
	 */
	import type { OnboardingStep } from '$lib/types/onboarding';

	export let currentStep: OnboardingStep = 'welcome';

	const steps: { id: OnboardingStep; label: string; icon: string }[] = [
		{ id: 'welcome', label: 'Welcome', icon: '👋' },
		{ id: 'brand_assessment', label: 'Assessment', icon: '🔍' },
		{ id: 'brand_identity', label: 'Identity', icon: '💡' },
		{ id: 'target_audience', label: 'Audience', icon: '🎯' },
		{ id: 'brand_personality', label: 'Personality', icon: '🧠' },
		{ id: 'visual_identity', label: 'Visual', icon: '🎨' },
		{ id: 'market_positioning', label: 'Position', icon: '📊' },
		{ id: 'brand_story', label: 'Story', icon: '📖' },
		{ id: 'style_guide', label: 'Style Guide', icon: '📋' },
		{ id: 'complete', label: 'Complete', icon: '🎉' }
	];

	$: currentIndex = steps.findIndex((s) => s.id === currentStep);
	$: progress = Math.round((currentIndex / (steps.length - 1)) * 100);
</script>

<div class="progress-container" role="navigation" aria-label="Onboarding progress">
	<div class="progress-bar-bg">
		<div class="progress-bar-fill" style="width: {progress}%" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} role="progressbar">
		</div>
	</div>

	<div class="steps">
		{#each steps as step, i}
			<button
				class="step"
				class:active={step.id === currentStep}
				class:completed={i < currentIndex}
				class:future={i > currentIndex}
				disabled={i > currentIndex}
				title={step.label}
				aria-label="{step.label} - {i < currentIndex ? 'completed' : i === currentIndex ? 'current step' : 'upcoming'}"
				aria-current={step.id === currentStep ? 'step' : undefined}
			>
				<span class="step-icon">{step.icon}</span>
				<span class="step-label">{step.label}</span>
			</button>
		{/each}
	</div>

	<div class="progress-text">
		Step {currentIndex + 1} of {steps.length} — {steps[currentIndex]?.label || 'Welcome'}
	</div>
</div>

<style>
	.progress-container {
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-surface);
	}

	.progress-bar-bg {
		height: 4px;
		background-color: var(--color-border);
		border-radius: var(--radius-xl);
		overflow: hidden;
		margin-bottom: var(--spacing-md);
	}

	.progress-bar-fill {
		height: 100%;
		background-color: var(--color-primary);
		border-radius: var(--radius-xl);
		transition: width var(--transition-base) ease;
	}

	.steps {
		display: flex;
		gap: var(--spacing-xs);
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: var(--spacing-xs);
	}

	.steps::-webkit-scrollbar {
		display: none;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: var(--spacing-xs) var(--spacing-sm);
		border: none;
		background: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		flex-shrink: 0;
		min-width: 60px;
	}

	.step:hover:not(:disabled) {
		background-color: var(--color-surface-hover);
	}

	.step.active {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.step.completed {
		opacity: 0.7;
	}

	.step.future {
		opacity: 0.35;
		cursor: default;
	}

	.step:disabled {
		cursor: default;
	}

	.step-icon {
		font-size: 1.2rem;
		line-height: 1;
	}

	.step-label {
		font-size: 0.6rem;
		font-weight: 500;
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.progress-text {
		text-align: center;
		font-size: 0.7rem;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-xs);
	}

	@media (max-width: 768px) {
		.steps {
			gap: 2px;
		}
		.step {
			min-width: 45px;
			padding: var(--spacing-xs) 4px;
		}
		.step-label {
			display: none;
		}
	}
</style>
