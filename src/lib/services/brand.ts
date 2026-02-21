/**
 * Brand Service
 * Manages brand profile field versioning, retrieval, and structured summaries.
 * Complements the onboarding service with direct brand management capabilities.
 */

import type { BrandProfile } from '$lib/types/onboarding';
import type { D1Database } from '@cloudflare/workers-types';

/** A single version record for a brand field */
export interface BrandFieldVersion {
  id: string;
  brandProfileId: string;
  userId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeSource: 'manual' | 'ai' | 'import';
  changeReason: string | null;
  versionNumber: number;
  createdAt: string;
}

/** A field in a brand section summary */
export interface BrandFieldSummaryItem {
  key: string;
  label: string;
  value: unknown;
  type: 'text' | 'color' | 'list' | 'object' | 'archetype';
}

/** A section grouping related brand fields */
export interface BrandFieldSection {
  id: string;
  title: string;
  icon: string;
  fields: BrandFieldSummaryItem[];
}

/** Human-readable labels for all brand profile fields */
export const BRAND_FIELD_LABELS: Record<string, string> = {
  brandName: 'Brand Name',
  tagline: 'Tagline',
  missionStatement: 'Mission Statement',
  visionStatement: 'Vision Statement',
  elevatorPitch: 'Elevator Pitch',
  brandArchetype: 'Brand Archetype',
  brandPersonalityTraits: 'Personality Traits',
  toneOfVoice: 'Tone of Voice',
  communicationStyle: 'Communication Style',
  targetAudience: 'Target Audience',
  customerPainPoints: 'Customer Pain Points',
  valueProposition: 'Value Proposition',
  primaryColor: 'Primary Color',
  secondaryColor: 'Secondary Color',
  accentColor: 'Accent Color',
  colorPalette: 'Color Palette',
  typographyHeading: 'Heading Font',
  typographyBody: 'Body Font',
  logoConcept: 'Logo Concept',
  logoUrl: 'Logo URL',
  industry: 'Industry',
  competitors: 'Competitors',
  uniqueSellingPoints: 'Unique Selling Points',
  marketPosition: 'Market Position',
  originStory: 'Origin Story',
  brandValues: 'Brand Values',
  brandPromise: 'Brand Promise',
  styleGuide: 'Style Guide'
};

/**
 * Map from camelCase field names to snake_case DB column names
 */
const FIELD_TO_COLUMN: Record<string, string> = {
  brandName: 'brand_name',
  tagline: 'tagline',
  missionStatement: 'mission_statement',
  visionStatement: 'vision_statement',
  elevatorPitch: 'elevator_pitch',
  brandArchetype: 'brand_archetype',
  brandPersonalityTraits: 'brand_personality_traits',
  toneOfVoice: 'tone_of_voice',
  communicationStyle: 'communication_style',
  targetAudience: 'target_audience',
  customerPainPoints: 'customer_pain_points',
  valueProposition: 'value_proposition',
  primaryColor: 'primary_color',
  secondaryColor: 'secondary_color',
  accentColor: 'accent_color',
  colorPalette: 'color_palette',
  typographyHeading: 'typography_heading',
  typographyBody: 'typography_body',
  logoConcept: 'logo_concept',
  logoUrl: 'logo_url',
  industry: 'industry',
  competitors: 'competitors',
  uniqueSellingPoints: 'unique_selling_points',
  marketPosition: 'market_position',
  originStory: 'origin_story',
  brandValues: 'brand_values',
  brandPromise: 'brand_promise',
  styleGuide: 'style_guide'
};

/** Fields stored as JSON arrays in the database */
const JSON_ARRAY_FIELDS = new Set([
  'brandPersonalityTraits',
  'colorPalette',
  'brandValues',
  'competitors',
  'uniqueSellingPoints',
  'customerPainPoints'
]);

/** Fields stored as JSON objects in the database */
const JSON_OBJECT_FIELDS = new Set([
  'targetAudience',
  'styleGuide'
]);

/**
 * Map a database row to a BrandFieldVersion
 */
function mapRowToVersion(row: Record<string, unknown>): BrandFieldVersion {
  return {
    id: row.id as string,
    brandProfileId: row.brand_profile_id as string,
    userId: row.user_id as string,
    fieldName: row.field_name as string,
    oldValue: (row.old_value as string) || null,
    newValue: (row.new_value as string) || null,
    changeSource: row.change_source as BrandFieldVersion['changeSource'],
    changeReason: (row.change_reason as string) || null,
    versionNumber: row.version_number as number,
    createdAt: row.created_at as string
  };
}

