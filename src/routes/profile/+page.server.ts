import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

interface OAuthAccount {
	provider: string;
	provider_account_id: string;
	created_at: string;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	// Fetch connected accounts from database
	let connectedAccounts: OAuthAccount[] = [];

	if (platform?.env?.DB) {
		try {
			const result = await platform.env.DB.prepare(
				'SELECT provider, provider_account_id, created_at FROM oauth_accounts WHERE user_id = ?'
			)
				.bind(locals.user.id)
				.all<OAuthAccount>();

			if (result.results) {
				connectedAccounts = result.results;
			}

			// Note: We no longer infer connections from user ID or github_login
			// The oauth_accounts table is the source of truth for connected accounts.
			// When users log in via OAuth, an oauth_accounts record is created.
		} catch (err) {
			console.error('Failed to fetch connected accounts:', err);
		}
	} else {
		// No DB available - cannot determine connected accounts without database
		// In production, DB should always be available
		console.warn('Database not available for fetching connected accounts');
	}

	return {
		user: locals.user,
		connectedAccounts
	};
};
