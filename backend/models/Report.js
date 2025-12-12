const db = require('./db');

class Report {
  static getAll() {
    return db.prepare(`
      SELECT r.*, 
             reporter.agency_name as reporter_name,
             reported.agency_name as reported_name,
             p.title as project_title
      FROM reports r
      JOIN agencies reporter ON r.reporter_user_id = reporter.id
      JOIN agencies reported ON r.reported_user_id = reported.id
      LEFT JOIN projects p ON r.project_id = p.id
      ORDER BY r.created_at DESC
    `).all();
  }

  static getById(id) {
    return db.prepare(`
      SELECT r.*, 
             reporter.agency_name as reporter_name, reporter.email as reporter_email,
             reported.agency_name as reported_name, reported.email as reported_email,
             p.title as project_title
      FROM reports r
      JOIN agencies reporter ON r.reporter_user_id = reporter.id
      JOIN agencies reported ON r.reported_user_id = reported.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `).get(id);
  }

  static getByStatus(status) {
    return db.prepare(`
      SELECT r.*, 
             reporter.agency_name as reporter_name,
             reported.agency_name as reported_name,
             p.title as project_title
      FROM reports r
      JOIN agencies reporter ON r.reporter_user_id = reporter.id
      JOIN agencies reported ON r.reported_user_id = reported.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `).all(status);
  }

  static getByReportedUserId(userId) {
    return db.prepare(`
      SELECT r.*, 
             reporter.agency_name as reporter_name,
             p.title as project_title
      FROM reports r
      JOIN agencies reporter ON r.reporter_user_id = reporter.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.reported_user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO reports (reporter_user_id, reported_user_id, project_id, category, message, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.reporter_user_id,
      data.reported_user_id,
      data.project_id || null,
      data.category,
      data.message,
      data.status || 'open'
    );
    
    return result.lastInsertRowid;
  }

  static updateStatus(id, status, adminNotes = null) {
    const stmt = db.prepare(`
      UPDATE reports 
      SET status = ?, admin_notes = ?
      WHERE id = ?
    `);
    
    return stmt.run(status, adminNotes, id);
  }

  static addAdminNotes(id, notes) {
    return db.prepare('UPDATE reports SET admin_notes = ? WHERE id = ?').run(notes, id);
  }

  static delete(id) {
    return db.prepare('DELETE FROM reports WHERE id = ?').run(id);
  }
}

module.exports = Report;
