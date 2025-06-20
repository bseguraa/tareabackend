const sqlite3 = require('sqlite3').verbose();

const createDatabase = () => {
	const db = new sqlite3.Database('./cars.db');

	db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT, is_admin INTEGER DEFAULT 0)");
	db.run("CREATE TABLE IF NOT EXISTS cars (id INTEGER PRIMARY KEY, user_id INTEGER, brand TEXT,	model TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))");

	return db;
};

module.exports = {
	createDatabase,
};