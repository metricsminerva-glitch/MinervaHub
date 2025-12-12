const db = require('./db');

class ProjectIdentityReveal {
  static create(projectId, responderAgencyId) {
    const stmt = db.prepare(`
      INSERT INTO project_identity_reveals (project_id, responder_agency_id)
      VALUES (?, ?)
      ON CONFLICT(project_id, responder_agency_id) DO UPDATE SET revealed = 1
    `);
    const info = stmt.run(projectId, responderAgencyId);
    return info.lastInsertRowid;
  }

  static isRevealed(projectId, responderAgencyId) {
    if (!responderAgencyId) return false;
    const stmt = db.prepare(`
      SELECT revealed FROM project_identity_reveals
      WHERE project_id = ? AND responder_agency_id = ?
    `);
    const result = stmt.get(projectId, responderAgencyId);
    return result ? result.revealed === 1 : false;
  }

  static findByProject(projectId) {
    const stmt = db.prepare(`
      SELECT pir.*, a.agency_name, a.email
      FROM project_identity_reveals pir
      JOIN agencies a ON pir.responder_agency_id = a.id
      WHERE pir.project_id = ?
    `);
    return stmt.all(projectId);
  }
}

module.exports = ProjectIdentityReveal;
