const db = require('./db');

class Agency {
  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO agencies (
        agency_name, contact_name, email, password_hash, website, 
        location, description, skills, platforms, verticals, certifications,
        subscription_tier, subscription_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.agency_name,
      data.contact_name,
      data.email,
      data.password_hash,
      data.website || null,
      data.location || null,
      data.description || null,
      data.skills || null,
      data.platforms || null,
      data.verticals || null,
      data.certifications || null,
      data.subscription_tier || 'free',
      data.subscription_status || 'active',
      data.status || 'pending'
    );
    
    return info.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM agencies WHERE id = ?');
    return stmt.get(id);
  }

  static getById(id) {
    return this.findById(id);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM agencies WHERE email = ?');
    return stmt.get(email);
  }

  static findAll(filters = {}) {
    let query = 'SELECT * FROM agencies WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.subscription_tier) {
      query += ' AND subscription_tier = ?';
      params.push(filters.subscription_tier);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
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
    const stmt = db.prepare(`UPDATE agencies SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    return info.changes > 0;
  }

  static updateRating(id) {
    // Recalculate rating average and count
    const stmt = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews
      WHERE target_agency_id = ?
    `);
    const result = stmt.get(id);

    const updateStmt = db.prepare(`
      UPDATE agencies 
      SET rating_average = ?, rating_count = ?
      WHERE id = ?
    `);
    updateStmt.run(result.avg_rating || 0, result.count || 0, id);
  }

  static updateBadges(id) {
    const agency = this.findById(id);
    const badges = [];

    // Top Collaborator: >=10 reviews, average >=4.5
    if (agency.rating_count >= 10 && agency.rating_average >= 4.5) {
      badges.push('Top Collaborator');
    }

    // Elite Member: premium tier + average >=4.5
    if (agency.subscription_tier === 'premium' && agency.rating_average >= 4.5) {
      badges.push('Elite Member');
    }

    // Elite Partner: premium tier
    if (agency.subscription_tier === 'premium') {
      badges.push('Elite Partner');
    }

    this.update(id, { badges: badges.join(',') });
  }

  static resetMonthlyCounters() {
    const stmt = db.prepare(`
      UPDATE agencies 
      SET projects_created_this_month = 0, responses_sent_this_month = 0
    `);
    return stmt.run();
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM agencies WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static getStats(id) {
    const projectsStmt = db.prepare('SELECT COUNT(*) as count FROM projects WHERE agency_id = ?');
    const responsesStmt = db.prepare('SELECT COUNT(*) as count FROM responses WHERE responder_agency_id = ?');
    const reviewsStmt = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE target_agency_id = ?');

    return {
      projects: projectsStmt.get(id).count,
      responses: responsesStmt.get(id).count,
      reviews: reviewsStmt.get(id).count
    };
  }
}

module.exports = Agency;
