-- Migration 0009: Brand Asset Management System
-- Comprehensive text/image/audio/video storage organized per brand.
-- Videos are linked to brands. Logos support all shapes and sizes via variants.

-- ─── Brand Text Assets ───────────────────────────────────────────────
-- Flexible key-value text entries for any brand copy.
-- Categories: names, messaging, descriptions, legal, social, voice
CREATE TABLE brand_texts (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,

    -- Classification
    category TEXT NOT NULL,          -- 'names' | 'messaging' | 'descriptions' | 'legal' | 'social' | 'voice'
    key TEXT NOT NULL,               -- Unique key within category, e.g. 'primary_name', 'tagline'
    label TEXT NOT NULL,             -- Human-readable label shown in UI

    -- Content
    value TEXT NOT NULL,             -- The actual text content
    language TEXT NOT NULL DEFAULT 'en',

    -- Organization
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,                   -- JSON: extra context (character limits, usage notes, etc.)

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    UNIQUE(brand_profile_id, category, key, language)
);

CREATE INDEX idx_brand_texts_brand ON brand_texts(brand_profile_id);
CREATE INDEX idx_brand_texts_category ON brand_texts(brand_profile_id, category);


-- ─── Brand Media Assets ─────────────────────────────────────────────
-- Universal table for images, audio, and video binary assets.
-- Image categories: logo, social, marketing, product, brand_elements, team
-- Audio categories: sonic_identity, music, voiceover
-- Video categories: brand, social, marketing, content, internal
CREATE TABLE brand_media (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,

    -- Classification
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'audio', 'video')),
    category TEXT NOT NULL,          -- Type-specific category (see above)
    name TEXT NOT NULL,              -- Human-readable name
    description TEXT,

    -- Storage
    url TEXT,                        -- Public URL (R2 or external)
    r2_key TEXT,                     -- R2 object key for direct access
    mime_type TEXT,
    file_size INTEGER,               -- Bytes

    -- Dimensions (images & video)
    width INTEGER,
    height INTEGER,

    -- Duration (audio & video)
    duration_seconds REAL,

    -- Organization
    tags TEXT,                       -- JSON array for flexible tagging
    metadata TEXT,                   -- JSON: aspect_ratio, color_profile, codec, bitrate, etc.
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,  -- Primary asset within its category

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_brand_media_brand ON brand_media(brand_profile_id);
CREATE INDEX idx_brand_media_type ON brand_media(brand_profile_id, media_type);
CREATE INDEX idx_brand_media_category ON brand_media(brand_profile_id, media_type, category);
CREATE INDEX idx_brand_media_primary ON brand_media(brand_profile_id, media_type, category, is_primary);


-- ─── Media Variants ─────────────────────────────────────────────────
-- Size, format, and color variants of a media asset.
-- Essential for logos: favicon (16x16), app icon (512x512), social (1200x630),
-- monochrome, reversed, dark background, light background, etc.
CREATE TABLE brand_media_variants (
    id TEXT PRIMARY KEY,
    brand_media_id TEXT NOT NULL REFERENCES brand_media(id) ON DELETE CASCADE,

    -- Variant classification
    variant_type TEXT NOT NULL,      -- 'size' | 'format' | 'color_mode' | 'background' | 'platform'
    label TEXT NOT NULL,             -- '16x16', 'svg', 'monochrome', 'dark_bg', 'twitter_header', etc.

    -- Storage
    url TEXT,
    r2_key TEXT,
    mime_type TEXT,
    file_size INTEGER,

    -- Dimensions (for size variants)
    width INTEGER,
    height INTEGER,

    metadata TEXT,                   -- JSON: any variant-specific data

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_brand_media_variants_media ON brand_media_variants(brand_media_id);
CREATE INDEX idx_brand_media_variants_type ON brand_media_variants(brand_media_id, variant_type);


-- ─── Link Videos to Brands ──────────────────────────────────────────
-- Associate video generations and schedules with a brand.
-- Nullable for backward compatibility with existing videos.
ALTER TABLE video_generations ADD COLUMN brand_profile_id TEXT REFERENCES brand_profiles(id) ON DELETE SET NULL;
ALTER TABLE video_schedules ADD COLUMN brand_profile_id TEXT REFERENCES brand_profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_video_generations_brand ON video_generations(brand_profile_id);
CREATE INDEX idx_video_schedules_brand ON video_schedules(brand_profile_id);
