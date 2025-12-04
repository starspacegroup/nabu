import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Auth handling hook
const authHandler: Handle = async ({ event, resolve }) => {
	// Get session cookie
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		// In production, fetch session from D1 or KV
		// For now, decode the session from the cookie
		try {
			// Handle both standard base64 and URL-safe base64
			// URL-safe uses - instead of +, _ instead of /, and no padding
			let base64 = sessionId;

			// Only apply URL-safe decoding if the string contains URL-safe characters
			if (base64.includes('-') || base64.includes('_')) {
				base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
			}

			// Add padding if needed (for both standard and URL-safe base64)
			while (base64.length % 4) {
				base64 += '=';
			}

			const decoded = atob(base64);
			const sessionData = JSON.parse(decoded);

			// Check if user is admin from database (optional - don't fail auth if DB unavailable)
			if (event.platform?.env?.DB) {
				try {
					const userRecord = await event.platform.env.DB.prepare(
						'SELECT is_admin FROM users WHERE id = ?'
					)
						.bind(sessionData.id)
						.first<{ is_admin: number }>();

					if (userRecord) {
						sessionData.isAdmin = userRecord.is_admin === 1;
					}
				} catch {
					// Database error - continue with session data from cookie
				}
			}

			event.locals.user = sessionData;
		} catch {
			// Invalid session, clear cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	return resolve(event);
};

// Combine all hooks
export const handle = sequence(authHandler);
