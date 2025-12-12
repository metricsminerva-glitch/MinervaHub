const db = require('./db');

class ContactMessage {
    static create({ name, email, subject, message }) {
        const stmt = db.prepare(`
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(name, email, subject, message);
        return info.lastInsertRowid;
    }

    static getAll() {
        return db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    }

    static getById(id) {
        return db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    }

    static markAsRead(id) {
        const stmt = db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?');
        return stmt.run(id);
    }

    static getUnreadCount() {
        return db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get().count;
    }
}

module.exports = ContactMessage;
