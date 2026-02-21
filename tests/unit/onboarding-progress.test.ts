import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import OnboardingProgress from '../../src/lib/components/OnboardingProgress.svelte';

describe('OnboardingProgress', () => {
  it('should render mobile summary with current step info', () => {
    render(OnboardingProgress, { props: { currentStep: 'brand_personality' } });

    // Mobile summary should show the current step label and count
    expect(screen.getByText('Personality')).toBeTruthy();
    expect(screen.getByText('5/10')).toBeTruthy();
  });

  it('should render all 10 step dots for navigation', () => {
    render(OnboardingProgress, { props: { currentStep: 'welcome' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    // All 10 steps should be rendered as buttons inside the nav
    const stepButtons = nav.querySelectorAll('button.step');
    expect(stepButtons.length).toBe(10);
  });

  it('should mark completed steps correctly', () => {
    // brand_personality is index 4, so steps 0-3 should be completed
    render(OnboardingProgress, { props: { currentStep: 'brand_personality' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    const stepButtons = nav.querySelectorAll('button.step');

    // First 4 steps completed
    expect(stepButtons[0].classList.contains('completed')).toBe(true);
    expect(stepButtons[1].classList.contains('completed')).toBe(true);
    expect(stepButtons[2].classList.contains('completed')).toBe(true);
    expect(stepButtons[3].classList.contains('completed')).toBe(true);

    // Current step active
    expect(stepButtons[4].classList.contains('active')).toBe(true);

    // Future steps
    expect(stepButtons[5].classList.contains('future')).toBe(true);
  });

  it('should render a progress bar with correct percentage', () => {
    // brand_personality is index 4 out of 9 segments = ~44%
    render(OnboardingProgress, { props: { currentStep: 'brand_personality' } });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('44');
  });

  it('should disable future step buttons', () => {
    render(OnboardingProgress, { props: { currentStep: 'brand_identity' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    const stepButtons = nav.querySelectorAll('button.step');

    // brand_identity is index 2, so steps 3+ are future and disabled
    expect(stepButtons[3].hasAttribute('disabled')).toBe(true);
    expect(stepButtons[4].hasAttribute('disabled')).toBe(true);
  });

  it('should have proper ARIA labels on step buttons', () => {
    render(OnboardingProgress, { props: { currentStep: 'welcome' } });

    expect(screen.getByLabelText(/Welcome — current step/)).toBeTruthy();
    expect(screen.getByLabelText(/Assessment — upcoming/)).toBeTruthy();
  });

  it('should set aria-current on the active step', () => {
    render(OnboardingProgress, { props: { currentStep: 'target_audience' } });

    const activeStep = screen.getByLabelText(/Audience — current step/);
    expect(activeStep.getAttribute('aria-current')).toBe('step');
  });

  it('should show checkmarks for completed steps', () => {
    render(OnboardingProgress, { props: { currentStep: 'brand_identity' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    // First two steps (welcome, brand_assessment) are completed and should have SVG check icons
    const completedSteps = nav.querySelectorAll('button.step.completed');
    expect(completedSteps.length).toBe(2);

    completedSteps.forEach((step) => {
      expect(step.querySelector('svg.check-icon')).toBeTruthy();
    });
  });

  it('should show connector lines between steps', () => {
    render(OnboardingProgress, { props: { currentStep: 'welcome' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    // 9 connectors between 10 steps
    const connectors = nav.querySelectorAll('.connector');
    expect(connectors.length).toBe(9);
  });

  it('should mark connector lines as filled for completed steps', () => {
    render(OnboardingProgress, { props: { currentStep: 'brand_identity' } });

    const nav = screen.getByRole('navigation', { name: 'Onboarding steps' });
    const filledConnectors = nav.querySelectorAll('.connector.filled');
    // brand_identity is index 2, so connectors 0 and 1 should be filled
    expect(filledConnectors.length).toBe(2);
  });

  it('should show 100% progress on complete step', () => {
    render(OnboardingProgress, { props: { currentStep: 'complete' } });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('100');
  });
});
