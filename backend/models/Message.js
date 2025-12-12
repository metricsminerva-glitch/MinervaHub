const db = require('./db');

class Message {
  static getByRecipientId(recipientId) {
    return db.prepare(`
      SELECT m.*, a.agency_name as sender_name
      FROM messages m
      LEFT JOIN agencies a ON m.sender_id = a.id
      WHERE m.recipient_id = ?
      ORDER BY m.created_at DESC
    `).all(recipientId);
  }

  static getById(id) {
    return db.prepare(`
      SELECT m.*, a.agency_name as sender_name
      FROM messages m
      LEFT JOIN agencies a ON m.sender_id = a.id
      WHERE m.id = ?
    `).get(id);
  }

  static getUnreadCount(recipientId) {
    return db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE recipient_id = ? AND is_read = 0
    `).get(recipientId).count;
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, subject, body, is_read)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.sender_id || 0, // 0 = system/admin
      data.recipient_id,
      data.subject,
      data.body,
      data.is_read || 0
    );
    
    return result.lastInsertRowid;
  }

  static markAsRead(id) {
    return db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id);
  }

  static markAllAsRead(recipientId) {
    return db.prepare('UPDATE messages SET is_read = 1 WHERE recipient_id = ?').run(recipientId);
  }

  static delete(id) {
    return db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  }

  static sendToAll(subject, body) {
    const agencies = db.prepare('SELECT id FROM agencies WHERE status = "approved"').all();
    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, subject, body, is_read)
      VALUES (0, ?, ?, ?, 0)
    `);
    
    let count = 0;
    for (const agency of agencies) {
      stmt.run(agency.id, subject, body);
      count++;
    }
    
    return count;
  }

  static sendToPlanTier(planId, subject, body) {
    const agencies = db.prepare(`
      SELECT id FROM agencies 
      WHERE status = "approved" 
      AND subscription_tier = (SELECT name FROM plans WHERE id = ?)
    `).all(planId);
    
    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, subject, body, is_read)
      VALUES (0, ?, ?, ?, 0)
    `);
    
    let count = 0;
    for (const agency of agencies) {
      stmt.run(agency.id, subject, body);
      count++;
    }
    
    return count;
  }
}

module.exports = Message;
