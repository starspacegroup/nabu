/**
 * Video Provider Interface
 * Abstract interface for video generation providers (OpenAI Sora, etc.)
 */

export type VideoStatus = 'queued' | 'processing' | 'complete' | 'error';

export interface VideoGenerationRequest {
  prompt: string;
  model: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: number;
  resolution?: string;
}

export interface VideoGenerationResult {
  providerJobId: string;
  status: VideoStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  cost?: number;
}

export interface VideoStatusResult {
  status: VideoStatus;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  cost?: number;
}

export interface VideoModelPricing {
  /** Cost per second of generated video (e.g. OpenAI Sora) */
  estimatedCostPerSecond?: number;
  /** Flat cost per generation regardless of duration (e.g. WaveSpeed) */
  estimatedCostPerGeneration?: number;
  /** ISO 4217 currency code */
  currency: string;
}

export interface VideoModel {
  id: string;
  displayName: string;
  provider: string;
  maxDuration?: number;
  supportedAspectRatios?: string[];
  supportedResolutions?: string[];
  /** Estimated pricing for this model */
  pricing?: VideoModelPricing;
}

/**
 * Interface that all video providers must implement
 */
export interface VideoProvider {
  readonly name: string;

  /**
   * Start a video generation job
   */
  generateVideo(
    apiKey: string,
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult>;

  /**
   * Check the status of a video generation job
   */
  getStatus(
    apiKey: string,
    providerJobId: string
  ): Promise<VideoStatusResult>;

  /**
   * Get the list of available video models for this provider
   */
  getAvailableModels(): VideoModel[];

  /**
   * Download the video content as bytes (for R2 caching)
   */
  downloadVideo(
    apiKey: string,
    videoUrl: string
  ): Promise<ArrayBuffer>;
}
