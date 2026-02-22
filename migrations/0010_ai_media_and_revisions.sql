-- Migration 0010: AI Media Generation, Activity Logging, and Revision Control
-- Adds AI generation tracking, comprehensive activity audit trail, and versioned
-- revision history for all brand media assets.

-- ─── AI Media Generations ────────────────────────────────────────────
-- Tracks AI generation jobs for images, audio, and video.
-- Links to brand_media once complete.
CREATE TABLE ai_media_generations (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    brand_media_id TEXT REFERENCES brand_media(id) ON DELETE SET NULL,

    -- Generation details
    generation_type TEXT NOT NULL CHECK(generation_type IN ('image', 'audio', 'video')),
    provider TEXT NOT NULL,              -- 'openai', 'wavespeed', etc.
    model TEXT NOT NULL,                 -- 'dall-e-3', 'tts-1', 'sora-2', etc.
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'complete', 'failed')),
    provider_job_id TEXT,                -- External provider job ID for polling
    result_url TEXT,                     -- URL of generated result
    r2_key TEXT,                         -- R2 storage key for cached result
    cost REAL,                           -- Cost in USD
    error_message TEXT,
    parameters TEXT,                     -- JSON: generation parameters (size, style, voice, etc.)
    progress INTEGER DEFAULT 0,          -- 0-100 progress percentage

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX idx_ai_generations_brand ON ai_media_generations(brand_profile_id);
CREATE INDEX idx_ai_generations_type ON ai_media_generations(brand_profile_id, generation_type);
CREATE INDEX idx_ai_generations_status ON ai_media_generations(status);
CREATE INDEX idx_ai_generations_media ON ai_media_generations(brand_media_id);


-- ─── Media Activity Log ──────────────────────────────────────────────
-- Comprehensive audit trail for all media asset operations.
-- Logs when content was added, modified, AI-generated, deleted, etc.
CREATE TABLE media_activity_log (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    brand_media_id TEXT REFERENCES brand_media(id) ON DELETE SET NULL,

    -- Who and what
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,                 -- 'created', 'uploaded', 'ai_generated', 'updated', 'replaced', 'deleted', etc.
    description TEXT NOT NULL,            -- Human-readable description

    -- Context
    details TEXT,                         -- JSON: snapshot of changed data
    source TEXT NOT NULL DEFAULT 'upload', -- 'upload', 'ai_generated', 'url_import'

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_activity_brand ON media_activity_log(brand_profile_id);
CREATE INDEX idx_media_activity_media ON media_activity_log(brand_media_id);
CREATE INDEX idx_media_activity_user ON media_activity_log(user_id);
CREATE INDEX idx_media_activity_action ON media_activity_log(action);
CREATE INDEX idx_media_activity_date ON media_activity_log(created_at);


-- ─── Media Revisions ────────────────────────────────────────────────
-- Full version history for media assets. Every change creates a new revision.
-- Enables rollback to any previous version.
CREATE TABLE media_revisions (
    id TEXT PRIMARY KEY,
    brand_media_id TEXT NOT NULL REFERENCES brand_media(id) ON DELETE CASCADE,

    -- Version info
    revision_number INTEGER NOT NULL,
    is_current INTEGER NOT NULL DEFAULT 0,

    -- File snapshot
    url TEXT,
    r2_key TEXT,
    mime_type TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,

    -- Provenance
    source TEXT NOT NULL DEFAULT 'upload', -- 'upload', 'ai_generated', 'url_import'
    user_id TEXT NOT NULL,
    change_note TEXT,
    metadata TEXT,                         -- JSON: any revision-specific data

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_revisions_media ON media_revisions(brand_media_id);
CREATE INDEX idx_media_revisions_current ON media_revisions(brand_media_id, is_current);
CREATE INDEX idx_media_revisions_number ON media_revisions(brand_media_id, revision_number);


-- ─── Add source tracking to existing brand_media ────────────────────
-- Track how each media asset was originally added.
ALTER TABLE brand_media ADD COLUMN source TEXT DEFAULT 'upload';
ALTER TABLE brand_media ADD COLUMN ai_generation_id TEXT REFERENCES ai_media_generations(id) ON DELETE SET NULL;
