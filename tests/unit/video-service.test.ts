import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Video Service Layer
 * Covers: VideoProvider interface, OpenAIVideoProvider, VideoRegistry
 */

describe('OpenAIVideoProvider', () => {
  let provider: any;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const { OpenAIVideoProvider } = await import(
      '../../src/lib/services/providers/openai-video'
    );
    provider = new OpenAIVideoProvider();
  });

  describe('name', () => {
    it('should have name "openai"', () => {
      expect(provider.name).toBe('openai');
    });
  });

  describe('getAvailableModels', () => {
    it('should return sora-2 and sora-2-pro models', () => {
      const models = provider.getAvailableModels();
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('sora-2');
      expect(models[0].displayName).toBe('Sora 2');
      expect(models[0].provider).toBe('openai');
      expect(models[1].id).toBe('sora-2-pro');
      expect(models[1].displayName).toBe('Sora 2 Pro');
      expect(models[1].provider).toBe('openai');
    });

    it('should include supported aspect ratios', () => {
      const models = provider.getAvailableModels();
      expect(models[0].supportedAspectRatios).toContain('16:9');
      expect(models[0].supportedAspectRatios).toContain('9:16');
      expect(models[0].supportedAspectRatios).toContain('1:1');
    });

    it('should include max duration', () => {
      const models = provider.getAvailableModels();
      expect(models[0].maxDuration).toBe(12);
    });
  });

  describe('generateVideo', () => {
    it('should return error when API call fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error'))
      );

      const result = await provider.generateVideo('test-key', {
        prompt: 'A sunset',
        model: 'sora-2'
      });

      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should return error on non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: vi.fn().mockResolvedValue({
            error: { message: 'Bad request' }
          })
        })
      );

      const result = await provider.generateVideo('test-key', {
        prompt: 'A sunset',
        model: 'sora-2'
      });

      expect(result.status).toBe('error');
      expect(result.error).toBe('Bad request');
    });

    it('should return complete when video is immediately available', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_abc123',
            object: 'video',
            status: 'completed',
            model: 'sora-2',
            progress: 100,
            seconds: '10',
            size: '1280x720'
          })
        })
      );

      const result = await provider.generateVideo('test-key', {
        prompt: 'A sunset',
        model: 'sora-2',
        aspectRatio: '16:9'
      });

      expect(result.status).toBe('complete');
      expect(result.videoUrl).toBe('https://api.openai.com/v1/videos/video_abc123/content');
      expect(result.providerJobId).toBe('video_abc123');
    });

    it('should return queued for newly created job', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_456',
            object: 'video',
            status: 'queued',
            model: 'sora-2',
            progress: 0,
            seconds: '10',
            size: '1280x720'
          })
        })
      );

      const result = await provider.generateVideo('test-key', {
        prompt: 'A sunset',
        model: 'sora-2'
      });

      expect(result.status).toBe('queued');
      expect(result.providerJobId).toBe('video_456');
    });

    it('should return processing for in-progress job', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_789',
            object: 'video',
            status: 'in_progress',
            model: 'sora-2',
            progress: 33,
            seconds: '10',
            size: '1280x720'
          })
        })
      );

      const result = await provider.generateVideo('test-key', {
        prompt: 'A sunset',
        model: 'sora-2'
      });

      expect(result.status).toBe('processing');
      expect(result.providerJobId).toBe('video_789');
    });

    it('should send correct aspect ratio for 9:16', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_789',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.generateVideo('test-key', {
        prompt: 'A vertical video',
        model: 'sora-2',
        aspectRatio: '9:16'
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.size).toBe('720x1280');
    });

    it('should send correct aspect ratio for 1:1', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_101',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.generateVideo('test-key', {
        prompt: 'A square video',
        model: 'sora-2',
        aspectRatio: '1:1'
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.size).toBe('1080x1080');
    });

    it('should default to 16:9 when no aspect ratio specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_102',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.generateVideo('test-key', {
        prompt: 'A default video',
        model: 'sora-2'
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.size).toBe('1280x720');
    });

    it('should send seconds field as a string instead of duration', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_103',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.generateVideo('test-key', {
        prompt: 'A timed video',
        model: 'sora-2',
        duration: 12
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.seconds).toBe('12');
      expect(callBody.duration).toBeUndefined();
      expect(callBody.n).toBeUndefined();
    });

    it('should POST to /v1/videos endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_104',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.generateVideo('test-key', {
        prompt: 'Test',
        model: 'sora-2'
      });

      expect(mockFetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/videos');
    });
  });

  describe('getStatus', () => {
    it('should return complete when video is ready', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_abc123',
            object: 'video',
            status: 'completed',
            model: 'sora-2',
            progress: 100,
            seconds: '10',
            size: '1280x720'
          })
        })
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('complete');
      expect(result.videoUrl).toBe('https://api.openai.com/v1/videos/video_abc123/content');
      expect(result.progress).toBe(100);
    });

    it('should return processing with actual progress', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_abc123',
            object: 'video',
            status: 'in_progress',
            model: 'sora-2',
            progress: 42,
            seconds: '10',
            size: '1280x720'
          })
        })
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('processing');
      expect(result.progress).toBe(42);
    });

    it('should return queued status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_abc123',
            object: 'video',
            status: 'queued',
            model: 'sora-2',
            progress: 0
          })
        })
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('queued');
      expect(result.progress).toBe(0);
    });

    it('should return error on failure', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: 'video_abc123',
            object: 'video',
            status: 'failed',
            model: 'sora-2'
          })
        })
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Video generation failed');
    });

    it('should return error on non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: vi.fn().mockResolvedValue({
            error: { message: 'Internal server error' }
          })
        })
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Internal server error');
    });

    it('should handle network errors in status check', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Connection timeout'))
      );

      const result = await provider.getStatus('test-key', 'video_abc123');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Connection timeout');
    });

    it('should call GET /v1/videos/{id} endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'video_abc123',
          object: 'video',
          status: 'queued',
          progress: 0
        })
      });
      vi.stubGlobal('fetch', mockFetch);

      await provider.getStatus('test-key', 'video_abc123');

      expect(mockFetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/videos/video_abc123');
    });
  });

  describe('downloadVideo', () => {
    it('should download video data', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
        })
      );

      const result = await provider.downloadVideo(
        'test-key',
        'https://example.com/video.mp4'
      );

      expect(result).toBe(mockArrayBuffer);
    });

    it('should throw on download failure', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404
        })
      );

      await expect(
        provider.downloadVideo('test-key', 'https://example.com/notfound.mp4')
      ).rejects.toThrow('Failed to download video: 404');
    });
  });
});

