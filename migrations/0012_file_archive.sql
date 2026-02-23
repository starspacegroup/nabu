-- File Archive: stores all files exchanged with AI (user uploads + AI-generated outputs)
-- Organized by brand, context (onboarding step / chat), and type

CREATE TABLE file_archive (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  brand_profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,

  -- Classification
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  source TEXT NOT NULL CHECK (source IN ('user_upload', 'ai_generated', 'ai_referenced')),
  context TEXT NOT NULL DEFAULT 'chat' CHECK (context IN ('onboarding', 'chat', 'brand_assets')),

  -- Linking to conversations/messages
  conversation_id TEXT,
  message_id TEXT,
  onboarding_step TEXT,

  -- AI generation metadata (for AI-produced files)
  ai_prompt TEXT,
  ai_model TEXT,
  ai_generation_id TEXT,

  -- Organization
  folder TEXT DEFAULT '/',         -- virtual folder path for smart organization
  tags TEXT DEFAULT '[]',          -- JSON array of tags
  description TEXT,
  is_starred INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX idx_file_archive_brand ON file_archive(brand_profile_id);
CREATE INDEX idx_file_archive_user ON file_archive(user_id);
CREATE INDEX idx_file_archive_type ON file_archive(file_type);
CREATE INDEX idx_file_archive_source ON file_archive(source);
CREATE INDEX idx_file_archive_context ON file_archive(context);
CREATE INDEX idx_file_archive_folder ON file_archive(folder);
CREATE INDEX idx_file_archive_conversation ON file_archive(conversation_id);
CREATE INDEX idx_file_archive_created ON file_archive(created_at);

-- Add attachments column to onboarding messages
ALTER TABLE onboarding_messages ADD COLUMN attachments TEXT DEFAULT NULL;
