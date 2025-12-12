const db = require('./db');

class Project {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO projects (
        agency_id, title, description, project_type, 
        platforms_involved, budget_range, deadline, hide_identity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.agency_id,
      data.title,
      data.description,
      data.project_type || 'collaboration',
      data.platforms_involved || null,
      data.budget_range || null,
      data.deadline || null,
      data.hide_identity || 0,
      data.status || 'open'
    );
    
    return info.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT p.*, a.agency_name, a.rating_average, a.rating_count
      FROM projects p
      JOIN agencies a ON p.agency_id = a.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  static findAll(filters = {}) {
    let query = `
      SELECT p.*, a.agency_name, a.rating_average, a.subscription_tier
      FROM projects p
      JOIN agencies a ON p.agency_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.project_type) {
      query += ' AND p.project_type = ?';
      params.push(filters.project_type);
    }

    if (filters.platform) {
      query += ' AND p.platforms_involved LIKE ?';
      params.push(`%${filters.platform}%`);
    }

    if (filters.agency_id) {
      query += ' AND p.agency_id = ?';
      params.push(filters.agency_id);
    }

    // Premium agencies appear first
    query += ' ORDER BY a.subscription_tier DESC, p.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static findByAgency(agencyId) {
    const stmt = db.prepare(`
      SELECT * FROM projects 
      WHERE agency_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(agencyId);
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    return info.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static getResponseCount(projectId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM responses WHERE project_id = ?');
    return stmt.get(projectId).count;
  }
}

module.exports = Project;
