const db = require('./db');

class UserBadge {
  static getByUserId(userId) {
    return db.prepare(`
      SELECT * FROM user_badges 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
  }

  static getAll() {
    return db.prepare(`
      SELECT ub.*, a.agency_name, a.email
      FROM user_badges ub
      JOIN agencies a ON ub.user_id = a.id
      ORDER BY ub.created_at DESC
    `).all();
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO user_badges (user_id, badge_label, badge_color, assigned_by_admin)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id,
      data.badge_label,
      data.badge_color || '#6366f1',
      data.assigned_by_admin || 0
    );
    
    return result.lastInsertRowid;
  }

  static delete(id) {
    return db.prepare('DELETE FROM user_badges WHERE id = ?').run(id);
  }

  static deleteByUserIdAndLabel(userId, label) {
    return db.prepare('DELETE FROM user_badges WHERE user_id = ? AND badge_label = ?').run(userId, label);
  }
}

module.exports = UserBadge;
