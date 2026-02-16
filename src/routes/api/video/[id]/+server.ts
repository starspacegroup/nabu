import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

/**
 * GET /api/video/[id]
 * Get the status of a specific video generation
 */
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const generation = await platform.env.DB.prepare(
    `SELECT id, prompt, provider, model, status, video_url, thumbnail_url,
		        r2_key, duration_seconds, aspect_ratio, resolution, cost,
		        error, created_at, completed_at
		 FROM video_generations
		 WHERE id = ? AND user_id = ?`
  )
    .bind(params.id, locals.user.id)
    .first();

  if (!generation) {
    throw error(404, 'Video generation not found');
  }

  return json({
    id: generation.id,
    prompt: generation.prompt,
    provider: generation.provider,
    model: generation.model,
    status: generation.status,
    videoUrl: generation.video_url,
    thumbnailUrl: generation.thumbnail_url,
    r2Key: generation.r2_key,
    duration: generation.duration_seconds,
    aspectRatio: generation.aspect_ratio,
    resolution: generation.resolution,
    cost: generation.cost,
    error: generation.error,
    createdAt: generation.created_at,
    completedAt: generation.completed_at
  });
};
