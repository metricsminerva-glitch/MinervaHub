const db = require('./db');

class Response {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO responses (
        project_id, responder_agency_id, message, contact_email
      ) VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.project_id,
      data.responder_agency_id,
      data.message,
      data.contact_email
    );
    
    return info.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT r.*, a.agency_name, a.email as agency_email
      FROM responses r
      JOIN agencies a ON r.responder_agency_id = a.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  }

  static findByProject(projectId) {
    const stmt = db.prepare(`
      SELECT r.*, a.agency_name, a.rating_average, a.website
      FROM responses r
      JOIN agencies a ON r.responder_agency_id = a.id
      WHERE r.project_id = ?
      ORDER BY r.created_at DESC
    `);
    return stmt.all(projectId);
  }

  static findAll(filters = {}) {
    let query = `
      SELECT r.*, a.agency_name, p.title as project_title
      FROM responses r
      JOIN agencies a ON r.responder_agency_id = a.id
      JOIN projects p ON r.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.responder_agency_id) {
      query += ' AND r.responder_agency_id = ?';
      params.push(filters.responder_agency_id);
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM responses WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static countByAgencyThisMonth(agencyId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM responses 
      WHERE responder_agency_id = ? 
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);
    return stmt.get(agencyId).count;
  }
}

module.exports = Response;
