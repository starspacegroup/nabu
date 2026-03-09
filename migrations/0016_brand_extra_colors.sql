-- Migration 0016: Add brand color 4 and 5 slots
-- Allows 3-5 brand colors instead of just primary/secondary/accent.
-- Layout and status colors are auto-derived and remain in existing columns.

ALTER TABLE brand_profiles ADD COLUMN brand_color_4 TEXT;
ALTER TABLE brand_profiles ADD COLUMN brand_color_5 TEXT;
