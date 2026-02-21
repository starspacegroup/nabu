-- Migration 0007: Brand Onboarding
-- Stores the conversational AI-driven brand building process

-- Brand profiles built through the onboarding wizard
CREATE TABLE brand_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'archived')),
    
    -- Brand identity basics
    brand_name TEXT,
    tagline TEXT,
    mission_statement TEXT,
    vision_statement TEXT,
    elevator_pitch TEXT,
    
    -- Brand personality & psychology
    brand_archetype TEXT,              -- e.g., 'hero', 'sage', 'explorer', etc.
    brand_personality_traits TEXT,     -- JSON array of traits
    tone_of_voice TEXT,               -- e.g., 'professional', 'playful', 'authoritative'
    communication_style TEXT,         -- e.g., 'formal', 'casual', 'conversational'
    
    -- Target audience
    target_audience TEXT,             -- JSON: demographics, psychographics
    customer_pain_points TEXT,        -- JSON array
    value_proposition TEXT,
    
    -- Visual identity
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    color_palette TEXT,               -- JSON array of hex colors
    typography_heading TEXT,          -- Font family for headings
    typography_body TEXT,             -- Font family for body
    logo_concept TEXT,                -- AI-generated logo concept description
    logo_url TEXT,                    -- R2 URL if generated
    
    -- Market positioning
    industry TEXT,
    competitors TEXT,                 -- JSON array
    unique_selling_points TEXT,       -- JSON array
    market_position TEXT,             -- e.g., 'premium', 'budget', 'mid-range'
    
    -- Brand story
    origin_story TEXT,
    brand_values TEXT,                -- JSON array
    brand_promise TEXT,
    
    -- Style guide output
    style_guide TEXT,                 -- JSON: complete brand style guide data
    
    -- Metadata
    onboarding_step TEXT DEFAULT 'welcome',
    conversation_id TEXT REFERENCES conversations(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Onboarding conversation messages (separate from regular chat for context)
CREATE TABLE onboarding_messages (
    id TEXT PRIMARY KEY,
    brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    step TEXT,                         -- Which onboarding step this message belongs to
    metadata TEXT,                     -- JSON: any extracted data from this message
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for quick lookups
CREATE INDEX idx_brand_profiles_user ON brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_status ON brand_profiles(status);
CREATE INDEX idx_onboarding_messages_brand ON onboarding_messages(brand_profile_id);
CREATE INDEX idx_onboarding_messages_step ON onboarding_messages(step);
