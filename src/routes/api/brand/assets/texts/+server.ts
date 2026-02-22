import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import {
  createBrandText,
  getBrandTexts,
  getBrandTextsByCategory,
  updateBrandText,
  deleteBrandText
} from '$lib/services/brand-assets';

/**
 * GET /api/brand/assets/texts
 * List text assets for a brand profile
 */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!platform?.env?.DB) throw error(500, 'Platform not available');

  const brandProfileId = url.searchParams.get('brandProfileId');
  if (!brandProfileId) throw error(400, 'brandProfileId required');

  const category = url.searchParams.get('category');

  const texts = category
    ? await getBrandTextsByCategory(platform.env.DB, brandProfileId, category)
    : await getBrandTexts(platform.env.DB, brandProfileId);

  return json({ texts });
};

/**
 * POST /api/brand/assets/texts
 * Create a text asset
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!platform?.env?.DB) throw error(500, 'Platform not available');

  const body = await request.json();
  const { brandProfileId, category, key, label, value, language } = body;

  if (!brandProfileId || !category || !key || !label || !value) {
    throw error(400, 'Missing required fields');
  }

  const text = await createBrandText(platform.env.DB, {
    brandProfileId,
    category,
    key,
    label,
    value,
    language
  });

  return json({ text }, { status: 201 });
};

/**
 * PATCH /api/brand/assets/texts
 * Update a text asset
 */
export const PATCH: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!platform?.env?.DB) throw error(500, 'Platform not available');

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) throw error(400, 'id required');

  await updateBrandText(platform.env.DB, id, updates);
  return json({ success: true });
};

/**
 * DELETE /api/brand/assets/texts
 * Delete a text asset
 */
export const DELETE: RequestHandler = async ({ url, platform, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!platform?.env?.DB) throw error(500, 'Platform not available');

  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id required');

  await deleteBrandText(platform.env.DB, id);
  return json({ success: true });
};
