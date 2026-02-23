import {
	formatMessagesForOpenAI,
	getEnabledOpenAIKey,
	streamChatCompletion
} from '$lib/services/openai-chat';
import { calculateCost, getModelDisplayName } from '$lib/utils/cost';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

/**
 * Persist a message to D1 (non-blocking via waitUntil)
 */
async function persistMessage(
	db: any,
	messageData: {
		id: string;
		userId: string;
		conversationId: string;
		role: string;
		content: string;
		inputTokens?: number;
		outputTokens?: number;
		totalCost?: number;
		model?: string;
		displayName?: string;
	}
) {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO chat_messages (
			id, user_id, conversation_id, role, content, created_at,
			input_tokens, output_tokens, total_cost, model, display_name
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			messageData.id,
			messageData.userId,
			messageData.conversationId,
			messageData.role,
			messageData.content,
			now,
			messageData.inputTokens || 0,
			messageData.outputTokens || 0,
			messageData.totalCost || 0,
			messageData.model || null,
			messageData.displayName || null
		)
		.run();

	// Update conversation timestamp
	await db
		.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
		.bind(now, messageData.conversationId)
		.run();
}

/**
 * POST /api/chat/stream
 * Stream chat responses from OpenAI and persist to D1
 */
export async function POST({ request, platform, locals }: RequestEvent) {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Parse request body
		const body = await request.json();
		const { messages, model: requestedModel, conversationId, userMessageId, attachments } = body;

		// Validate messages
		if (!Array.isArray(messages) || messages.length === 0) {
			throw error(400, 'Invalid messages format');
		}

		if (!conversationId) {
			throw error(400, 'conversationId is required');
		}

		// Get enabled OpenAI key
		const aiKey = await getEnabledOpenAIKey(platform!);
		if (!aiKey) {
			throw error(503, 'No OpenAI API key configured');
		}

		// Use requested model or default to gpt-4o
		const model = requestedModel || 'gpt-4o';

		// Format messages for OpenAI
		const formattedMessages = formatMessagesForOpenAI(messages);

		// Generate IDs for persistence
		const assistantMessageId = crypto.randomUUID();

		// Create a ReadableStream for Server-Sent Events
		let fullAssistantContent = '';
		let finalUsage: {
			inputTokens: number;
			outputTokens: number;
			totalCost: number;
			model: string;
			displayName: string;
		} | null = null;

		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();

				try {
					// Send the assistant message ID so client can track it
					const metaData = `data: ${JSON.stringify({ meta: { assistantMessageId } })}\n\n`;
					controller.enqueue(encoder.encode(metaData));

					// Stream chat completion with selected model
					for await (const chunk of streamChatCompletion(aiKey.apiKey, formattedMessages, {
						model
					})) {
						if (chunk.type === 'content' && chunk.content) {
							fullAssistantContent += chunk.content;
							// Send content as SSE
							const data = `data: ${JSON.stringify({ content: chunk.content })}\n\n`;
							controller.enqueue(encoder.encode(data));
						} else if (chunk.type === 'usage' && chunk.usage) {
							// Calculate cost and send usage data
							const usedModel = chunk.model || 'gpt-4o';
							const costResult = calculateCost(
								usedModel,
								chunk.usage.promptTokens,
								chunk.usage.completionTokens
							);

							finalUsage = {
								inputTokens: chunk.usage.promptTokens,
								outputTokens: chunk.usage.completionTokens,
								totalCost: costResult.totalCost,
								model: usedModel,
								displayName: getModelDisplayName(usedModel)
							};

							const usageData = `data: ${JSON.stringify({ usage: finalUsage })}\n\n`;
							controller.enqueue(encoder.encode(usageData));
						}
					}

					// Send done signal
					controller.enqueue(encoder.encode('data: [DONE]\n\n'));

					// Persist assistant message to D1 (non-blocking)
					if (fullAssistantContent && platform?.context) {
						platform.context.waitUntil(
							persistMessage(platform.env.DB, {
								id: assistantMessageId,
								userId: locals.user!.id,
								conversationId,
								role: 'assistant',
								content: fullAssistantContent,
								inputTokens: finalUsage?.inputTokens,
								outputTokens: finalUsage?.outputTokens,
								totalCost: finalUsage?.totalCost,
								model: finalUsage?.model,
								displayName: finalUsage?.displayName
							})
						);
					}
				} catch (err) {
					console.error('Streaming error:', err);
					const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
					controller.enqueue(encoder.encode(errorData));
				} finally {
					controller.close();
				}
			}
		});

		// Return streaming response
		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (err: any) {
		console.error('Chat stream error:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to stream chat response');
	}
}
