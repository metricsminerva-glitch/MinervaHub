const db = require('./db');

class Ticket {
    static create({ agency_id, title, category, status, message }) {
        const stmt = db.prepare(`
            INSERT INTO tickets (agency_id, title, category, status, message)
            VALUES (?, ?, ?, ?, ?)
        `);
        const info = stmt.run(agency_id, title, category, status, message);
        return info.lastInsertRowid;
    }

    static getAll() {
        return db.prepare('SELECT t.*, a.agency_name FROM tickets t JOIN agencies a ON t.agency_id = a.id ORDER BY t.created_at DESC').all();
    }

    static getByAgency(agency_id) {
        return db.prepare('SELECT * FROM tickets WHERE agency_id = ? ORDER BY created_at DESC').all(agency_id);
    }

    static getById(id) {
        return db.prepare('SELECT t.*, a.agency_name FROM tickets t JOIN agencies a ON t.agency_id = a.id WHERE t.id = ?').get(id);
    }

    static updateStatus(id, status) {
        const stmt = db.prepare('UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(status, id);
    }

    static delete(id) {
        const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
        return stmt.run(id);
    }
}

class TicketResponse {
    static create({ ticket_id, user_type, user_id, message }) {
        const stmt = db.prepare(`
            INSERT INTO ticket_responses (ticket_id, user_type, user_id, message)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(ticket_id, user_type, user_id, message);
        return info.lastInsertRowid;
    }

    static getByTicket(ticket_id) {
        return db.prepare('SELECT * FROM ticket_responses WHERE ticket_id = ? ORDER BY created_at ASC').all(ticket_id);
    }
}

module.exports = { Ticket, TicketResponse };
