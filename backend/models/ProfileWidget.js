const db = require('./db');

class ProfileWidget {
  static getGlobal() {
    return db.prepare(`
      SELECT * FROM profile_widgets 
      WHERE is_global = 1 
      AND is_active = 1
      AND (expiration_date IS NULL OR expiration_date > datetime('now'))
      ORDER BY created_at DESC
      LIMIT 1
    `).get();
  }

  static getByUserId(userId) {
    return db.prepare(`
      SELECT * FROM profile_widgets 
      WHERE user_id = ? 
      AND is_active = 1
      AND (expiration_date IS NULL OR expiration_date > datetime('now'))
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);
  }

  static getAll() {
    return db.prepare(`
      SELECT pw.*, a.agency_name, a.email
      FROM profile_widgets pw
      LEFT JOIN agencies a ON pw.user_id = a.id
      ORDER BY pw.is_global DESC, pw.created_at DESC
    `).all();
  }

  static getById(id) {
    return db.prepare('SELECT * FROM profile_widgets WHERE id = ?').get(id);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO profile_widgets (user_id, is_global, html_content, expiration_date, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id || null,
      data.is_global || 0,
      data.html_content,
      data.expiration_date || null,
      data.is_active !== undefined ? data.is_active : 1
    );
    
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE profile_widgets 
      SET html_content = ?, expiration_date = ?, is_active = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      data.html_content,
      data.expiration_date || null,
      data.is_active !== undefined ? data.is_active : 1,
      id
    );
  }

  static delete(id) {
    return db.prepare('DELETE FROM profile_widgets WHERE id = ?').run(id);
  }

  static deactivate(id) {
    return db.prepare('UPDATE profile_widgets SET is_active = 0 WHERE id = ?').run(id);
  }

  static activate(id) {
    return db.prepare('UPDATE profile_widgets SET is_active = 1 WHERE id = ?').run(id);
  }

  static getForProfile(userId) {
    // Check for user-specific widget first
    const userWidget = this.getByUserId(userId);
    if (userWidget) {
      return userWidget;
    }
    
    // Fall back to global widget
    return this.getGlobal();
  }
}

module.exports = ProfileWidget;
