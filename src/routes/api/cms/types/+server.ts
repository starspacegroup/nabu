/**
 * CMS Content Types API
 *
 * GET /api/cms/types - List all content types (syncs registry first)
 */
import { getContentTypes, syncContentTypes } from '$lib/services/cms';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.user.isOwner && !locals.user.isAdmin) {
		throw error(403, 'Forbidden');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	try {
		// Sync registry to DB (safe to call repeatedly)
		await syncContentTypes(db);

		// Return all types
		const types = await getContentTypes(db);
		return json({ types });
	} catch (err: any) {
		if (err?.status) throw err;
		console.error('Failed to fetch content types:', err);
		throw error(500, 'Failed to fetch content types');
	}
};
