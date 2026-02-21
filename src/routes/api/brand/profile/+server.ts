/**
 * GET /api/brand/profile - Get current user's brand profile with field summaries
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBrandProfileByUser } from '$lib/services/onboarding';
import { getBrandFieldsSummary } from '$lib/services/brand';

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const profile = await getBrandProfileByUser(platform!.env.DB, locals.user.id);

  if (!profile) {
    return json({ profile: null, sections: [] });
  }

  const sections = getBrandFieldsSummary(profile);

  return json({ profile, sections });
};
