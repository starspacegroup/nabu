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

			// Check if user has github_login set but no GitHub oauth_account record
			// This handles users who logged in via GitHub before the oauth_accounts feature
			const hasGitHubOAuth = connectedAccounts.some((acc) => acc.provider === 'github');
			if (!hasGitHubOAuth) {
				const userRecord = await platform.env.DB.prepare(
					'SELECT github_login FROM users WHERE id = ?'
				)
					.bind(locals.user.id)
					.first<{ github_login: string | null }>();

				if (userRecord?.github_login) {
					// User logged in via GitHub - add a virtual connection
					connectedAccounts.push({
						provider: 'github',
						provider_account_id: locals.user.id,
						created_at: ''
					});
				}
			}

			// Check if user ID indicates Discord login (discord_xxxxx format)
			const hasDiscordOAuth = connectedAccounts.some((acc) => acc.provider === 'discord');
			if (!hasDiscordOAuth && locals.user.id.startsWith('discord_')) {
				connectedAccounts.push({
					provider: 'discord',
					provider_account_id: locals.user.id.replace('discord_', ''),
					created_at: ''
				});
			}
		} catch (err) {
			console.error('Failed to fetch connected accounts:', err);
		}
	} else {
		// No DB available - infer from user ID and session data
		// Check for GitHub (numeric ID or has github_login in session)
		if (locals.user.login && !locals.user.id.startsWith('discord_')) {
			connectedAccounts.push({
				provider: 'github',
				provider_account_id: locals.user.id,
				created_at: ''
			});
		}
		// Check for Discord (ID starts with discord_)
		if (locals.user.id.startsWith('discord_')) {
			connectedAccounts.push({
				provider: 'discord',
				provider_account_id: locals.user.id.replace('discord_', ''),
				created_at: ''
			});
		}
	}

	return {
		user: locals.user,
		connectedAccounts
	};
};
