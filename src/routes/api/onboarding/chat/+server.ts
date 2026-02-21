/**
 * POST /api/onboarding/chat - Send a message in the onboarding conversation
 * Streams AI response using SSE, persists both user and assistant messages
 */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  addOnboardingMessage,
  getBrandProfile,
  getOnboardingMessages,
  buildConversationContext,
  updateBrandProfile,
  getNextStep,
  STEP_COMPLETE_MARKER
} from '$lib/services/onboarding';
import { updateBrandFieldWithVersion } from '$lib/services/brand';
import {
  getEnabledOpenAIKey,
  streamChatCompletion
} from '$lib/services/openai-chat';
import { calculateCost, getModelDisplayName } from '$lib/utils/cost';
import type { OnboardingStep } from '$lib/types/onboarding';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json();
  const { profileId, message, step } = body;

  if (!profileId || !message || !step) {
    throw error(400, 'profileId, message, and step are required');
  }

  // Get the brand profile
  const profile = await getBrandProfile(platform!.env.DB, profileId);
  if (!profile) {
    throw error(404, 'Brand profile not found');
  }

  // Verify profile belongs to user
  if (profile.userId !== locals.user.id) {
    throw error(403, 'Forbidden');
  }

  // Get enabled AI key
  const aiKey = await getEnabledOpenAIKey(platform!);
  if (!aiKey) {
    throw error(503, 'No AI provider configured. Please configure an OpenAI API key.');
  }

  // Persist user message
  await addOnboardingMessage(platform!.env.DB, {
    brandProfileId: profileId,
    userId: locals.user.id,
    role: 'user',
    content: message,
    step: step as OnboardingStep
  });

  // Get all previous messages for context
  const previousMessages = await getOnboardingMessages(platform!.env.DB, profileId);

  // Build conversation context
  const conversationMessages = buildConversationContext(
    step as OnboardingStep,
    previousMessages,
    profile
  );

  // Stream AI response
  let fullContent = '';
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of streamChatCompletion(aiKey.apiKey, conversationMessages, {
          model: 'gpt-4o',
          temperature: 0.8,
          maxTokens: 1500
        })) {
          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
            const data = `data: ${JSON.stringify({ content: chunk.content })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } else if (chunk.type === 'usage' && chunk.usage) {
            const usedModel = chunk.model || 'gpt-4o';
            const costResult = calculateCost(
              usedModel,
              chunk.usage.promptTokens,
              chunk.usage.completionTokens
            );
            const usageData = `data: ${JSON.stringify({
              usage: {
                inputTokens: chunk.usage.promptTokens,
                outputTokens: chunk.usage.completionTokens,
                totalCost: costResult.totalCost,
                model: usedModel,
                displayName: getModelDisplayName(usedModel)
              }
            })}\n\n`;
            controller.enqueue(encoder.encode(usageData));
          }
        }

        // Check for step completion marker
        const shouldAdvance = fullContent.includes(STEP_COMPLETE_MARKER);
        const cleanContent = fullContent.replace(STEP_COMPLETE_MARKER, '').trimEnd();

        // Send step advance event before [DONE] so client can handle it
        if (shouldAdvance) {
          const nextStep = getNextStep(step as OnboardingStep);
          if (nextStep) {
            const advanceData = `data: ${JSON.stringify({ stepAdvance: nextStep })}\n\n`;
            controller.enqueue(encoder.encode(advanceData));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        // Persist assistant message with cleaned content (non-blocking)
        if (cleanContent && platform?.context) {
          platform.context.waitUntil(
            (async () => {
              await addOnboardingMessage(platform!.env.DB, {
                brandProfileId: profileId,
                userId: locals.user!.id,
                role: 'assistant',
                content: cleanContent,
                step: step as OnboardingStep
              });

              // Auto-advance to next step if marker was present
              if (shouldAdvance) {
                const nextStep = getNextStep(step as OnboardingStep);
                if (nextStep) {
                  await updateBrandProfile(platform!.env.DB, profileId, {
                    onboardingStep: nextStep
                  });
                }
              }
            })()
          );
        }
      } catch (err) {
        console.error('Onboarding chat stream error:', err);
        const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
};
