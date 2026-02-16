import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getEnabledVideoKey, getModelsForKey } from '$lib/services/video-registry';

/**
 * GET /api/video/models
 * Get available video models based on configured providers
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const videoKey = await getEnabledVideoKey(platform);
  if (!videoKey) {
    return json({ models: [] });
  }

  const models = getModelsForKey(videoKey);

  return json({
    models: models.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      provider: m.provider,
      maxDuration: m.maxDuration,
      supportedAspectRatios: m.supportedAspectRatios,
      supportedResolutions: m.supportedResolutions
    }))
  });
};
