/**
 * Tests for Brand Onboarding Service
 * TDD: Write tests first, then implement
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBrandProfile,
  getBrandProfile,
  getBrandProfileByUser,
  updateBrandProfile,
  getOnboardingMessages,
  addOnboardingMessage,
  getStepConfig,
  getSystemPromptForStep,
  ONBOARDING_STEPS,
  buildConversationContext,
  archiveBrandProfile,
  STEP_COMPLETE_MARKER,
  getNextStep,
  getPreviousStep,
  getStepProgress
} from '$lib/services/onboarding';
import type { BrandProfile, OnboardingStep } from '$lib/types/onboarding';

// Mock D1 database
function createMockDB() {
  const mockResult = { results: [], success: true, meta: {} };
  const mockFirst = vi.fn().mockResolvedValue(null);
  const mockAll = vi.fn().mockResolvedValue(mockResult);
  const mockRun = vi.fn().mockResolvedValue(mockResult);

  const mockBind = vi.fn().mockReturnValue({
    first: mockFirst,
    all: mockAll,
    run: mockRun
  });

  const mockPrepare = vi.fn().mockReturnValue({
    bind: mockBind,
    first: mockFirst,
    all: mockAll,
    run: mockRun
  });

  return {
    prepare: mockPrepare,
    batch: vi.fn().mockResolvedValue([]),
    _mockBind: mockBind,
    _mockFirst: mockFirst,
    _mockAll: mockAll,
    _mockRun: mockRun
  };
}

describe('Brand Onboarding Service', () => {
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    mockDB = createMockDB();
    vi.clearAllMocks();
  });

  describe('ONBOARDING_STEPS', () => {
    it('should define all onboarding steps in order', () => {
      expect(ONBOARDING_STEPS).toBeDefined();
      expect(Array.isArray(ONBOARDING_STEPS)).toBe(true);
      expect(ONBOARDING_STEPS.length).toBeGreaterThan(0);

      // Should start with welcome
      expect(ONBOARDING_STEPS[0].id).toBe('welcome');

      // Should end with complete
      expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].id).toBe('complete');
    });

    it('should have required fields for each step', () => {
      for (const step of ONBOARDING_STEPS) {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.systemPrompt).toBeDefined();
        expect(typeof step.systemPrompt).toBe('string');
        expect(step.systemPrompt.length).toBeGreaterThan(0);
      }
    });

    it('should include brand_assessment step after welcome', () => {
      const stepIds = ONBOARDING_STEPS.map((s) => s.id);
      expect(stepIds).toContain('brand_assessment');
      const welcomeIdx = stepIds.indexOf('welcome');
      const assessmentIdx = stepIds.indexOf('brand_assessment');
      expect(assessmentIdx).toBeGreaterThan(welcomeIdx);
    });

    it('should include all critical branding steps', () => {
      const stepIds = ONBOARDING_STEPS.map((s) => s.id);
      expect(stepIds).toContain('brand_identity');
      expect(stepIds).toContain('target_audience');
      expect(stepIds).toContain('brand_personality');
      expect(stepIds).toContain('visual_identity');
      expect(stepIds).toContain('brand_story');
      expect(stepIds).toContain('style_guide');
    });
  });

  describe('STEP_COMPLETE_MARKER', () => {
    it('should be a non-empty string', () => {
      expect(STEP_COMPLETE_MARKER).toBeDefined();
      expect(typeof STEP_COMPLETE_MARKER).toBe('string');
      expect(STEP_COMPLETE_MARKER.length).toBeGreaterThan(0);
    });

    it('should be a distinctive marker unlikely to appear in normal text', () => {
      expect(STEP_COMPLETE_MARKER).toContain('<<');
      expect(STEP_COMPLETE_MARKER).toContain('>>');
    });
  });

  describe('getStepConfig', () => {
    it('should return step config for a valid step', () => {
      const config = getStepConfig('welcome');
      expect(config).toBeDefined();
      expect(config!.id).toBe('welcome');
      expect(config!.title).toBeDefined();
      expect(config!.systemPrompt).toBeDefined();
    });

    it('should return undefined for invalid step', () => {
      const config = getStepConfig('nonexistent' as OnboardingStep);
      expect(config).toBeUndefined();
    });
  });

  describe('getSystemPromptForStep', () => {
    it('should return a system prompt for any valid step', () => {
      const prompt = getSystemPromptForStep('welcome');
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('should include marketing expertise context in prompts', () => {
      const prompt = getSystemPromptForStep('welcome');
      expect(prompt.toLowerCase()).toMatch(/brand|marketing|expert/i);
    });

    it('should include psychology/philosophy references for brand_personality step', () => {
      const prompt = getSystemPromptForStep('brand_personality');
      expect(prompt.toLowerCase()).toMatch(/archetype|psychology|personality/i);
    });

    it('should return empty string for invalid step', () => {
      const prompt = getSystemPromptForStep('nonexistent' as OnboardingStep);
      expect(prompt).toBe('');
    });

    it('should incorporate existing brand data when provided', () => {
      const brandData: Partial<BrandProfile> = {
        brandName: 'TestBrand',
        industry: 'Technology'
      };
      const prompt = getSystemPromptForStep('target_audience', brandData);
      expect(prompt).toContain('TestBrand');
      expect(prompt).toContain('Technology');
    });

    it('should include auto-progression instruction for non-complete steps', () => {
      const prompt = getSystemPromptForStep('welcome');
      expect(prompt).toContain(STEP_COMPLETE_MARKER);
      expect(prompt).toContain('AUTOMATIC STEP PROGRESSION');
    });

    it('should NOT include auto-progression instruction for complete step', () => {
      const prompt = getSystemPromptForStep('complete');
      expect(prompt).not.toContain(STEP_COMPLETE_MARKER);
      expect(prompt).not.toContain('AUTOMATIC STEP PROGRESSION');
    });
  });

  describe('createBrandProfile', () => {
    it('should create a new brand profile', async () => {
      const result = await createBrandProfile(mockDB as any, 'user-123');

      expect(mockDB.prepare).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.status).toBe('in_progress');
      expect(result.onboardingStep).toBe('welcome');
      expect(result.id).toBeDefined();
    });

    it('should generate a unique ID for each profile', async () => {
      const result1 = await createBrandProfile(mockDB as any, 'user-123');
      const result2 = await createBrandProfile(mockDB as any, 'user-123');

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getBrandProfile', () => {
    it('should return a brand profile by ID', async () => {
      const mockProfile = {
        id: 'bp-123',
        user_id: 'user-123',
        status: 'in_progress',
        brand_name: 'TestBrand',
        onboarding_step: 'brand_identity',
        brand_personality_traits: '["bold","innovative"]',
        color_palette: '["#FF0000","#00FF00"]',
        target_audience: '{"demographics":{"ageRange":"25-35"}}',
        brand_values: '["quality","innovation"]',
        competitors: '["Competitor A"]',
        unique_selling_points: '["Fast delivery"]',
        customer_pain_points: '["High cost"]',
        style_guide: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };

      mockDB._mockFirst.mockResolvedValueOnce(mockProfile);

      const result = await getBrandProfile(mockDB as any, 'bp-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('bp-123');
      expect(result!.brandName).toBe('TestBrand');
      expect(result!.onboardingStep).toBe('brand_identity');
      expect(result!.brandPersonalityTraits).toEqual(['bold', 'innovative']);
    });

    it('should return null if profile not found', async () => {
      mockDB._mockFirst.mockResolvedValueOnce(null);

      const result = await getBrandProfile(mockDB as any, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getBrandProfileByUser', () => {
    it('should return active brand profile for a user', async () => {
      const mockProfile = {
        id: 'bp-123',
        user_id: 'user-123',
        status: 'in_progress',
        brand_name: null,
        onboarding_step: 'welcome',
        brand_personality_traits: null,
        color_palette: null,
        target_audience: null,
        brand_values: null,
        competitors: null,
        unique_selling_points: null,
        customer_pain_points: null,
        style_guide: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };

      mockDB._mockFirst.mockResolvedValueOnce(mockProfile);

      const result = await getBrandProfileByUser(mockDB as any, 'user-123');

      expect(result).toBeDefined();
      expect(result!.userId).toBe('user-123');
    });

    it('should return null when user has no active profile', async () => {
      mockDB._mockFirst.mockResolvedValueOnce(null);

      const result = await getBrandProfileByUser(mockDB as any, 'user-456');
      expect(result).toBeNull();
    });
  });

  describe('updateBrandProfile', () => {
    it('should update brand profile fields', async () => {
      await updateBrandProfile(mockDB as any, 'bp-123', {
        brandName: 'NewBrand',
        tagline: 'Be bold',
        onboardingStep: 'brand_identity'
      });

      expect(mockDB.prepare).toHaveBeenCalled();
    });

    it('should serialize JSON fields correctly', async () => {
      await updateBrandProfile(mockDB as any, 'bp-123', {
        brandPersonalityTraits: ['bold', 'innovative'],
        colorPalette: ['#FF0000', '#00FF00']
      });

      expect(mockDB.prepare).toHaveBeenCalled();
    });
  });

  describe('addOnboardingMessage', () => {
    it('should add a message to the onboarding conversation', async () => {
      const result = await addOnboardingMessage(mockDB as any, {
        brandProfileId: 'bp-123',
        userId: 'user-123',
        role: 'user',
        content: 'Hello, I want to build a brand',
        step: 'welcome'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.content).toBe('Hello, I want to build a brand');
      expect(result.role).toBe('user');
      expect(mockDB.prepare).toHaveBeenCalled();
    });

    it('should store metadata when provided', async () => {
      const result = await addOnboardingMessage(mockDB as any, {
        brandProfileId: 'bp-123',
        userId: 'user-123',
        role: 'assistant',
        content: 'Great! Let me help you.',
        step: 'welcome',
        metadata: { extractedName: 'TestBrand' }
      });

      expect(result.metadata).toEqual({ extractedName: 'TestBrand' });
    });
  });

  describe('getOnboardingMessages', () => {
    it('should return messages for a brand profile', async () => {
      mockDB._mockAll.mockResolvedValueOnce({
        results: [
          {
            id: 'msg-1',
            brand_profile_id: 'bp-123',
            user_id: 'user-123',
            role: 'assistant',
            content: 'Welcome!',
            step: 'welcome',
            metadata: null,
            created_at: '2026-01-01T00:00:00Z'
          },
          {
            id: 'msg-2',
            brand_profile_id: 'bp-123',
            user_id: 'user-123',
            role: 'user',
            content: 'Hi there!',
            step: 'welcome',
            metadata: null,
            created_at: '2026-01-01T00:01:00Z'
          }
        ]
      });

      const messages = await getOnboardingMessages(mockDB as any, 'bp-123');

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('assistant');
      expect(messages[1].role).toBe('user');
    });

    it('should filter messages by step when provided', async () => {
      mockDB._mockAll.mockResolvedValueOnce({
        results: [
          {
            id: 'msg-1',
            brand_profile_id: 'bp-123',
            user_id: 'user-123',
            role: 'assistant',
            content: 'Tell me about your brand',
            step: 'brand_identity',
            metadata: null,
            created_at: '2026-01-01T00:00:00Z'
          }
        ]
      });

      const messages = await getOnboardingMessages(mockDB as any, 'bp-123', 'brand_identity');

      expect(messages).toHaveLength(1);
      expect(messages[0].step).toBe('brand_identity');
    });

    it('should return empty array when no messages exist', async () => {
      mockDB._mockAll.mockResolvedValueOnce({ results: [] });

      const messages = await getOnboardingMessages(mockDB as any, 'bp-123');
      expect(messages).toEqual([]);
    });
  });

  describe('buildConversationContext', () => {
    it('should build conversation context with system prompt and messages', () => {
      const messages = [
        {
          id: 'msg-1',
          brandProfileId: 'bp-123',
          userId: 'user-123',
          role: 'assistant' as const,
          content: 'Welcome! Do you have an existing brand?',
          step: 'welcome' as OnboardingStep,
          createdAt: '2026-01-01T00:00:00Z'
        },
        {
          id: 'msg-2',
          brandProfileId: 'bp-123',
          userId: 'user-123',
          role: 'user' as const,
          content: 'No, I am starting from scratch',
          step: 'welcome' as OnboardingStep,
          createdAt: '2026-01-01T00:01:00Z'
        }
      ];

      const context = buildConversationContext('welcome', messages);

      expect(context).toBeDefined();
      expect(Array.isArray(context)).toBe(true);
      // Should start with system message
      expect(context[0].role).toBe('system');
      // Should include conversation messages
      expect(context.length).toBeGreaterThan(1);
    });

    it('should incorporate brand data into system prompt', () => {
      const brandData: Partial<BrandProfile> = {
        brandName: 'Acme Corp',
        industry: 'Software'
      };

      const context = buildConversationContext('brand_identity', [], brandData);

      const systemMessage = context.find((m) => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('Acme Corp');
    });
  });

  describe('archiveBrandProfile', () => {
    it('should set profile status to archived', async () => {
      await archiveBrandProfile(mockDB as any, 'bp-123');

      expect(mockDB.prepare).toHaveBeenCalled();
    });
  });

  describe('getNextStep', () => {
    it('should return the next step in sequence', () => {
      expect(getNextStep('welcome')).toBe('brand_assessment');
      expect(getNextStep('brand_assessment')).toBe('brand_identity');
      expect(getNextStep('brand_identity')).toBe('target_audience');
    });

    it('should return null for the last step', () => {
      expect(getNextStep('complete')).toBeNull();
    });

    it('should return null for an invalid step', () => {
      expect(getNextStep('nonexistent' as any)).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    it('should return the previous step in sequence', () => {
      expect(getPreviousStep('brand_assessment')).toBe('welcome');
      expect(getPreviousStep('brand_identity')).toBe('brand_assessment');
      expect(getPreviousStep('target_audience')).toBe('brand_identity');
      expect(getPreviousStep('complete')).toBe('style_guide');
    });

    it('should return null for the first step (welcome)', () => {
      expect(getPreviousStep('welcome')).toBeNull();
    });

    it('should return null for an invalid step', () => {
      expect(getPreviousStep('nonexistent' as any)).toBeNull();
    });
  });

  describe('getStepProgress', () => {
    it('should return 0% for welcome step', () => {
      expect(getStepProgress('welcome')).toBe(0);
    });

    it('should return 100% for complete step', () => {
      expect(getStepProgress('complete')).toBe(100);
    });

    it('should return intermediate values for middle steps', () => {
      const progress = getStepProgress('brand_identity');
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(100);
    });
  });
});
