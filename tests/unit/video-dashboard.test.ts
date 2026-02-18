import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

describe('VideoCreateForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the create form with prompt input', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    expect(screen.getByPlaceholderText(/describe.*video/i)).toBeInTheDocument();
  });

  it('should render aspect ratio selector', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });

  it('should show generate button', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('should disable generate button when no prompt', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    const btn = screen.getByRole('button', { name: /generate/i });
    expect(btn).toBeDisabled();
  });

  it('should show disabled state when no models available', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [] }
    });

    expect(screen.getByText(/no video provider/i)).toBeInTheDocument();
  });

  it('should render duration selector with options', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    expect(screen.getByText('4s')).toBeInTheDocument();
    expect(screen.getByText('8s')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument();
  });

  it('should have 8s duration selected by default', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    const btn8s = screen.getByRole('radio', { name: '8s' });
    expect(btn8s.getAttribute('aria-checked')).toBe('true');
  });

  it('should allow selecting a different duration', async () => {
    const { default: VideoCreateForm } = await import(
      '../../src/lib/components/VideoCreateForm.svelte'
    );

    render(VideoCreateForm, {
      props: { models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    const btn12s = screen.getByRole('radio', { name: '12s' });
    await fireEvent.click(btn12s);
    expect(btn12s.getAttribute('aria-checked')).toBe('true');

    const btn8s = screen.getByRole('radio', { name: '8s' });
    expect(btn8s.getAttribute('aria-checked')).toBe('false');
  });
});

describe('ScheduleManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render schedule list header', async () => {
    const { default: ScheduleManager } = await import(
      '../../src/lib/components/ScheduleManager.svelte'
    );

    render(ScheduleManager, {
      props: { schedules: [], models: [] }
    });

    expect(screen.getByRole('heading', { name: /schedules/i })).toBeInTheDocument();
  });

  it('should show empty state when no schedules', async () => {
    const { default: ScheduleManager } = await import(
      '../../src/lib/components/ScheduleManager.svelte'
    );

    render(ScheduleManager, {
      props: { schedules: [], models: [] }
    });

    expect(screen.getByText(/no schedules/i)).toBeInTheDocument();
  });

  it('should render schedule items', async () => {
    const { default: ScheduleManager } = await import(
      '../../src/lib/components/ScheduleManager.svelte'
    );

    render(ScheduleManager, {
      props: {
        schedules: [
          {
            id: 'sched-1',
            name: 'Daily Promo',
            prompt: 'Create a product promo',
            frequency: 'daily',
            enabled: true,
            totalRuns: 5,
            maxRuns: null,
            aspectRatio: '16:9',
            model: 'sora',
            provider: 'openai',
            nextRunAt: '2026-02-19T00:00:00Z',
            lastRunAt: null,
            createdAt: '2026-02-18T00:00:00Z'
          }
        ],
        models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }]
      }
    });

    expect(screen.getByText('Daily Promo')).toBeInTheDocument();
    expect(screen.getByText('Daily', { selector: '.frequency-badge' })).toBeInTheDocument();
  });

  it('should show new schedule button', async () => {
    const { default: ScheduleManager } = await import(
      '../../src/lib/components/ScheduleManager.svelte'
    );

    render(ScheduleManager, {
      props: { schedules: [], models: [{ id: 'sora', displayName: 'Sora', provider: 'openai' }] }
    });

    expect(screen.getByRole('button', { name: /new schedule/i })).toBeInTheDocument();
  });
});
