import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getAllEnabledVideoKeys, getModelsForKey } from '$lib/services/video-registry';

/**
 * GET /api/video/models
 * Get available video models from all configured providers, including pricing
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const videoKeys = await getAllEnabledVideoKeys(platform);
  if (videoKeys.length === 0) {
    return json({ models: [] });
  }

  // Collect models from all enabled providers (deduplicate by id)
  const seenModelIds = new Set<string>();
  const allModels: Array<Record<string, unknown>> = [];

  for (const key of videoKeys) {
    const models = getModelsForKey(key);
    for (const m of models) {
      if (!seenModelIds.has(m.id)) {
        seenModelIds.add(m.id);
        allModels.push({
          id: m.id,
          displayName: m.displayName,
          provider: m.provider,
          maxDuration: m.maxDuration,
          supportedAspectRatios: m.supportedAspectRatios,
          supportedResolutions: m.supportedResolutions,
          pricing: m.pricing || null
        });
      }
    }
  }

  return json({ models: allModels });
};
