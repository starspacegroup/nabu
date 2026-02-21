/**
 * Brand Onboarding Types
 * Types for the AI-driven brand building onboarding process
 */

/** The steps in the onboarding wizard */
export type OnboardingStep =
  | 'welcome'
  | 'brand_assessment'
  | 'brand_identity'
  | 'target_audience'
  | 'brand_personality'
  | 'visual_identity'
  | 'market_positioning'
  | 'brand_story'
  | 'style_guide'
  | 'complete';

/** Brand archetype based on Jungian psychology */
export type BrandArchetype =
  | 'innocent'
  | 'sage'
  | 'explorer'
  | 'outlaw'
  | 'magician'
  | 'hero'
  | 'lover'
  | 'jester'
  | 'everyman'
  | 'caregiver'
  | 'ruler'
  | 'creator';

/** Market positioning tier */
export type MarketPosition = 'budget' | 'mid-range' | 'premium' | 'luxury';

/** Brand profile status */
export type BrandProfileStatus = 'in_progress' | 'completed' | 'archived';

/** Complete brand profile */
export interface BrandProfile {
  id: string;
  userId: string;
  status: BrandProfileStatus;

  // Brand identity
  brandName?: string;
  tagline?: string;
  missionStatement?: string;
  visionStatement?: string;
  elevatorPitch?: string;

  // Personality & psychology
  brandArchetype?: BrandArchetype;
  brandPersonalityTraits?: string[];
  toneOfVoice?: string;
  communicationStyle?: string;

  // Target audience
  targetAudience?: TargetAudience;
  customerPainPoints?: string[];
  valueProposition?: string;

  // Visual identity
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  colorPalette?: string[];
  typographyHeading?: string;
  typographyBody?: string;
  logoConcept?: string;
  logoUrl?: string;

  // Market positioning
  industry?: string;
  competitors?: string[];
  uniqueSellingPoints?: string[];
  marketPosition?: MarketPosition;

  // Brand story
  originStory?: string;
  brandValues?: string[];
  brandPromise?: string;

  // Style guide
  styleGuide?: BrandStyleGuide;

  // Metadata
  onboardingStep: OnboardingStep;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Target audience definition */
export interface TargetAudience {
  demographics?: {
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    education?: string;
    occupation?: string;
  };
  psychographics?: {
    values?: string[];
    interests?: string[];
    lifestyle?: string;
    personality?: string;
    attitudes?: string[];
  };
}

/** Complete brand style guide output */
export interface BrandStyleGuide {
  brandName: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    palette: string[];
  };
  typography: {
    heading: string;
    body: string;
  };
  tone: string;
  archetype: string;
  doList: string[];
  dontList: string[];
  voiceExamples: {
    scenario: string;
    example: string;
  }[];
}

/** Onboarding message */
export interface OnboardingMessage {
  id: string;
  brandProfileId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  step?: OnboardingStep;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Step configuration for the onboarding wizard */
export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  systemPrompt: string;
  extractionFields: string[];
}

/** Data extracted from an AI response */
export interface ExtractedBrandData {
  [key: string]: string | string[] | Record<string, unknown> | undefined;
}
