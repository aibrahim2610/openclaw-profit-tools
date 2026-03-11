import { createConnection } from "sqlite3";

const db = createConnection("./data/guardian.db");

export async function getUserByEmail(email: string): Promise<any> {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) = > {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

export async function createUser(email: string, name?: string): Promise<void> {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO users (email, name, created_at) VALUES (?, ?, ?)`,
      [email, name || "", new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

export async function storeBreach(email: string, breaches: any[]): Promise<void> {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO breaches (email, breaches, timestamp) VALUES (?, ?, ?)`,
      [email, JSON.stringify(breaches), new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

export async function getBreaches(email: string): Promise<any[]> {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT breaches FROM breaches WHERE email = ? ORDER BY timestamp DESC LIMIT 1`,
      [email], (err, row) = > {
        if (err) return reject(err);
        if (!row) return resolve([]);
        try {
          resolve(JSON.parse(row.breaches) || []);
        } catch (e) {
          resolve([]);
        }
      });
  });
}

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) = > {
    db.serialize(function() {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TEXT,
        subscription_level TEXT DEFAULT 'free',
        opted_in BOOLEAN DEFAULT 1
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS breaches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        breaches TEXT NOT NULL,
        timestamp TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS removal_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        sites TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        next_billing_date TEXT,
        created_at TEXT
      )`);
      
      resolve();
    });
  });
}

export default db;