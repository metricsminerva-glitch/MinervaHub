const db = require('./db');

class Review {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO reviews (
        reviewer_agency_id, target_agency_id, project_id, rating, comment
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.reviewer_agency_id,
      data.target_agency_id,
      data.project_id || null,
      data.rating,
      data.comment || null
    );
    
    return info.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT r.*, 
        reviewer.agency_name as reviewer_name,
        target.agency_name as target_name,
        p.title as project_title
      FROM reviews r
      JOIN agencies reviewer ON r.reviewer_agency_id = reviewer.id
      JOIN agencies target ON r.target_agency_id = target.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  }

  static findByTargetAgency(targetAgencyId, limit = null) {
    let query = `
      SELECT r.*, 
        reviewer.agency_name as reviewer_name,
        p.title as project_title
      FROM reviews r
      JOIN agencies reviewer ON r.reviewer_agency_id = reviewer.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.target_agency_id = ?
      ORDER BY r.created_at DESC
    `;

    if (limit) {
      query += ' LIMIT ?';
    }

    const stmt = db.prepare(query);
    return limit ? stmt.all(targetAgencyId, limit) : stmt.all(targetAgencyId);
  }

  static findAll(filters = {}) {
    let query = `
      SELECT r.*, 
        reviewer.agency_name as reviewer_name,
        target.agency_name as target_name,
        p.title as project_title
      FROM reviews r
      JOIN agencies reviewer ON r.reviewer_agency_id = reviewer.id
      JOIN agencies target ON r.target_agency_id = target.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.reviewer_agency_id) {
      query += ' AND r.reviewer_agency_id = ?';
      params.push(filters.reviewer_agency_id);
    }

    if (filters.target_agency_id) {
      query += ' AND r.target_agency_id = ?';
      params.push(filters.target_agency_id);
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static checkExists(reviewerAgencyId, targetAgencyId, projectId) {
    const stmt = db.prepare(`
      SELECT id FROM reviews 
      WHERE reviewer_agency_id = ? 
      AND target_agency_id = ? 
      AND project_id = ?
    `);
    return stmt.get(reviewerAgencyId, targetAgencyId, projectId) !== undefined;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
}

module.exports = Review;
