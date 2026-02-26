-- Migration 0014: Brand Text Revision History
-- Adds version/revision tracking for brand text assets (brand_texts table).
-- Every text update creates a new revision, enabling full history and rollback.

CREATE TABLE brand_text_revisions (
    id TEXT PRIMARY KEY,
    brand_text_id TEXT NOT NULL REFERENCES brand_texts(id) ON DELETE CASCADE,

    -- Version info
    revision_number INTEGER NOT NULL,
    is_current INTEGER NOT NULL DEFAULT 0,

    -- Content snapshot
    value TEXT NOT NULL,
    label TEXT,

    -- Provenance
    change_source TEXT NOT NULL DEFAULT 'manual' CHECK(change_source IN ('manual', 'ai', 'import', 'revert')),
    user_id TEXT NOT NULL,
    change_note TEXT,

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_text_revisions_text ON brand_text_revisions(brand_text_id);
CREATE INDEX idx_text_revisions_current ON brand_text_revisions(brand_text_id, is_current);
CREATE INDEX idx_text_revisions_number ON brand_text_revisions(brand_text_id, revision_number);
