// server/db.js — База даних на lowdb (чистий JS, без компіляції)
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const adapter = new FileSync(path.join(DB_DIR, 'game.json'));
const db = low(adapter);

// Дефолтна структура
db.defaults({ players: [], saves: [] }).write();

// ============================================================
// ХЕЛПЕРИ (імітують інтерфейс better-sqlite3)
// ============================================================

const upsertPlayer = {
  run({ tg_id, username, first_name, last_name }) {
    const players = db.get('players');
    const existing = players.find({ tg_id }).value();
    if (existing) {
      players.find({ tg_id }).assign({ username, first_name, last_name, last_seen: Date.now() }).write();
    } else {
      players.push({ tg_id, username, first_name, last_name, created_at: Date.now(), last_seen: Date.now() }).write();
    }
  }
};

const upsertSave = {
  run({ tg_id, save_data, epoch, score }) {
    const saves = db.get('saves');
    const existing = saves.find({ tg_id }).value();
    if (existing) {
      saves.find({ tg_id }).assign({ save_data, epoch, score, updated_at: Date.now() }).write();
    } else {
      saves.push({ tg_id, save_data, epoch, score, updated_at: Date.now() }).write();
    }
  }
};

const getSave = {
  get(tg_id) {
    return db.get('saves').find({ tg_id }).value() || null;
  }
};

const getLeaderboard = {
  all() {
    const saves = db.get('saves').value();
    const players = db.get('players').value();
    return saves
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => {
        const p = players.find(p => p.tg_id === s.tg_id) || {};
        return { tg_id: s.tg_id, first_name: p.first_name || 'Гравець', username: p.username || null, epoch: s.epoch, score: s.score };
      });
  }
};

const getPlayerRank = {
  get(tg_id) {
    const mySave = db.get('saves').find({ tg_id }).value();
    if (!mySave) return { rank: null };
    const myScore = mySave.score || 0;
    const rank = db.get('saves').value().filter(s => s.score > myScore).length + 1;
    return { rank };
  }
};

module.exports = { db, upsertPlayer, upsertSave, getSave, getLeaderboard, getPlayerRank };
