/**
 * DELETE /api/brand/profile/[id] - Archive (soft-delete) a brand profile
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBrandProfile, archiveBrandProfile } from '$lib/services/onboarding';

export const DELETE: RequestHandler = async ({ locals, platform, params }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;

  // Verify profile exists and belongs to user
  const profile = await getBrandProfile(platform!.env.DB, id);
  if (!profile) {
    throw error(404, 'Profile not found');
  }
  if (profile.userId !== locals.user.id) {
    throw error(403, 'Forbidden');
  }

  await archiveBrandProfile(platform!.env.DB, id);

  return json({ success: true });
};
