/**
 * OpenAI Chat Service
 * Handles streaming text chat and realtime voice chat with OpenAI API
 */

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string | ChatMessageContentPart[];
}

export interface ChatMessageContentPart {
	type: 'text' | 'image_url';
	text?: string;
	image_url?: {
		url: string;
		detail?: 'auto' | 'low' | 'high';
	};
}

export interface AIKey {
	id: string;
	name: string;
	provider: string;
	apiKey: string;
	enabled: boolean;
	// Text chat models enabled for this key
	models?: string[];
	// Legacy single model field (for backwards compatibility)
	model?: string;
	voiceEnabled?: boolean;
	// Voice models enabled for this key
	voiceModels?: string[];
	// Legacy single voice model field (for backwards compatibility)
	voiceModel?: string;
}

export interface RealtimeSessionResponse {
	token: string;
}

export interface StreamChunk {
	type: 'content' | 'usage' | 'status';
	content?: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	model?: string;
	status?: {
		message: string;
		keyName: string;
		keyId: string;
		model: string;
		attempt: number;
		totalKeys: number;
	};
}

/**
 * Get the first enabled OpenAI API key from KV storage
 */
export async function getEnabledOpenAIKey(platform: App.Platform): Promise<AIKey | null> {
	try {
		const keysList = await platform.env.KV.get('ai_keys_list');
		if (!keysList) {
			return null;
		}

		const keyIds = JSON.parse(keysList);

		for (const keyId of keyIds) {
			const keyData = await platform.env.KV.get(`ai_key:${keyId}`);
			if (keyData) {
				const key = JSON.parse(keyData) as AIKey;
				// Only return OpenAI keys that are enabled
				if (key.provider === 'openai' && key.enabled !== false) {
					return key;
				}
			}
		}

		return null;
	} catch (err) {
		console.error('Failed to get OpenAI key:', err);
		return null;
	}
}

/**
 * Get all enabled OpenAI API keys from KV storage, in admin-sorted priority order.
 */
export async function getAllEnabledOpenAIKeys(platform: App.Platform): Promise<AIKey[]> {
	try {
		const keysList = await platform.env.KV.get('ai_keys_list');
		if (!keysList) {
			return [];
		}

		const keyIds = JSON.parse(keysList);
		const keys: AIKey[] = [];

		for (const keyId of keyIds) {
			const keyData = await platform.env.KV.get(`ai_key:${keyId}`);
			if (keyData) {
				const key = JSON.parse(keyData) as AIKey;
				if (key.provider === 'openai' && key.enabled !== false) {
					keys.push(key);
				}
			}
		}

		return keys;
	} catch (err) {
		console.error('Failed to get OpenAI keys:', err);
		return [];
	}
}

/**
 * Non-streaming chat completion for quick extraction calls.
 * Uses JSON response format for structured output.
 * Returns the response content string.
 */
export async function chatCompletion(
	apiKey: string,
	messages: ChatMessage[],
	options: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
		jsonMode?: boolean;
	} = {}
): Promise<string> {
	const { model = 'gpt-4o-mini', temperature = 0.1, maxTokens = 1024, jsonMode = false } = options;

	const body: Record<string, unknown> = {
		model,
		messages,
		temperature,
		max_tokens: maxTokens
	};

	if (jsonMode) {
		body.response_format = { type: 'json_object' };
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const errorBody = await response.text().catch(() => '');
		let detail = response.statusText;
		try {
			const parsed = JSON.parse(errorBody);
			detail = parsed?.error?.message || detail;
		} catch { /* use statusText */ }
		throw new Error(`OpenAI API error (${response.status}): ${detail}`);
	}

	const json = await response.json() as {
		choices: Array<{ message: { content: string; }; }>;
	};

	return json.choices?.[0]?.message?.content || '';
}

/**
 * Stream chat completion from OpenAI API
 * Yields content chunks and finally a usage chunk with token counts
 */
export async function* streamChatCompletion(
	apiKey: string,
	messages: ChatMessage[],
	options: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
	} = {}
): AsyncGenerator<StreamChunk, void, unknown> {
	const { model = 'gpt-4o', temperature = 0.7, maxTokens = 2048 } = options;

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
			stream: true,
			stream_options: { include_usage: true }
		})
	});

	if (!response.ok) {
		const errorBody = await response.text().catch(() => '');
		let detail = response.statusText;
		try {
			const parsed = JSON.parse(errorBody);
			detail = parsed?.error?.message || detail;
		} catch { /* use statusText */ }
		if (response.status === 401) {
			throw new Error('Invalid or expired OpenAI API key. Check your API key configuration.');
		}
		if (response.status === 429) {
			throw new Error('OpenAI rate limit exceeded or insufficient quota. Please try again later.');
		}
		if (response.status === 404) {
			throw new Error(`Model not available: ${model}. Check your OpenAI plan supports this model.`);
		}
		throw new Error(`OpenAI API error (${response.status}): ${detail}`);
	}

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error('No response body');
	}

	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed === 'data: [DONE]') continue;
			if (!trimmed.startsWith('data: ')) continue;

			try {
				const json = JSON.parse(trimmed.slice(6));

				// Check for usage data (comes in the final chunk)
				if (json.usage) {
					yield {
						type: 'usage',
						usage: {
							promptTokens: json.usage.prompt_tokens,
							completionTokens: json.usage.completion_tokens,
							totalTokens: json.usage.total_tokens
						},
						model: json.model || model
					};
				}

				// Check for content delta
				const content = json.choices?.[0]?.delta?.content;
				if (content) {
					yield { type: 'content', content };
				}
			} catch (err) {
				console.error('Failed to parse SSE line:', trimmed, err);
			}
		}
	}
}

