-- Migration 0008: Brand Field Version Control
-- Tracks every change to brand profile fields with full history

-- Version history for brand profile fields
CREATE TABLE brand_field_versions (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    field_name TEXT NOT NULL,            -- e.g., 'brand_name', 'tagline', 'mission_statement'
    old_value TEXT,                       -- Previous value (NULL for first set)
    new_value TEXT,                       -- New value
    change_source TEXT NOT NULL DEFAULT 'manual' CHECK(change_source IN ('manual', 'ai', 'import')),
    change_reason TEXT,                  -- Optional reason/note for the change
    version_number INTEGER NOT NULL,     -- Auto-incrementing per field per profile
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient lookups
CREATE INDEX idx_brand_field_versions_profile ON brand_field_versions(brand_profile_id);
CREATE INDEX idx_brand_field_versions_field ON brand_field_versions(brand_profile_id, field_name);
CREATE INDEX idx_brand_field_versions_version ON brand_field_versions(brand_profile_id, field_name, version_number);