describe('Video Registry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVideoProvider', () => {
    it('should return openai provider', async () => {
      const { getVideoProvider } = await import(
        '../../src/lib/services/video-registry'
      );
      const provider = getVideoProvider('openai');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('openai');
    });

    it('should return null for unknown provider', async () => {
      const { getVideoProvider } = await import(
        '../../src/lib/services/video-registry'
      );
      const provider = getVideoProvider('unknown-provider');
      expect(provider).toBeNull();
    });
  });

  describe('getAllVideoModels', () => {
    it('should return all models from all providers', async () => {
      const { getAllVideoModels } = await import(
        '../../src/lib/services/video-registry'
      );
      const models = getAllVideoModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.id === 'sora-2')).toBe(true);
    });
  });

  describe('getEnabledVideoKey', () => {
    it('should return null when no keys exist', async () => {
      const { getEnabledVideoKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const mockPlatform = {
        env: {
          KV: {
            get: vi.fn().mockResolvedValue(null)
          }
        }
      } as any;

      const result = await getEnabledVideoKey(mockPlatform);
      expect(result).toBeNull();
    });

    it('should return first enabled video key', async () => {
      const { getEnabledVideoKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const mockPlatform = {
        env: {
          KV: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'ai_keys_list') return JSON.stringify(['key-1']);
              if (key === 'ai_key:key-1')
                return JSON.stringify({
                  id: 'key-1',
                  name: 'Test Key',
                  provider: 'openai',
                  apiKey: 'sk-test',
                  enabled: true,
                  videoEnabled: true
                });
              return null;
            })
          }
        }
      } as any;

      const result = await getEnabledVideoKey(mockPlatform);
      expect(result).toBeDefined();
      expect(result!.id).toBe('key-1');
      expect(result!.videoEnabled).toBe(true);
    });

    it('should skip disabled keys', async () => {
      const { getEnabledVideoKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const mockPlatform = {
        env: {
          KV: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'ai_keys_list') return JSON.stringify(['key-1']);
              if (key === 'ai_key:key-1')
                return JSON.stringify({
                  id: 'key-1',
                  provider: 'openai',
                  apiKey: 'sk-test',
                  enabled: false,
                  videoEnabled: true
                });
              return null;
            })
          }
        }
      } as any;

      const result = await getEnabledVideoKey(mockPlatform);
      expect(result).toBeNull();
    });

    it('should skip keys without video enabled', async () => {
      const { getEnabledVideoKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const mockPlatform = {
        env: {
          KV: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'ai_keys_list') return JSON.stringify(['key-1']);
              if (key === 'ai_key:key-1')
                return JSON.stringify({
                  id: 'key-1',
                  provider: 'openai',
                  apiKey: 'sk-test',
                  enabled: true,
                  videoEnabled: false
                });
              return null;
            })
          }
        }
      } as any;

      const result = await getEnabledVideoKey(mockPlatform);
      expect(result).toBeNull();
    });

    it('should filter by preferred provider', async () => {
      const { getEnabledVideoKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const mockPlatform = {
        env: {
          KV: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'ai_keys_list')
                return JSON.stringify(['key-1', 'key-2']);
              if (key === 'ai_key:key-1')
                return JSON.stringify({
                  id: 'key-1',
                  provider: 'openai',
                  apiKey: 'sk-test-1',
                  enabled: true,
                  videoEnabled: true
                });
              if (key === 'ai_key:key-2')
                return JSON.stringify({
                  id: 'key-2',
                  provider: 'other',
                  apiKey: 'sk-test-2',
                  enabled: true,
                  videoEnabled: true
                });
              return null;
            })
          }
        }
      } as any;

      const result = await getEnabledVideoKey(mockPlatform, 'other');
      expect(result).toBeDefined();
      expect(result!.id).toBe('key-2');
      expect(result!.provider).toBe('other');
    });
  });

  describe('getModelsForKey', () => {
    it('should return all models when no filter specified', async () => {
      const { getModelsForKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const models = getModelsForKey({
        id: 'key-1',
        name: 'Test',
        provider: 'openai',
        apiKey: 'test',
        enabled: true,
        videoEnabled: true
      });

      expect(models.length).toBeGreaterThan(0);
    });

    it('should filter to specific models when videoModels is set', async () => {
      const { getModelsForKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const models = getModelsForKey({
        id: 'key-1',
        name: 'Test',
        provider: 'openai',
        apiKey: 'test',
        enabled: true,
        videoEnabled: true,
        videoModels: ['sora-2']
      });

      expect(models.every((m) => m.id === 'sora-2')).toBe(true);
    });

    it('should return empty for unknown provider', async () => {
      const { getModelsForKey } = await import(
        '../../src/lib/services/video-registry'
      );

      const models = getModelsForKey({
        id: 'key-1',
        name: 'Test',
        provider: 'nonexistent',
        apiKey: 'test',
        enabled: true,
        videoEnabled: true
      });

      expect(models).toEqual([]);
    });
  });
});
