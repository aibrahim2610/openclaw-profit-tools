const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./data/guardian.db');

exports.initializeDatabase = async function() {
  return new Promise((resolve, reject) = > {
    db.serialize(function() {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TEXT,
        subscription_level TEXT DEFAULT 'free',
        opted_in BOOLEAN DEFAULT 1,
        revenue_generated REAL DEFAULT 0
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
      
      db.run(`CREATE TABLE IF NOT EXISTS revenue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        source TEXT DEFAULT 'automated',
        timestamp TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        timestamp TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS upsell_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        offer_details TEXT NOT NULL,
        accepted BOOLEAN DEFAULT 0,
        timestamp TEXT
      )`);
      
      resolve();
    });
  });
};

exports.getUserByEmail = async function(email) {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) = > {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

exports.createUser = async function(email, name) {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO users (email, name, created_at) VALUES (?, ?, ?)`,
      [email, name || "", new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.storeBreach = async function(email, breaches) {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO breaches (email, breaches, timestamp) VALUES (?, ?, ?)`,
      [email, JSON.stringify(breaches), new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.getBreaches = async function(email) {
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
};

exports.storeRevenue = async function(amount, source) {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO revenue (amount, source, timestamp) VALUES (?, ?, ?)`,
      [amount, source || 'automated', new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.getWeeklyRevenue = async function() {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT SUM(amount) as total FROM revenue WHERE timestamp >= datetime('now', '-7 days')`,
      [], (err, row) = > {
        if (err) return reject(err);
        resolve(row?.total || 0);
      }
    );
  });
};

exports.getMonthlyRevenue = async function() {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT SUM(amount) as total FROM revenue WHERE timestamp >= datetime('now', '-30 days')`,
      [], (err, row) = > {
        if (err) return reject(err);
        resolve(row?.total || 0);
      }
    );
  });
};

exports.getTotalUsers = async function() {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT COUNT(*) as total FROM users`, [], (err, row) = > {
      if (err) return reject(err);
      resolve(row?.total || 0);
    });
  });
};

exports.getActiveUsers = async function() {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT COUNT(*) as total FROM users WHERE opted_in = 1`, [], (err, row) = > {
      if (err) return reject(err);
      resolve(row?.total || 0);
    });
  });
};

exports.createTransaction = async function(email, amount, description) {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO transactions (email, amount, description, timestamp) VALUES (?, ?, ?, ?)`,
      [email, amount, description, new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.storeUpsellOffer = async function(email, offerDetails) {
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO upsell_offers (email, offer_details, timestamp) VALUES (?, ?, ?)`,
      [email, offerDetails, new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.acceptUpsellOffer = async function(id) {
  return new Promise((resolve, reject) = > {
    db.run(`UPDATE upsell_offers SET accepted = 1 WHERE id = ?`, [id],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

exports.getRevenueBySource = async function() {
  return new Promise((resolve, reject) = > {
    db.all(`SELECT source, SUM(amount) as total FROM revenue GROUP BY source`, [], (err, rows) = > {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

exports.getTopUsersByRevenue = async function(limit) {
  return new Promise((resolve, reject) = > {
    db.all(`SELECT email, SUM(amount) as total_revenue FROM transactions GROUP BY email ORDER BY total_revenue DESC LIMIT ?`, [limit], (err, rows) = > {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

exports.getConversionRate = async function() {
  return new Promise((resolve, reject) = > {
    db.get(`SELECT 
      CAST((SELECT COUNT(*) FROM users WHERE subscription_level != 'free') AS REAL) / 
      CAST((SELECT COUNT(*) FROM users) AS REAL) * 100 as conversion_rate`, [], (err, row) = > {
        if (err) return reject(err);
        resolve(row?.conversion_rate || 0);
      }
    );
  });
};

exports.getRevenueTrend = async function(days) {
  return new Promise((resolve, reject) = > {
    db.all(`SELECT 
      DATE(timestamp) as date, 
      SUM(amount) as daily_revenue 
    FROM revenue 
    WHERE timestamp >= datetime('now', ?)
    GROUP BY DATE(timestamp)
    ORDER BY date ASC`, [`-${days} days`], (err, rows) = > {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

exports.default = db;