/**
 * Stream chat completion with fallback across multiple AI keys in priority order.
 * Tries each enabled key and emits status events so the client can show live progress.
 * Falls back to the next key if the current one fails.
 */
export async function* streamChatCompletionWithFallback(
	keys: AIKey[],
	messages: ChatMessage[],
	options: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
	} = {}
): AsyncGenerator<StreamChunk, void, unknown> {
	if (keys.length === 0) {
		throw new Error('No AI keys configured');
	}

	const model = options.model || 'gpt-4o';
	const errors: string[] = [];

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const attempt = i + 1;

		// Emit status: trying this key
		if (i === 0) {
			yield {
				type: 'status',
				status: {
					message: `Using ${key.name} (${model})`,
					keyName: key.name,
					keyId: key.id,
					model,
					attempt,
					totalKeys: keys.length
				}
			};
		} else {
			yield {
				type: 'status',
				status: {
					message: `${keys[i - 1].name} failed — trying ${key.name} (attempt ${attempt}/${keys.length})`,
					keyName: key.name,
					keyId: key.id,
					model,
					attempt,
					totalKeys: keys.length
				}
			};
		}

		try {
			for await (const chunk of streamChatCompletion(key.apiKey, messages, options)) {
				yield chunk;
			}
			// Success — we're done
			return;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			errors.push(`${key.name}: ${msg}`);
			console.error(`AI key "${key.name}" failed (attempt ${attempt}/${keys.length}):`, msg);
			// Continue to next key
		}
	}

	// All keys failed
	throw new Error(
		`All ${keys.length} AI key${keys.length > 1 ? 's' : ''} failed:\n${errors.join('\n')}`
	);
}

/**
 * Create ephemeral token for OpenAI Realtime API (voice chat)
 */
export async function createRealtimeSession(
	apiKey: string,
	model: string = 'gpt-4o-realtime-preview-2024-12-17'
): Promise<RealtimeSessionResponse> {
	console.log('Creating realtime session for model:', model);

	const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			voice: 'alloy'
		})
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => 'Unknown error');
		console.error('Failed to create realtime session:', response.status, errorText);
		throw new Error(`Failed to create realtime session: ${response.status} - ${errorText}`);
	}

	const data = await response.json();
	console.log('Realtime session API response keys:', Object.keys(data));
	console.log('Full response data:', JSON.stringify(data, null, 2));

	if (!data.client_secret?.value) {
		console.error('Invalid response from realtime sessions API:', data);
		throw new Error('Invalid response: missing client_secret');
	}

	console.log('Successfully got client_secret, length:', data.client_secret.value.length);
	console.log('Session ID:', data.id);
	console.log('Expires at:', data.client_secret.expires_at);

	return {
		token: data.client_secret.value
	};
}

/**
 * Format messages for OpenAI API
 * Supports multi-modal messages with image attachments
 */
export function formatMessagesForOpenAI(
	messages: Array<{
		id: string;
		role: string;
		content: string;
		timestamp: Date;
		attachments?: Array<{
			id: string;
			type: 'image' | 'video';
			name: string;
			url: string;
			mimeType: string;
			size?: number;
		}>;
	}>,
	options: { includeSystem?: boolean; } = {}
): ChatMessage[] {
	const { includeSystem = true } = options;

	return messages
		.filter((msg) => {
			if (!includeSystem && msg.role === 'system') {
				return false;
			}
			return msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system';
		})
		.map((msg) => {
			const role = msg.role as 'user' | 'assistant' | 'system';

			// Only user messages can have attachments
			const imageAttachments = (msg.attachments || []).filter((a) => a.type === 'image');
			const videoAttachments = (msg.attachments || []).filter((a) => a.type === 'video');

			// Build text with video notes if any
			let textContent = msg.content;
			if (videoAttachments.length > 0) {
				const videoNames = videoAttachments.map((v) => v.name).join(', ');
				textContent += `\n\n[Attached video${videoAttachments.length > 1 ? 's' : ''}: ${videoNames}]`;
			}

			// If no image attachments or not a user message, return plain text
			if (role !== 'user' || !imageAttachments.length) {
				return { role, content: textContent };
			}

			// Build multi-modal content array for messages with images
			const content: ChatMessageContentPart[] = [];
			content.push({ type: 'text', text: textContent });

			// Add image attachments as image_url parts
			for (const img of imageAttachments) {
				content.push({
					type: 'image_url',
					image_url: { url: img.url, detail: 'auto' }
				});
			}

			return { role, content };
		});
}
