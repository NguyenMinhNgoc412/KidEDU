export const schemaVersion = 1;

export const createSchemaSql = `
CREATE TABLE IF NOT EXISTS schema_versions (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_asset_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS learning_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  learning_status TEXT NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  uri TEXT NOT NULL,
  thumbnail_asset_id TEXT,
  duration_ms INTEGER,
  size_bytes INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_item_media (
  id TEXT PRIMARY KEY,
  learning_item_id TEXT NOT NULL,
  media_asset_id TEXT NOT NULL,
  role TEXT NOT NULL,
  priority INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (learning_item_id) REFERENCES learning_items(id),
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id)
);

CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deck_items (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  learning_item_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (deck_id) REFERENCES decks(id),
  FOREIGN KEY (learning_item_id) REFERENCES learning_items(id)
);

CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  deck_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id),
  FOREIGN KEY (deck_id) REFERENCES decks(id)
);

CREATE TABLE IF NOT EXISTS practice_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  learning_item_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES practice_sessions(id),
  FOREIGN KEY (learning_item_id) REFERENCES learning_items(id)
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  learning_item_id TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  practice_count INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TEXT,
  parent_mark TEXT NOT NULL DEFAULT 'new',
  UNIQUE (child_id, learning_item_id),
  FOREIGN KEY (child_id) REFERENCES children(id),
  FOREIGN KEY (learning_item_id) REFERENCES learning_items(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_items_category ON learning_items(category_id);
CREATE INDEX IF NOT EXISTS idx_learning_item_media_item ON learning_item_media(learning_item_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_deck_order ON deck_items(deck_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_practice_events_session ON practice_events(session_id);
`;
