import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getEnabledVideoKey, getVideoProvider } from '$lib/services/video-registry';

/**
 * GET /api/video/[id]/stream
 * SSE endpoint for video generation progress updates
 */
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const generationId = params.id;

  // Get the generation record
  const generation = await platform.env.DB.prepare(
    `SELECT * FROM video_generations WHERE id = ? AND user_id = ?`
  )
    .bind(generationId, locals.user.id)
    .first<{
      id: string;
      provider: string;
      provider_job_id: string;
      status: string;
      video_url: string | null;
      message_id: string | null;
      conversation_id: string | null;
    }>();

  if (!generation) {
    throw error(404, 'Video generation not found');
  }

  // If already complete or errored, return immediately
  if (generation.status === 'complete' || generation.status === 'error') {
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: generation.status,
                videoUrl: generation.video_url,
                progress: generation.status === 'complete' ? 100 : 0
              })}\n\n`
            )
          );
          controller.close();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      }
    );
  }

  // Get the video key and provider for polling
  const videoKey = await getEnabledVideoKey(platform, generation.provider);
  if (!videoKey) {
    throw error(503, 'Video provider no longer available');
  }

  const provider = getVideoProvider(videoKey.provider);
  if (!provider) {
    throw error(503, 'Video provider not supported');
  }

  const encoder = new TextEncoder();
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes at 5-second intervals

      const poll = async () => {
        attempts++;
        if (attempts > maxAttempts) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: 'error',
                error: 'Video generation timed out'
              })}\n\n`
            )
          );
          if (pollInterval) clearInterval(pollInterval);
          controller.close();
          return;
        }

        try {
          const status = await provider.getStatus(
            videoKey.apiKey,
            generation.provider_job_id
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: status.status,
                progress: status.progress ?? 0,
                videoUrl: status.videoUrl ?? null,
                thumbnailUrl: status.thumbnailUrl ?? null,
                duration: status.duration ?? null,
                error: status.error ?? null
              })}\n\n`
            )
          );

          if (status.status === 'complete' || status.status === 'error') {
            if (pollInterval) clearInterval(pollInterval);

            // Update the generation record in D1
            try {
              if (status.status === 'complete') {
                await platform.env.DB.prepare(
                  `UPDATE video_generations
									 SET status = 'complete', video_url = ?, thumbnail_url = ?,
									     duration_seconds = ?, completed_at = datetime('now')
									 WHERE id = ?`
                )
                  .bind(
                    status.videoUrl || null,
                    status.thumbnailUrl || null,
                    status.duration || null,
                    generationId
                  )
                  .run();

                // Update the chat message media
                if (generation.message_id && generation.conversation_id) {
                  await platform.env.DB.prepare(
                    `UPDATE chat_messages
										 SET media_status = 'complete', media_url = ?,
										     media_thumbnail_url = ?, media_duration = ?
										 WHERE id = ? AND conversation_id = ?`
                  )
                    .bind(
                      status.videoUrl || null,
                      status.thumbnailUrl || null,
                      status.duration || null,
                      generation.message_id,
                      generation.conversation_id
                    )
                    .run();
                }

                // Optionally cache to R2
                if (status.videoUrl && platform.env.BUCKET) {
                  try {
                    const videoData = await provider.downloadVideo(
                      videoKey.apiKey,
                      status.videoUrl
                    );
                    const r2Key = `videos/${locals.user!.id}/${generationId}.mp4`;
                    await platform.env.BUCKET.put(r2Key, videoData, {
                      httpMetadata: { contentType: 'video/mp4' }
                    });

                    // Update with R2 key and set video_url to the R2 serving endpoint
                    const r2Url = `/api/video/file/${r2Key}`;
                    await platform.env.DB.prepare(
                      `UPDATE video_generations SET r2_key = ?, video_url = ? WHERE id = ?`
                    )
                      .bind(r2Key, r2Url, generationId)
                      .run();

                    if (generation.message_id) {
                      await platform.env.DB.prepare(
                        `UPDATE chat_messages SET media_r2_key = ?, media_url = ? WHERE id = ?`
                      )
                        .bind(r2Key, r2Url, generation.message_id)
                        .run();
                    }
                  } catch (r2Err) {
                    console.error('Failed to cache video to R2:', r2Err);
                  }
                }
              } else {
                await platform.env.DB.prepare(
                  `UPDATE video_generations SET status = 'error', error = ? WHERE id = ?`
                )
                  .bind(status.error || 'Unknown error', generationId)
                  .run();

                if (generation.message_id) {
                  await platform.env.DB.prepare(
                    `UPDATE chat_messages
										 SET media_status = 'error', media_error = ?
										 WHERE id = ?`
                  )
                    .bind(
                      status.error || 'Unknown error',
                      generation.message_id
                    )
                    .run();
                }
              }
            } catch (dbErr) {
              console.error('Failed to update generation record:', dbErr);
            }

            controller.close();
          }
        } catch (err) {
          console.error('Poll error:', err);
          // Don't close on transient errors, just report
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: 'processing',
                progress: 0,
                error: 'Temporary polling error'
              })}\n\n`
            )
          );
        }
      };

      // Initial poll immediately
      poll();
      // Then poll every 5 seconds
      pollInterval = setInterval(poll, 5000);
    },
    cancel() {
      if (pollInterval) clearInterval(pollInterval);
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
