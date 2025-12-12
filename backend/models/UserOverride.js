const db = require('./db');

class UserOverride {
  static getByUserId(userId) {
    return db.prepare('SELECT * FROM user_overrides WHERE user_id = ?').get(userId);
  }

  static getAll() {
    return db.prepare(`
      SELECT uo.*, a.agency_name, a.email 
      FROM user_overrides uo
      JOIN agencies a ON uo.user_id = a.id
      ORDER BY uo.created_at DESC
    `).all();
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO user_overrides (
        user_id, override_plan_id, custom_max_projects, custom_max_responses,
        custom_max_messages, custom_max_collabs, custom_badge_label, custom_badge_color,
        admin_notes, expiration_date, is_permanent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id,
      data.override_plan_id || null,
      data.custom_max_projects || null,
      data.custom_max_responses || null,
      data.custom_max_messages || null,
      data.custom_max_collabs || null,
      data.custom_badge_label || null,
      data.custom_badge_color || null,
      data.admin_notes || null,
      data.expiration_date || null,
      data.is_permanent || 0
    );
    
    return result.lastInsertRowid;
  }

  static update(userId, data) {
    const stmt = db.prepare(`
      UPDATE user_overrides 
      SET override_plan_id = ?, custom_max_projects = ?, custom_max_responses = ?,
          custom_max_messages = ?, custom_max_collabs = ?, custom_badge_label = ?,
          custom_badge_color = ?, admin_notes = ?, expiration_date = ?, is_permanent = ?
      WHERE user_id = ?
    `);
    
    return stmt.run(
      data.override_plan_id || null,
      data.custom_max_projects || null,
      data.custom_max_responses || null,
      data.custom_max_messages || null,
      data.custom_max_collabs || null,
      data.custom_badge_label || null,
      data.custom_badge_color || null,
      data.admin_notes || null,
      data.expiration_date || null,
      data.is_permanent || 0,
      userId
    );
  }

  static delete(userId) {
    return db.prepare('DELETE FROM user_overrides WHERE user_id = ?').run(userId);
  }

  static checkAndExpireOverrides() {
    // Expire non-permanent overrides that have passed their expiration date
    return db.prepare(`
      DELETE FROM user_overrides 
      WHERE is_permanent = 0 
      AND expiration_date IS NOT NULL 
      AND expiration_date < datetime('now')
    `).run();
  }
}

module.exports = UserOverride;
