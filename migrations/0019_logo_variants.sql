-- Add horizontal and vertical logo variant URL columns
-- The existing logo_url stores the square icon version.
-- These new columns store the horizontal (icon + name side-by-side)
-- and vertical (icon above name) layout variants.
ALTER TABLE brand_profiles ADD COLUMN logo_horizontal_url TEXT;
ALTER TABLE brand_profiles ADD COLUMN logo_vertical_url TEXT;
