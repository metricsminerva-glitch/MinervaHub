const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

console.log('Running simple improvements migration...');

db.pragma('foreign_keys = ON');

// Add new columns to agencies table
db.exec(`
  -- Add plan_id column (references plans table)
  ALTER TABLE agencies ADD COLUMN plan_id INTEGER REFERENCES plans(id);
  
  -- Add custom override columns
  ALTER TABLE agencies ADD COLUMN custom_max_projects INTEGER;
  ALTER TABLE agencies ADD COLUMN custom_max_responses INTEGER;
`);

console.log('✅ Migration completed!');
console.log('Added columns to agencies table:');
console.log('  - plan_id (references plans table)');
console.log('  - custom_max_projects (override)');
console.log('  - custom_max_responses (override)');

// Set default plan_id based on existing subscription_tier
console.log('\nMigrating existing subscription tiers to plan_id...');

const freePlan = db.prepare("SELECT id FROM plans WHERE name = 'Free'").get();
const proPlan = db.prepare("SELECT id FROM plans WHERE name = 'Pro'").get();
const premiumPlan = db.prepare("SELECT id FROM plans WHERE name = 'Premium'").get();

if (freePlan) {
  db.prepare("UPDATE agencies SET plan_id = ? WHERE subscription_tier = 'free'").run(freePlan.id);
  console.log(`  - Updated 'free' tier users to plan_id ${freePlan.id}`);
}

if (proPlan) {
  db.prepare("UPDATE agencies SET plan_id = ? WHERE subscription_tier = 'pro'").run(proPlan.id);
  console.log(`  - Updated 'pro' tier users to plan_id ${proPlan.id}`);
}

if (premiumPlan) {
  db.prepare("UPDATE agencies SET plan_id = ? WHERE subscription_tier = 'premium'").run(premiumPlan.id);
  console.log(`  - Updated 'premium' tier users to plan_id ${premiumPlan.id}`);
}

console.log('\n✅ All done!');

db.close();
