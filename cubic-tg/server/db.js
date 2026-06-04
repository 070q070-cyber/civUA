// server/db.js — Ініціалізація бази даних SQLite
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'game.db');

// Створюємо папку data якщо немає
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// WAL режим — швидше для читання/запису
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// СХЕМА БД
// ============================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    tg_id       INTEGER PRIMARY KEY,
    username    TEXT,
    first_name  TEXT,
    last_name   TEXT,
    created_at  INTEGER DEFAULT (unixepoch()),
    last_seen   INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS saves (
    tg_id       INTEGER PRIMARY KEY REFERENCES players(tg_id),
    save_data   TEXT NOT NULL,       -- JSON рядок з усім стейтом гри
    epoch       INTEGER DEFAULT 1,   -- для швидких запитів лідерборду
    score       INTEGER DEFAULT 0,
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_saves_score ON saves(score DESC);
  CREATE INDEX IF NOT EXISTS idx_saves_epoch ON saves(epoch DESC);
`);

// ============================================================
// ЗАПИТИ
// ============================================================

/** Реєструємо / оновлюємо гравця */
const upsertPlayer = db.prepare(`
  INSERT INTO players (tg_id, username, first_name, last_name, last_seen)
  VALUES (@tg_id, @username, @first_name, @last_name, unixepoch())
  ON CONFLICT(tg_id) DO UPDATE SET
    username   = excluded.username,
    first_name = excluded.first_name,
    last_name  = excluded.last_name,
    last_seen  = unixepoch()
`);

/** Зберігаємо стан гри */
const upsertSave = db.prepare(`
  INSERT INTO saves (tg_id, save_data, epoch, score, updated_at)
  VALUES (@tg_id, @save_data, @epoch, @score, unixepoch())
  ON CONFLICT(tg_id) DO UPDATE SET
    save_data  = excluded.save_data,
    epoch      = excluded.epoch,
    score      = excluded.score,
    updated_at = unixepoch()
`);

/** Завантажуємо збереження */
const getSave = db.prepare(`SELECT save_data FROM saves WHERE tg_id = ?`);

/** Топ-10 лідерів */
const getLeaderboard = db.prepare(`
  SELECT p.tg_id, p.first_name, p.username, s.epoch, s.score
  FROM saves s
  JOIN players p ON p.tg_id = s.tg_id
  ORDER BY s.score DESC
  LIMIT 10
`);

/** Ранг гравця */
const getPlayerRank = db.prepare(`
  SELECT COUNT(*) + 1 AS rank
  FROM saves
  WHERE score > (SELECT score FROM saves WHERE tg_id = ?)
`);

module.exports = {
  db,
  upsertPlayer,
  upsertSave,
  getSave,
  getLeaderboard,
  getPlayerRank,
};
