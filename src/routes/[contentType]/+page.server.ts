/**
 * Dynamic CMS Content Type List Page - Server Load
 *
 * Handles /{contentType} routes (e.g., /blog, /faq, /kb).
 * Only matches registered content types to avoid conflicts with other routes.
 */
import { isRegisteredContentType } from '$lib/cms/registry';
import type { ContentItemFilters } from '$lib/cms/types';
import { getContentTypeBySlug, listContentItems, syncContentTypes } from '$lib/services/cms';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, url }) => {
	const typeSlug = params.contentType;

	// Only handle registered content types
	if (!isRegisteredContentType(typeSlug)) {
		throw error(404, 'Not found');
	}

	const db = platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database not available');
	}

	// Ensure content types are synced
	await syncContentTypes(db);

	const contentType = await getContentTypeBySlug(db, typeSlug);
	if (!contentType) {
		throw error(404, 'Content type not found');
	}

	// Parse query params
	const filters: ContentItemFilters = {
		status: 'published', // Public routes only show published items
		search: url.searchParams.get('search') || undefined,
		tagSlug: url.searchParams.get('tag') || undefined,
		page: parseInt(url.searchParams.get('page') || '1'),
		pageSize: contentType.settings.listPageSize || 12,
		sortBy: contentType.settings.defaultSort || 'published_at',
		sortDirection: contentType.settings.defaultSortDirection || 'desc'
	};

	const result = await listContentItems(db, contentType.id, filters);

	return {
		contentType,
		...result
	};
};
