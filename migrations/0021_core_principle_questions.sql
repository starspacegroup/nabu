-- Configurable question bank for AI-driven discovery of brand core principles

CREATE TABLE core_principle_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_core_principle_questions_sort_order
  ON core_principle_questions(sort_order);

INSERT INTO core_principle_questions (id, question, is_active, sort_order)
VALUES
  ('cpq_001', 'What values will your brand protect, even when it is costly?', 1, 0),
  ('cpq_002', 'What kind of impact should people consistently feel after engaging with your brand?', 1, 1),
  ('cpq_003', 'Which customer beliefs or assumptions is your brand trying to challenge?', 1, 2),
  ('cpq_004', 'What standards are non-negotiable in your products, services, or experiences?', 1, 3),
  ('cpq_005', 'How should your team make trade-offs when growth conflicts with integrity?', 1, 4),
  ('cpq_006', 'What behaviors should your brand never reward, even if they drive short-term results?', 1, 5),
  ('cpq_007', 'If your brand disappeared tomorrow, what principle would your audience miss the most?', 1, 6);
