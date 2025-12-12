const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

console.log('Seeding default plans...');

// Insert default plans
const insertPlan = db.prepare(`
  INSERT OR IGNORE INTO plans (name, max_projects, max_responses, max_collabs, max_messages, highlight_label, highlight_badge_color, price, description, is_default, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const plans = [
  {
    name: 'Free',
    max_projects: 2,
    max_responses: 5,
    max_collabs: 1,
    max_messages: 20,
    highlight_label: null,
    highlight_badge_color: null,
    price: 0,
    description: 'Perfect for getting started with the Minerva Hub community',
    is_default: 1,
    is_active: 1
  },
  {
    name: 'Pro',
    max_projects: 10,
    max_responses: 30,
    max_collabs: 5,
    max_messages: 100,
    highlight_label: 'Pro Member',
    highlight_badge_color: '#8b5cf6',
    price: 49,
    description: 'For growing agencies looking to expand their network',
    is_default: 0,
    is_active: 1
  },
  {
    name: 'Premium',
    max_projects: -1, // -1 means unlimited
    max_responses: -1,
    max_collabs: -1,
    max_messages: -1,
    highlight_label: 'Premium Partner',
    highlight_badge_color: '#f59e0b',
    price: 149,
    description: 'Unlimited access for established agencies',
    is_default: 0,
    is_active: 1
  }
];

for (const plan of plans) {
  insertPlan.run(
    plan.name,
    plan.max_projects,
    plan.max_responses,
    plan.max_collabs,
    plan.max_messages,
    plan.highlight_label,
    plan.highlight_badge_color,
    plan.price,
    plan.description,
    plan.is_default,
    plan.is_active
  );
}

console.log('✅ Default plans seeded successfully!');
console.log('Plans created:');
console.log('  - Free (default)');
console.log('  - Pro');
console.log('  - Premium');

db.close();
