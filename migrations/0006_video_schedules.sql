-- Migration 0006: Video schedules table
-- Allows users to configure recurring video generation jobs

CREATE TABLE IF NOT EXISTS video_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL DEFAULT 'sora',
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  total_runs INTEGER NOT NULL DEFAULT 0,
  max_runs INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_video_schedules_user_id ON video_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_video_schedules_enabled ON video_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_video_schedules_next_run_at ON video_schedules(next_run_at);
