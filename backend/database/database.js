// ==========================================
// DATABASE CONNECTION - SQLITE
// This section creates the database connection
// and initializes the required tables.
// ==========================================

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath = path.join(__dirname, "noty.sqlite");
const db = new sqlite3.Database(databasePath, (error) => {
  if (error) {
    console.error("Error connecting to SQLite:", error.message);
    return;
  }

  console.log("Connected to SQLite database.");
});

// ==========================================
// TABLE CREATION SECTION
// These SQL statements create the users and
// notes tables if they do not already exist.
// ==========================================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
});

module.exports = db;
