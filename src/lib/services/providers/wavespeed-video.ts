/**
 * WaveSpeed AI Video Provider
 * Implements the VideoProvider interface for WaveSpeed AI's media generation API
 *
 * API Base URL: https://api.wavespeed.ai/api/v3
 * Auth: Bearer token in Authorization header
 * Flow: Submit task → Poll for result
 */

import type {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
  VideoStatusResult,
  VideoModel
} from '../video-provider';

const WAVESPEED_API_BASE = 'https://api.wavespeed.ai/api/v3';

/**
 * Map WaveSpeed API status strings to our VideoStatus type
 */
function mapStatus(wsStatus: string): 'queued' | 'processing' | 'complete' | 'error' {
  switch (wsStatus) {
    case 'created':
    case 'pending':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'processing';
  }
}

/**
 * Curated list of popular WaveSpeed video models
 * These are the most commonly used models available via WaveSpeed's API
 */
const WAVESPEED_VIDEO_MODELS: VideoModel[] = [
  // Wan 2.1 Models
  {
    id: 'wan-2.1-t2v-720p',
    displayName: 'Wan 2.1 Text-to-Video 720p',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.03, currency: 'USD' }
  },
  {
    id: 'wan-2.1-i2v-720p',
    displayName: 'Wan 2.1 Image-to-Video 720p',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.04, currency: 'USD' }
  },
  {
    id: 'wan-2.1-t2v-480p',
    displayName: 'Wan 2.1 Text-to-Video 480p',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.02, currency: 'USD' }
  },
  // Wan 2.2 Models
  {
    id: 'wan-2.2-t2v-720p',
    displayName: 'Wan 2.2 Text-to-Video 720p',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.04, currency: 'USD' }
  },
  {
    id: 'wan-2.2-i2v-480p',
    displayName: 'Wan 2.2 Image-to-Video 480p',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.03, currency: 'USD' }
  },
  // FLUX Image Models
  {
    id: 'flux-dev',
    displayName: 'FLUX Dev',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.025, currency: 'USD' }
  },
  {
    id: 'flux-schnell',
    displayName: 'FLUX Schnell',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.015, currency: 'USD' }
  },
  // Hunyuan Video Models
  {
    id: 'hunyuan-video-t2v',
    displayName: 'Hunyuan Video Text-to-Video',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.05, currency: 'USD' }
  },
  // LTX Video Models
  {
    id: 'ltx-2-19b-text-to-video',
    displayName: 'LTX 2 Text-to-Video',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.03, currency: 'USD' }
  },
  {
    id: 'ltx-2-19b-image-to-video',
    displayName: 'LTX 2 Image-to-Video',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.035, currency: 'USD' }
  },
  // Framepack
  {
    id: 'framepack',
    displayName: 'Framepack',
    provider: 'wavespeed',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    pricing: { estimatedCostPerGeneration: 0.04, currency: 'USD' }
  }
];

export class WaveSpeedVideoProvider implements VideoProvider {
  readonly name = 'wavespeed';

  getAvailableModels(): VideoModel[] {
    return WAVESPEED_VIDEO_MODELS;
  }

  async generateVideo(
    apiKey: string,
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult> {
    // The model ID should be in the format "owner/model" for WaveSpeed API
    // If it doesn't contain a slash, prefix with "wavespeed-ai/"
    const modelPath = request.model.includes('/')
      ? request.model
      : `wavespeed-ai/${request.model}`;

    const response = await fetch(`${WAVESPEED_API_BASE}/${modelPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: request.prompt,
        ...(request.aspectRatio && { aspect_ratio: request.aspectRatio }),
        ...(request.duration && { duration: request.duration }),
        ...(request.resolution && { resolution: request.resolution })
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        providerJobId: '',
        status: 'error',
        error: `WaveSpeed API error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();

    return {
      providerJobId: data.data.id,
      status: mapStatus(data.data.status)
    };
  }

  async getStatus(apiKey: string, providerJobId: string): Promise<VideoStatusResult> {
    const response = await fetch(
      `${WAVESPEED_API_BASE}/predictions/${providerJobId}/result`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        status: 'error',
        error: `WaveSpeed API error ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    const taskData = data.data;
    const status = mapStatus(taskData.status);

    const result: VideoStatusResult = {
      status
    };

    if (status === 'complete' && taskData.outputs && taskData.outputs.length > 0) {
      result.videoUrl = taskData.outputs[0];
    }

    if (status === 'error') {
      result.error = taskData.error || 'Unknown error';
    }

    return result;
  }

  async downloadVideo(apiKey: string, videoUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    return response.arrayBuffer();
  }
}
