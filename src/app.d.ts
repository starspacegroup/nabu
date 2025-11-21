// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				email: string;
				name?: string;
			};
		}
		interface Platform {
			env: {
				DB: D1Database;
				KV: KVNamespace;
				BUCKET: R2Bucket;
				QUEUE: Queue;
				TURNSTILE_SECRET_KEY: string;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
