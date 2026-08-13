import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { apps, seedVotes } from './apps.js';

let database;

function dbPath() {
  if (process.env.SQLITE_PATH) return process.env.SQLITE_PATH;
  if (process.env.VERCEL) return '/tmp/can-i-vibecode-it.sqlite';
  return join(process.cwd(), 'data', 'can-i-vibecode-it.sqlite');
}

export function getDb() {
  if (database) return database;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  database = new Database(path, { timeout: 5000 });
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(`
    CREATE TABLE IF NOT EXISTS vote_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_slug TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      rate_window TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_slug, ip_hash, rate_window)
    );
    CREATE INDEX IF NOT EXISTS idx_vote_events_slug ON vote_events(app_slug);
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'homepage',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS build_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      details TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_build_requests_email ON build_requests(email);
  `);
  return database;
}

export function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || 'local-development-salt-change-me';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function rateWindow(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function voteForApp(slug, ip) {
  if (!apps.some((app) => app.slug === slug)) throw new Error('Unknown app');
  const db = getDb();
  const info = db.prepare(`
    INSERT OR IGNORE INTO vote_events (app_slug, ip_hash, rate_window)
    VALUES (?, ?, ?)
  `).run(slug, hashIp(ip), rateWindow());
  return {
    accepted: info.changes === 1,
    count: getVoteCount(slug)
  };
}

export function getVoteCount(slug) {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS count FROM vote_events WHERE app_slug = ?').get(slug);
  return (seedVotes[slug] || 0) + Number(row?.count || 0);
}

export function getVoteCounts() {
  const db = getDb();
  const rows = db.prepare('SELECT app_slug, COUNT(*) AS count FROM vote_events GROUP BY app_slug').all();
  /** @type {Record<string, number>} */
  const counts = { ...seedVotes };
  for (const row of rows) counts[row.app_slug] = (counts[row.app_slug] || 0) + Number(row.count);
  return counts;
}

export function joinWaitlist(email, source = 'homepage') {
  const normalized = email.trim().toLowerCase();
  const db = getDb();
  const info = db.prepare('INSERT OR IGNORE INTO waitlist (email, source) VALUES (?, ?)').run(normalized, source.slice(0, 80));
  return { accepted: info.changes === 1, email: normalized };
}

export function createBuildRequest({ appSlug, name, email, details, preferredDate, preferredTime, ip }) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO build_requests (
      app_slug, name, email, details, preferred_date, preferred_time, ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    appSlug.slice(0, 120),
    name.slice(0, 100),
    email.trim().toLowerCase().slice(0, 254),
    details.slice(0, 2000),
    preferredDate.slice(0, 10),
    preferredTime.slice(0, 40),
    hashIp(ip)
  );
  return { id: Number(info.lastInsertRowid) };
}
