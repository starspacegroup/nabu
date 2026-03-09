import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	// Check if AI providers are enabled by reading KV directly
	// (avoids internal fetch that creates URL dependency tracking and HMR loops)
	let hasAIProviders = false;
	try {
		if (platform?.env?.KV) {
			const keysList = await platform.env.KV.get('ai_keys_list');
			if (keysList) {
				const keyIds = JSON.parse(keysList);
				for (const keyId of keyIds) {
					const keyData = await platform.env.KV.get(`ai_key:${keyId}`);
					if (keyData) {
						const key = JSON.parse(keyData);
						if (key.enabled !== false) {
							hasAIProviders = true;
							break;
						}
					}
				}
			}
		}
	} catch (error) {
		console.error('Failed to check AI provider status:', error);
	}

	return {
		user: locals.user || null,
		hasAIProviders
	};
};
