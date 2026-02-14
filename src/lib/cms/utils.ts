/**
 * CMS Utility Functions
 *
 * Helper functions for content management operations.
 */

import type {
	ContentFieldDefinition,
	ContentItem,
	ContentItemParsed,
	ContentTag,
	ContentTagParsed,
	ContentType,
	ContentTypeParsed,
	ContentTypeSettings
} from './types';

/**
 * Generate a URL-friendly slug from a title string.
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Collapse multiple hyphens
		.replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Parse a content type from D1 row format to runtime format.
 */
export function parseContentType(row: ContentType): ContentTypeParsed {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		description: row.description,
		fields: JSON.parse(row.fields) as ContentFieldDefinition[],
		settings: JSON.parse(row.settings) as ContentTypeSettings,
		icon: row.icon,
		sortOrder: row.sort_order,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

/**
 * Parse a content item from D1 row format to runtime format.
 */
export function parseContentItem(row: ContentItem): ContentItemParsed {
	return {
		id: row.id,
		contentTypeId: row.content_type_id,
		slug: row.slug,
		title: row.title,
		status: row.status,
		fields: JSON.parse(row.fields) as Record<string, unknown>,
		seoTitle: row.seo_title,
		seoDescription: row.seo_description,
		seoImage: row.seo_image,
		authorId: row.author_id,
		publishedAt: row.published_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

/**
 * Parse a content tag from D1 row format to runtime format.
 */
export function parseContentTag(row: ContentTag): ContentTagParsed {
	return {
		id: row.id,
		contentTypeId: row.content_type_id,
		name: row.name,
		slug: row.slug,
		createdAt: row.created_at
	};
}

/**
 * Validate field values against field definitions.
 * Returns an array of error messages (empty = valid).
 */
export function validateFields(
	fields: Record<string, unknown>,
	definitions: ContentFieldDefinition[]
): string[] {
	const errors: string[] = [];

	for (const def of definitions) {
		const value = fields[def.name];

		// Check required
		if (def.required && (value === undefined || value === null || value === '')) {
			errors.push(`${def.label} is required`);
			continue;
		}

		// Skip validation for empty optional fields
		if (value === undefined || value === null || value === '') {
			continue;
		}

		// Type-specific validation
		if (def.validation) {
			if (def.type === 'number') {
				const num = Number(value);
				if (isNaN(num)) {
					errors.push(`${def.label} must be a number`);
				} else {
					if (def.validation.min !== undefined && num < def.validation.min) {
						errors.push(`${def.label} must be at least ${def.validation.min}`);
					}
					if (def.validation.max !== undefined && num > def.validation.max) {
						errors.push(`${def.label} must be at most ${def.validation.max}`);
					}
				}
			}

			if (def.type === 'text' || def.type === 'textarea' || def.type === 'richtext') {
				const str = String(value);
				if (def.validation.minLength !== undefined && str.length < def.validation.minLength) {
					errors.push(`${def.label} must be at least ${def.validation.minLength} characters`);
				}
				if (def.validation.maxLength !== undefined && str.length > def.validation.maxLength) {
					errors.push(`${def.label} must be at most ${def.validation.maxLength} characters`);
				}
				if (def.validation.pattern) {
					const regex = new RegExp(def.validation.pattern);
					if (!regex.test(str)) {
						errors.push(def.validation.message || `${def.label} has an invalid format`);
					}
				}
			}
		}

		// Select validation
		if (def.type === 'select' && def.options) {
			const validValues = def.options.map((o) => o.value);
			if (!validValues.includes(String(value))) {
				errors.push(`${def.label} has an invalid selection`);
			}
		}

		// Multiselect validation
		if (def.type === 'multiselect' && def.options) {
			const validValues = def.options.map((o) => o.value);
			if (Array.isArray(value)) {
				for (const v of value) {
					if (!validValues.includes(String(v))) {
						errors.push(`${def.label} contains an invalid selection: ${v}`);
					}
				}
			}
		}

		// URL validation
		if (def.type === 'url' && value) {
			try {
				new URL(String(value));
			} catch {
				errors.push(`${def.label} must be a valid URL`);
			}
		}

		// Email validation
		if (def.type === 'email' && value) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(String(value))) {
				errors.push(`${def.label} must be a valid email address`);
			}
		}
	}

	return errors;
}

/**
 * Get default field values from field definitions.
 */
export function getDefaultFieldValues(
	definitions: ContentFieldDefinition[]
): Record<string, unknown> {
	const defaults: Record<string, unknown> = {};
	for (const def of definitions) {
		if (def.defaultValue !== undefined) {
			defaults[def.name] = def.defaultValue;
		}
	}
	return defaults;
}
