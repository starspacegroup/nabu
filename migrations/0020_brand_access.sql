-- Brand access delegation and audit logging
-- Allows brand owners to share access with other users

CREATE TABLE brand_access (
  id TEXT PRIMARY KEY,
  brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor', 'manager')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_profile_id, user_id)
);

CREATE TABLE brand_audit_log (
  id TEXT PRIMARY KEY,
  brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brand_access_brand ON brand_access(brand_profile_id);
CREATE INDEX idx_brand_access_user ON brand_access(user_id);
CREATE INDEX idx_brand_audit_brand ON brand_audit_log(brand_profile_id);
CREATE INDEX idx_brand_audit_user ON brand_audit_log(user_id);
CREATE INDEX idx_brand_audit_created ON brand_audit_log(created_at);
