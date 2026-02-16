-- Migration 0005: Video generations table
-- Tracks video generation jobs and their results

CREATE TABLE IF NOT EXISTS video_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT,
  conversation_id TEXT,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_job_id TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'complete', 'error')),
  video_url TEXT,
  thumbnail_url TEXT,
  r2_key TEXT,
  duration_seconds REAL,
  aspect_ratio TEXT DEFAULT '16:9',
  resolution TEXT,
  cost REAL DEFAULT 0,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON video_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_video_generations_conversation_id ON video_generations(conversation_id);
