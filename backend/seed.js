const bcrypt = require('bcrypt');
const AdminUser = require('./models/AdminUser');
const Agency = require('./models/Agency');

console.log('Seeding database...');

// Create default admin user
const adminEmail = 'admin@minerva.com';
const adminPassword = 'admin123'; // Change this in production!

const existingAdmin = AdminUser.findByEmail(adminEmail);
if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  AdminUser.create({
    email: adminEmail,
    password_hash: passwordHash
  });
  console.log('✓ Admin user created');
  console.log('  Email:', adminEmail);
  console.log('  Password:', adminPassword);
} else {
  console.log('✓ Admin user already exists');
}

// Create sample badges (optional)
const db = require('./models/db');
const badgesData = [
  {
    name: 'Top Collaborator',
    description: '10+ reviews with 4.5+ average rating',
    requirements_json: JSON.stringify({ min_reviews: 10, min_rating: 4.5 })
  },
  {
    name: 'Elite Member',
    description: 'Premium tier with 4.5+ average rating',
    requirements_json: JSON.stringify({ tier: 'premium', min_rating: 4.5 })
  },
  {
    name: 'Elite Partner',
    description: 'Premium subscription tier',
    requirements_json: JSON.stringify({ tier: 'premium' })
  }
];

badgesData.forEach(badge => {
  const existing = db.prepare('SELECT id FROM badges WHERE name = ?').get(badge.name);
  if (!existing) {
    db.prepare(`
      INSERT INTO badges (name, description, requirements_json)
      VALUES (?, ?, ?)
    `).run(badge.name, badge.description, badge.requirements_json);
    console.log(`✓ Badge created: ${badge.name}`);
  }
});

console.log('\nSeeding complete!');
console.log('\nYou can now login to admin panel at /admin/login');

// Seed a sample agency for testing
const sampleAgency = Agency.findAll({ limit: 1 })[0];
if (sampleAgency) {
    const { Ticket } = require('./models/Ticket');
    const ticketId = Ticket.create({
        agency_id: sampleAgency.id,
        title: 'Issue with Project Marketplace Filter',
        category: 'Technical Support',
        status: 'open',
    });
    const { TicketResponse } = require('./models/Ticket');
    TicketResponse.create({
        ticket_id: ticketId,
        user_type: 'agency',
        user_id: sampleAgency.id,
        message: 'The filter for "overflow" projects seems to be broken on the main marketplace page. It returns no results even when there are open projects.',
    });
    console.log('✓ Sample support ticket created.');
}
