const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

console.log('Initializing database...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Agencies table
  CREATE TABLE IF NOT EXISTS agencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    website TEXT,
    location TEXT,
    description TEXT,
    skills TEXT,
    platforms TEXT,
    verticals TEXT,
    logo_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK(subscription_tier IN ('free', 'pro', 'premium')),
    subscription_status TEXT DEFAULT 'active' CHECK(subscription_status IN ('active', 'past_due', 'canceled')),
    subscription_expires_at DATETIME,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    rating_average REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    badges TEXT,
    certifications TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'banned')),
    projects_created_this_month INTEGER DEFAULT 0,
    responses_sent_this_month INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );



  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    project_type TEXT DEFAULT 'collaboration' CHECK(project_type IN ('collaboration', 'overflow', 'shared_account', 'joint_venture', 'other')),
    platforms_involved TEXT,
    budget_range TEXT,
    deadline DATE,
    hide_identity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Project Identity Reveals table
  CREATE TABLE IF NOT EXISTS project_identity_reveals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    responder_agency_id INTEGER NOT NULL,
    revealed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    UNIQUE(project_id, responder_agency_id)
  );

  -- Responses table
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    responder_agency_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Reviews table
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_agency_id INTEGER NOT NULL,
    target_agency_id INTEGER NOT NULL,
    project_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (target_agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    UNIQUE(reviewer_agency_id, target_agency_id, project_id)
  );

  -- Badges table
  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    requirements_json TEXT
  );

  -- Admin users table
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Activity log table
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES agencies(id) ON DELETE SET NULL
  );

  -- Contact Messages table
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tickets table
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
  );

  -- Ticket Responses table
  CREATE TABLE IF NOT EXISTS ticket_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('agency', 'admin')),
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );



  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_agencies_email ON agencies(email);
  CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
  CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_responses_project_id ON responses(project_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_target_agency_id ON reviews(target_agency_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_agency_id ON tickets(agency_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_project_identity_reveals_project_id ON project_identity_reveals(project_id);
  CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON ticket_responses(ticket_id);
`);

console.log('Database initialized successfully!');
console.log('Database location:', dbPath);

db.close();
