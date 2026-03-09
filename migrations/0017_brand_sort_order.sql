-- Add sort_order column for custom drag-and-drop ordering of brand cards
ALTER TABLE brand_profiles ADD COLUMN sort_order INTEGER DEFAULT 0;
