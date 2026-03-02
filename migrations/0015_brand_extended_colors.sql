-- Migration 0015: Extended brand color palette
-- Adds background, surface, text, text secondary, border, success, warning, error colors
-- to brand profiles for full theme-like visual identity control.

ALTER TABLE brand_profiles ADD COLUMN background_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN surface_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN text_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN text_secondary_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN border_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN success_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN warning_color TEXT;
ALTER TABLE brand_profiles ADD COLUMN error_color TEXT;
