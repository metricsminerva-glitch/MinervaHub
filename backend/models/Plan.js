const db = require('./db');

class Plan {
  static getAll() {
    return db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC').all();
  }

  static getAllIncludingInactive() {
    return db.prepare('SELECT * FROM plans ORDER BY price ASC').all();
  }

  static getById(id) {
    return db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  }

  static getByName(name) {
    return db.prepare('SELECT * FROM plans WHERE name = ?').get(name);
  }

  static getDefault() {
    return db.prepare('SELECT * FROM plans WHERE is_default = 1 AND is_active = 1').get();
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO plans (name, max_projects, max_responses, max_collabs, max_messages, 
                        highlight_label, highlight_badge_color, price, description, is_default, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name,
      data.max_projects,
      data.max_responses,
      data.max_collabs,
      data.max_messages,
      data.highlight_label || null,
      data.highlight_badge_color || null,
      data.price,
      data.description || null,
      data.is_default || 0,
      data.is_active !== undefined ? data.is_active : 1
    );
    
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const stmt = db.prepare(`
      UPDATE plans 
      SET name = ?, max_projects = ?, max_responses = ?, max_collabs = ?, max_messages = ?,
          highlight_label = ?, highlight_badge_color = ?, price = ?, description = ?, 
          is_default = ?, is_active = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      data.name,
      data.max_projects,
      data.max_responses,
      data.max_collabs,
      data.max_messages,
      data.highlight_label || null,
      data.highlight_badge_color || null,
      data.price,
      data.description || null,
      data.is_default || 0,
      data.is_active !== undefined ? data.is_active : 1,
      id
    );
  }

  static delete(id) {
    return db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  }

  static deactivate(id) {
    return db.prepare('UPDATE plans SET is_active = 0 WHERE id = ?').run(id);
  }

  static activate(id) {
    return db.prepare('UPDATE plans SET is_active = 1 WHERE id = ?').run(id);
  }
}

module.exports = Plan;
