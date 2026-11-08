// SQLite storage using Node's built-in driver (Node >= 22.13, no native build needed)
process.removeAllListeners('warning'); // hide the "SQLite is experimental" notice on older Node 22
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'codecoast.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ambassadors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  college TEXT NOT NULL,
  department TEXT,
  semester TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name TEXT NOT NULL,
  track TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT NOT NULL,
  college TEXT NOT NULL,
  members TEXT NOT NULL,          -- JSON array of {name,email}
  idea TEXT,
  referral_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | shortlisted | rejected
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  badge TEXT,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  mrp INTEGER NOT NULL,
  color TEXT,
  image TEXT NOT NULL,
  has_sizes INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_ref TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT,
  items TEXT NOT NULL,            -- JSON
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | ready | collected | cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'general',     -- general | sponsor
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  tier TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',       -- new | replied | closed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Seed merch catalogue once
const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
if (!count) {
  const ins = db.prepare(`INSERT INTO products (id,slug,name,category,badge,description,price,mrp,color,image,has_sizes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  ins.run('tee-white', 'official-tee-sea-salt', 'OFFICIAL TEE - Sea Salt', 'APPAREL', null,
    'A crisp sea-salt white tee with the CodeCoast pixel wave on the chest. Oversized fit is a heavy 240 GSM cotton; Regular fit is 180 GSM with standard sleeves.',
    299, 599, 'White', '/assets/merch/tee-white.svg', 1);
  ins.run('tee-navy', 'official-tee-deep-ocean', 'OFFICIAL TEE - Deep Ocean', 'APPAREL', null,
    'Deep-ocean navy tee with a lime pixel wave print. Oversized fit is a heavy 240 GSM cotton; Regular fit is 180 GSM with standard sleeves.',
    299, 599, 'Navy', '/assets/merch/tee-navy.svg', 1);
  ins.run('stickers', 'hacker-sticker-pack', 'HACKER STICKER PACK', 'ACCESSORIES', 'NEW DROP',
    'Twelve weatherproof vinyl stickers for your laptop — pixel waves, terminal jokes and the CodeCoast mascot.',
    49, 99, 'Mixed', '/assets/merch/stickers.svg', 0);
}

module.exports = db;
