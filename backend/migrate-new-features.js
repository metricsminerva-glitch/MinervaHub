const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

console.log('Running migration for new features...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations
db.exec(`
  -- Plans table (dynamic, admin-controlled)
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    max_projects INTEGER NOT NULL DEFAULT 5,
    max_responses INTEGER NOT NULL DEFAULT 10,
    max_collabs INTEGER NOT NULL DEFAULT 3,
    max_messages INTEGER NOT NULL DEFAULT 50,
    highlight_label TEXT,
    highlight_badge_color TEXT,
    price REAL NOT NULL DEFAULT 0,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User Overrides table (per-user customization)
  CREATE TABLE IF NOT EXISTS user_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    override_plan_id INTEGER,
    custom_max_projects INTEGER,
    custom_max_responses INTEGER,
    custom_max_messages INTEGER,
    custom_max_collabs INTEGER,
    custom_badge_label TEXT,
    custom_badge_color TEXT,
    admin_notes TEXT,
    expiration_date DATETIME,
    is_permanent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (override_plan_id) REFERENCES plans(id) ON DELETE SET NULL
  );

  -- Messages table (internal inbox)
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER DEFAULT 0,
    recipient_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Global Announcements table
  CREATE TABLE IF NOT EXISTS global_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Reports table (safe alternative to disputes)
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_user_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    project_id INTEGER,
    category TEXT NOT NULL CHECK(category IN ('spam', 'fraud_suspicion', 'unresponsive', 'inappropriate_behavior')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_user_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  );

  -- User Badges table (reputation system)
  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_label TEXT NOT NULL,
    badge_color TEXT NOT NULL DEFAULT '#6366f1',
    assigned_by_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Profile Widgets table (sidebar widgets)
  CREATE TABLE IF NOT EXISTS profile_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    is_global INTEGER DEFAULT 0,
    html_content TEXT NOT NULL,
    expiration_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
  CREATE INDEX IF NOT EXISTS idx_plans_is_default ON plans(is_default);
  CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON user_overrides(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON reports(reporter_user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
  CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
  CREATE INDEX IF NOT EXISTS idx_profile_widgets_user_id ON profile_widgets(user_id);
  CREATE INDEX IF NOT EXISTS idx_profile_widgets_is_global ON profile_widgets(is_global);
`);

console.log('✅ Migration completed successfully!');
console.log('New tables created:');
console.log('  - plans');
console.log('  - user_overrides');
console.log('  - messages');
console.log('  - global_announcements');
console.log('  - reports');
console.log('  - user_badges');
console.log('  - profile_widgets');

db.close();
