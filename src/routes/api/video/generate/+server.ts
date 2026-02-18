import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getEnabledVideoKey, getVideoProvider } from '$lib/services/video-registry';

/**
 * POST /api/video/generate
 * Start a video generation job
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const body = await request.json();
  const {
    prompt,
    model,
    aspectRatio,
    duration,
    conversationId,
    messageId
  } = body as {
    prompt: string;
    model?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: number;
    conversationId?: string;
    messageId?: string;
  };

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw error(400, 'Prompt is required');
  }

  if (prompt.length > 4000) {
    throw error(400, 'Prompt too long (max 4000 characters)');
  }

  // Get an enabled video API key
  const videoKey = await getEnabledVideoKey(platform);
  if (!videoKey) {
    throw error(503, 'No video generation provider is currently available');
  }

  const provider = getVideoProvider(videoKey.provider);
  if (!provider) {
    throw error(503, `Video provider "${videoKey.provider}" is not supported`);
  }

  const selectedModel = model || provider.getAvailableModels()[0]?.id || 'sora-2';

  // Generate a generation ID for tracking
  const generationId = crypto.randomUUID();

  // Validate duration — OpenAI Sora accepts '4', '8', or '12' seconds
  const validDurations = [4, 8, 12];
  const videoDuration = duration && validDurations.includes(duration) ? duration : undefined;

  // Start video generation
  const result = await provider.generateVideo(videoKey.apiKey, {
    prompt: prompt.trim(),
    model: selectedModel,
    aspectRatio: aspectRatio || '16:9',
    duration: videoDuration
  });

  if (result.status === 'error') {
    // Store the failed generation record
    try {
      await platform.env.DB.prepare(
        `INSERT INTO video_generations (id, user_id, message_id, conversation_id, prompt, provider, model, status, error, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 'error', ?, datetime('now'))`
      )
        .bind(
          generationId,
          locals.user.id,
          messageId || null,
          conversationId || null,
          prompt.trim(),
          videoKey.provider,
          selectedModel,
          result.error || 'Unknown error'
        )
        .run();
    } catch {
      // Don't fail the request if DB logging fails
    }

    throw error(502, result.error || 'Video generation failed');
  }

  // Store the generation record
  // Map provider status to DB-allowed values: 'pending', 'generating', 'complete', 'error'
  const dbStatus = result.status === 'queued' ? 'pending'
    : result.status === 'processing' ? 'generating'
      : result.status === 'complete' ? 'complete'
        : 'pending';

  try {
    await platform.env.DB.prepare(
      `INSERT INTO video_generations (id, user_id, message_id, conversation_id, prompt, provider, provider_job_id, model, status, video_url, aspect_ratio, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        generationId,
        locals.user.id,
        messageId || null,
        conversationId || null,
        prompt.trim(),
        videoKey.provider,
        result.providerJobId,
        selectedModel,
        dbStatus,
        result.videoUrl || null,
        aspectRatio || '16:9'
      )
      .run();
  } catch (err) {
    console.error('Failed to store video generation record:', err);
  }

  // If video completed immediately, update the message with the URL
  if (result.status === 'complete' && result.videoUrl && messageId && conversationId) {
    try {
      await platform.env.DB.prepare(
        `UPDATE chat_messages
				 SET media_status = 'complete', media_url = ?, media_type = 'video'
				 WHERE id = ? AND conversation_id = ?`
      )
        .bind(result.videoUrl, messageId, conversationId)
        .run();
    } catch {
      // Non-critical
    }
  }

  return json({
    id: generationId,
    status: result.status,
    providerJobId: result.providerJobId,
    videoUrl: result.videoUrl || null,
    thumbnailUrl: result.thumbnailUrl || null
  });
};
