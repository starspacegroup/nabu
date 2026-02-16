-- Migration 0004: Server-side chat persistence
-- Adds conversations table and extends chat_messages for full persistence

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- Extend chat_messages with conversation support and cost tracking
ALTER TABLE chat_messages ADD COLUMN conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD COLUMN input_tokens INTEGER DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN output_tokens INTEGER DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN total_cost REAL DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN model TEXT;
ALTER TABLE chat_messages ADD COLUMN display_name TEXT;

-- Media attachment fields for video/image in chat messages
ALTER TABLE chat_messages ADD COLUMN media_type TEXT;
ALTER TABLE chat_messages ADD COLUMN media_url TEXT;
ALTER TABLE chat_messages ADD COLUMN media_thumbnail_url TEXT;
ALTER TABLE chat_messages ADD COLUMN media_status TEXT;
ALTER TABLE chat_messages ADD COLUMN media_r2_key TEXT;
ALTER TABLE chat_messages ADD COLUMN media_duration REAL;
ALTER TABLE chat_messages ADD COLUMN media_error TEXT;
ALTER TABLE chat_messages ADD COLUMN media_provider_job_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