/**
 * Add a version record for a brand field change
 */
export async function addFieldVersion(
  db: D1Database,
  params: {
    brandProfileId: string;
    userId: string;
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
    changeSource: 'manual' | 'ai' | 'import';
    changeReason?: string;
  }
): Promise<BrandFieldVersion> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get the current max version number for this field
  const maxVersionRow = await db
    .prepare(
      `SELECT COALESCE(MAX(version_number), 0) as max_version 
       FROM brand_field_versions 
       WHERE brand_profile_id = ? AND field_name = ?`
    )
    .bind(params.brandProfileId, params.fieldName)
    .first<{ max_version: number; }>();

  const versionNumber = (maxVersionRow?.max_version || 0) + 1;

  // Serialize values for storage
  const oldValueStr = params.oldValue != null
    ? (typeof params.oldValue === 'string' ? params.oldValue : JSON.stringify(params.oldValue))
    : null;
  const newValueStr = params.newValue != null
    ? (typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue))
    : null;

  await db
    .prepare(
      `INSERT INTO brand_field_versions 
       (id, brand_profile_id, user_id, field_name, old_value, new_value, change_source, change_reason, version_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      params.brandProfileId,
      params.userId,
      params.fieldName,
      oldValueStr,
      newValueStr,
      params.changeSource,
      params.changeReason || null,
      versionNumber,
      now
    )
    .run();

  return {
    id,
    brandProfileId: params.brandProfileId,
    userId: params.userId,
    fieldName: params.fieldName,
    oldValue: oldValueStr,
    newValue: newValueStr,
    changeSource: params.changeSource,
    changeReason: params.changeReason || null,
    versionNumber,
    createdAt: now
  };
}

/**
 * Get version history for a specific field
 */
export async function getFieldHistory(
  db: D1Database,
  brandProfileId: string,
  fieldName: string
): Promise<BrandFieldVersion[]> {
  const result = await db
    .prepare(
      `SELECT * FROM brand_field_versions 
       WHERE brand_profile_id = ? AND field_name = ?
       ORDER BY version_number ASC`
    )
    .bind(brandProfileId, fieldName)
    .all();

  return (result.results || []).map((row) =>
    mapRowToVersion(row as Record<string, unknown>)
  );
}

/**
 * Get all version history across all fields for a brand profile
 */
export async function getAllFieldHistory(
  db: D1Database,
  brandProfileId: string
): Promise<BrandFieldVersion[]> {
  const result = await db
    .prepare(
      `SELECT * FROM brand_field_versions 
       WHERE brand_profile_id = ?
       ORDER BY created_at DESC`
    )
    .bind(brandProfileId)
    .all();

  return (result.results || []).map((row) =>
    mapRowToVersion(row as Record<string, unknown>)
  );
}

/**
 * Update a brand field and create a version record
 */
export async function updateBrandFieldWithVersion(
  db: D1Database,
  params: {
    profileId: string;
    userId: string;
    fieldName: string;
    newValue: unknown;
    changeSource: 'manual' | 'ai' | 'import';
    changeReason?: string;
  }
): Promise<void> {
  const column = FIELD_TO_COLUMN[params.fieldName];
  if (!column) {
    throw new Error(`Unknown field: ${params.fieldName}`);
  }

  // Get current value for version tracking
  const currentRow = await db
    .prepare(`SELECT ${column} FROM brand_profiles WHERE id = ?`)
    .bind(params.profileId)
    .first<Record<string, unknown>>();

  const oldValue = currentRow?.[column] ?? null;

  // Determine how to store the new value
  let dbValue: string | null;
  if (params.newValue == null) {
    dbValue = null;
  } else if (JSON_ARRAY_FIELDS.has(params.fieldName) || JSON_OBJECT_FIELDS.has(params.fieldName)) {
    dbValue = typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue);
  } else {
    dbValue = String(params.newValue);
  }

  // Update the field
  await db
    .prepare(`UPDATE brand_profiles SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(dbValue, params.profileId)
    .run();

  // Create version record
  await addFieldVersion(db, {
    brandProfileId: params.profileId,
    userId: params.userId,
    fieldName: params.fieldName,
    oldValue,
    newValue: params.newValue,
    changeSource: params.changeSource,
    changeReason: params.changeReason
  });
}

/**
 * Revert a field to a specific version
 */
