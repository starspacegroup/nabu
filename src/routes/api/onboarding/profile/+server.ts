/**
 * GET /api/onboarding/profile - Get current user's brand profile
 * POST /api/onboarding/profile - Create a new brand profile
 * PATCH /api/onboarding/profile - Update brand profile
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  createBrandProfile,
  getBrandProfile,
  getBrandProfileByUser,
  updateBrandProfile
} from '$lib/services/onboarding';

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const profile = await getBrandProfileByUser(platform!.env.DB, locals.user.id);
  return json({ profile });
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const profile = await createBrandProfile(platform!.env.DB, locals.user.id);
  return json({ profile });
};

export const PATCH: RequestHandler = async ({ locals, platform, request }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json();
  const { profileId, updates } = body;

  if (!profileId || !updates) {
    throw error(400, 'profileId and updates are required');
  }

  await updateBrandProfile(platform!.env.DB, profileId, updates);
  const profile = await getBrandProfile(platform!.env.DB, profileId);

  return json({ profile });
};
