const db = require('./db');

class AdminUser {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO admin_users (email, password_hash)
      VALUES (?, ?)
    `);
    
    const info = stmt.run(data.email, data.password_hash);
    return info.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE id = ?');
    return stmt.get(id);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE email = ?');
    return stmt.get(email);
  }

  static findAll() {
    const stmt = db.prepare('SELECT id, email, created_at FROM admin_users');
    return stmt.all();
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM admin_users WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
}

module.exports = AdminUser;
