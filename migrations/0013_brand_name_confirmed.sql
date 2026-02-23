-- Migration: Add brand_name_confirmed flag
-- When a brand is created, it gets a random placeholder name (e.g. "Wild Fox").
-- This flag tracks whether the user has explicitly chosen or confirmed that name.
-- Until confirmed, the UI shows the name as a "codename".

ALTER TABLE brand_profiles ADD COLUMN brand_name_confirmed INTEGER NOT NULL DEFAULT 0;
