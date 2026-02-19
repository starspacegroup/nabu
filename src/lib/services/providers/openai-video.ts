/**
 * OpenAI Video Provider (Sora)
 * Implements video generation using OpenAI's Sora Video API
 * @see https://developers.openai.com/api/docs/guides/video-generation
 *
 * API endpoints:
 *   POST   /v1/videos              - Create a video render job
 *   GET    /v1/videos/{video_id}   - Poll job status & progress
 *   GET    /v1/videos/{video_id}/content - Download the finished MP4
 *   GET    /v1/videos              - List videos
 *   DELETE /v1/videos/{video_id}   - Delete a video
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
    id: 'sora-2',
    displayName: 'Sora 2',
    provider: 'openai',
    maxDuration: 12,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['1080p', '720p'],
    pricing: {
      estimatedCostPerSecond: 0.025,
      currency: 'USD'
    }
  },
  {
    id: 'sora-2-pro',
    displayName: 'Sora 2 Pro',
    provider: 'openai',
    maxDuration: 12,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['1080p', '720p'],
    pricing: {
      estimatedCostPerSecond: 0.05,
      currency: 'USD'
    }
  }
];

export class OpenAIVideoProvider implements VideoProvider {
  readonly name = 'openai';

  async generateVideo(
    apiKey: string,
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult> {
    try {
      const response = await fetch(`${OPENAI_API_BASE}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'sora-2',
          prompt: request.prompt,
          size: this.mapAspectRatio(request.aspectRatio),
          seconds: String(request.duration || 8)
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
        object: string;
        status: string;
        model: string;
        progress: number;
        seconds: string;
        size: string;
      };

      // The API returns a job with status 'queued' or 'in_progress'
      // Video must be polled via GET /videos/{id} until 'completed'
      if (data.status === 'completed') {
        return {
          providerJobId: data.id,
          status: 'complete',
          videoUrl: `${OPENAI_API_BASE}/videos/${data.id}/content`
        };
      }

      return {
        providerJobId: data.id,
        status: data.status === 'queued' ? 'queued' : 'processing'
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
      const response = await fetch(`${OPENAI_API_BASE}/videos/${providerJobId}`, {
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
        id: string;
        object: string;
        status: string;
        model: string;
        progress: number;
        seconds: string;
        size: string;
      };

      if (data.status === 'completed') {
        return {
          status: 'complete',
          videoUrl: `${OPENAI_API_BASE}/videos/${data.id}/content`,
          progress: 100
        };
      }

      if (data.status === 'failed') {
        return {
          status: 'error',
          error: 'Video generation failed'
        };
      }

      return {
        status: data.status === 'queued' ? 'queued' : 'processing',
        progress: data.progress ?? 0
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

  async downloadVideo(apiKey: string, videoUrl: string): Promise<ArrayBuffer> {
    // OpenAI video content endpoint requires authentication
    const response = await fetch(videoUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  /**
   * Map aspect ratio to OpenAI size parameter (width x height)
   */
  private mapAspectRatio(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '9:16':
        return '720x1280';
      case '1:1':
        return '1080x1080';
      case '16:9':
      default:
        return '1280x720';
    }
  }
}
