const db = require('./db');

class GlobalAnnouncement {
  static getActive() {
    return db.prepare(`
      SELECT * FROM global_announcements 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `).all();
  }

  static getAll() {
    return db.prepare(`
      SELECT * FROM global_announcements 
      ORDER BY created_at DESC
    `).all();
  }

  static getById(id) {
    return db.prepare('SELECT * FROM global_announcements WHERE id = ?').get(id);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO global_announcements (title, body, is_active)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      data.title,
      data.body,
      data.is_active !== undefined ? data.is_active : 1
    );
    
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE global_announcements 
      SET title = ?, body = ?, is_active = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      data.title,
      data.body,
      data.is_active !== undefined ? data.is_active : 1,
      id
    );
  }

  static delete(id) {
    return db.prepare('DELETE FROM global_announcements WHERE id = ?').run(id);
  }

  static deactivate(id) {
    return db.prepare('UPDATE global_announcements SET is_active = 0 WHERE id = ?').run(id);
  }

  static activate(id) {
    return db.prepare('UPDATE global_announcements SET is_active = 1 WHERE id = ?').run(id);
  }
}

module.exports = GlobalAnnouncement;
