const db = require('./db');

class ActivityLog {
  static log(action, userId = null, metadata = {}) {
    const stmt = db.prepare(`
      INSERT INTO activity_log (user_id, action, metadata_json)
      VALUES (?, ?, ?)
    `);
    
    const info = stmt.run(
      userId,
      action,
      JSON.stringify(metadata)
    );
    
    return info.lastInsertRowid;
  }

  static findAll(filters = {}) {
    let query = 'SELECT * FROM activity_log WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getRecent(limit = 50) {
    const stmt = db.prepare(`
      SELECT al.*, a.agency_name
      FROM activity_log al
      LEFT JOIN agencies a ON al.user_id = a.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

module.exports = ActivityLog;