export async function revertFieldToVersion(
  db: D1Database,
  params: {
    profileId: string;
    userId: string;
    fieldName: string;
    versionId: string;
  }
): Promise<void> {
  // Get the version record
  const versionRow = await db
    .prepare('SELECT * FROM brand_field_versions WHERE id = ? AND brand_profile_id = ?')
    .bind(params.versionId, params.profileId)
    .first<Record<string, unknown>>();

  if (!versionRow) {
    throw new Error('Version not found');
  }

  const targetValue = versionRow.new_value as string | null;

  // Apply via the versioned update (which creates a new version record for the revert)
  await updateBrandFieldWithVersion(db, {
    profileId: params.profileId,
    userId: params.userId,
    fieldName: params.fieldName,
    newValue: targetValue,
    changeSource: 'manual',
    changeReason: `Reverted to version ${versionRow.version_number}`
  });
}

/**
 * Get a structured summary of all brand fields organized by section
 */
export function getBrandFieldsSummary(profile: BrandProfile): BrandFieldSection[] {
  return [
    {
      id: 'identity',
      title: 'Brand Identity',
      icon: '🏷️',
      fields: [
        { key: 'brandName', label: 'Brand Name', value: profile.brandName, type: 'text' },
        { key: 'tagline', label: 'Tagline', value: profile.tagline, type: 'text' },
        { key: 'missionStatement', label: 'Mission Statement', value: profile.missionStatement, type: 'text' },
        { key: 'visionStatement', label: 'Vision Statement', value: profile.visionStatement, type: 'text' },
        { key: 'elevatorPitch', label: 'Elevator Pitch', value: profile.elevatorPitch, type: 'text' }
      ]
    },
    {
      id: 'personality',
      title: 'Brand Personality',
      icon: '🎭',
      fields: [
        { key: 'brandArchetype', label: 'Brand Archetype', value: profile.brandArchetype, type: 'archetype' },
        { key: 'brandPersonalityTraits', label: 'Personality Traits', value: profile.brandPersonalityTraits, type: 'list' },
        { key: 'toneOfVoice', label: 'Tone of Voice', value: profile.toneOfVoice, type: 'text' },
        { key: 'communicationStyle', label: 'Communication Style', value: profile.communicationStyle, type: 'text' }
      ]
    },
    {
      id: 'audience',
      title: 'Target Audience',
      icon: '🎯',
      fields: [
        { key: 'targetAudience', label: 'Target Audience', value: profile.targetAudience, type: 'object' },
        { key: 'customerPainPoints', label: 'Customer Pain Points', value: profile.customerPainPoints, type: 'list' },
        { key: 'valueProposition', label: 'Value Proposition', value: profile.valueProposition, type: 'text' }
      ]
    },
    {
      id: 'visual',
      title: 'Visual Identity',
      icon: '🎨',
      fields: [
        { key: 'primaryColor', label: 'Primary Color', value: profile.primaryColor, type: 'color' },
        { key: 'secondaryColor', label: 'Secondary Color', value: profile.secondaryColor, type: 'color' },
        { key: 'accentColor', label: 'Accent Color', value: profile.accentColor, type: 'color' },
        { key: 'colorPalette', label: 'Color Palette', value: profile.colorPalette, type: 'list' },
        { key: 'typographyHeading', label: 'Heading Font', value: profile.typographyHeading, type: 'text' },
        { key: 'typographyBody', label: 'Body Font', value: profile.typographyBody, type: 'text' },
        { key: 'logoConcept', label: 'Logo Concept', value: profile.logoConcept, type: 'text' }
      ]
    },
    {
      id: 'market',
      title: 'Market Position',
      icon: '📊',
      fields: [
        { key: 'industry', label: 'Industry', value: profile.industry, type: 'text' },
        { key: 'competitors', label: 'Competitors', value: profile.competitors, type: 'list' },
        { key: 'uniqueSellingPoints', label: 'Unique Selling Points', value: profile.uniqueSellingPoints, type: 'list' },
        { key: 'marketPosition', label: 'Market Position', value: profile.marketPosition, type: 'text' }
      ]
    },
    {
      id: 'story',
      title: 'Brand Story',
      icon: '📖',
      fields: [
        { key: 'originStory', label: 'Origin Story', value: profile.originStory, type: 'text' },
        { key: 'brandValues', label: 'Brand Values', value: profile.brandValues, type: 'list' },
        { key: 'brandPromise', label: 'Brand Promise', value: profile.brandPromise, type: 'text' }
      ]
    }
  ];
}
