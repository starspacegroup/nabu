/**
 * OpenAI Video Provider (Sora)
 * Implements video generation using OpenAI's video generation API
 */

import type {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
  VideoStatusResult,
  VideoModel
} from '../video-provider';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

const OPENAI_VIDEO_MODELS: VideoModel[] = [
  {
    id: 'sora',
    displayName: 'Sora',
    provider: 'openai',
    maxDuration: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['1080p', '720p', '480p']
  }
];

export class OpenAIVideoProvider implements VideoProvider {
  readonly name = 'openai';

  async generateVideo(
    apiKey: string,
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult> {
    try {
      const response = await fetch(`${OPENAI_API_BASE}/videos/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'sora',
          prompt: request.prompt,
          size: this.mapAspectRatio(request.aspectRatio),
          duration: request.duration,
          n: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as Record<string, Record<string, string>>)?.error?.message ||
          `OpenAI API error: ${response.status}`;
        return {
          providerJobId: '',
          status: 'error',
          error: errorMessage
        };
      }

      const data = (await response.json()) as {
        id: string;
        status: string;
        data?: Array<{ url: string; }>;
        error?: { message: string; };
      };

      // OpenAI may return the video immediately or provide a job ID for polling
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return {
          providerJobId: data.id || 'direct',
          status: 'complete',
          videoUrl: data.data[0].url
        };
      }

      return {
        providerJobId: data.id,
        status: data.status === 'completed' ? 'complete' : 'processing'
      };
    } catch (err) {
      return {
        providerJobId: '',
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to start video generation'
      };
    }
  }

  async getStatus(
    apiKey: string,
    providerJobId: string
  ): Promise<VideoStatusResult> {
    try {
      const response = await fetch(`${OPENAI_API_BASE}/videos/generations/${providerJobId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          status: 'error',
          error:
            (errorData as Record<string, Record<string, string>>)?.error?.message ||
            `Status check failed: ${response.status}`
        };
      }

      const data = (await response.json()) as {
        status: string;
        data?: Array<{ url: string; }>;
        error?: { message: string; };
      };

      if (data.status === 'completed' && data.data && data.data.length > 0) {
        return {
          status: 'complete',
          videoUrl: data.data[0].url,
          progress: 100
        };
      }

      if (data.status === 'failed' || data.error) {
        return {
          status: 'error',
          error: data.error?.message || 'Video generation failed'
        };
      }

      return {
        status: 'processing',
        progress: 50 // OpenAI doesn't provide granular progress
      };
    } catch (err) {
      return {
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to check video status'
      };
    }
  }

  getAvailableModels(): VideoModel[] {
    return OPENAI_VIDEO_MODELS;
  }

  async downloadVideo(_apiKey: string, videoUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  /**
   * Map aspect ratio to OpenAI size parameter
   */
  private mapAspectRatio(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '9:16':
        return '1080x1920';
      case '1:1':
        return '1080x1080';
      case '16:9':
      default:
        return '1920x1080';
    }
  }
}
