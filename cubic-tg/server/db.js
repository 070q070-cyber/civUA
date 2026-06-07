// server/db.js — MongoDB Atlas (постійне збереження)
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'cubic_civ';

let client = null;
let db = null;
let connecting = false;

async function connect() {
  if (db) {
    // Перевіряємо чи з'єднання живе
    try { await db.command({ ping: 1 }); return db; } catch(e) {
      console.warn('⚠️ MongoDB ping failed, reconnecting...');
      db = null; client = null;
    }
  }
  if (connecting) {
    // Чекаємо поки інший connect завершиться
    await new Promise(r => setTimeout(r, 500));
    return db;
  }
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI не вказаний — використовую in-memory fallback');
    return null;
  }
  connecting = true;
  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
      retryWrites: true,
    });
    await client.connect();
    db = client.db(DB_NAME);
    await db.collection('saves').createIndex({ tg_id: 1 }, { unique: true });
    await db.collection('saves').createIndex({ score: -1 });
    console.log('✅ MongoDB підключено');

    // Обробка розриву з'єднання
    client.on('close', () => { console.warn('⚠️ MongoDB з\'єднання закрито'); db = null; });
    client.on('error', e => { console.error('MongoDB error:', e.message); db = null; });

    return db;
  } catch (e) {
    console.error('❌ MongoDB помилка підключення:', e.message);
    db = null; client = null;
    return null;
  } finally {
    connecting = false;
  }
}

// Автоматичний keep-alive пінг кожні 4 хвилини (Render засинає через 15хв)
setInterval(async () => {
  try {
    const d = await connect();
    if (d) await d.command({ ping: 1 });
  } catch(e) { /* ігноруємо */ }
}, 4 * 60 * 1000);

// In-memory fallback якщо MongoDB недоступна
const memStore = { players: {}, saves: {} };

const upsertPlayer = {
  async run({ tg_id, username, first_name, last_name }) {
    const d = await connect();
    if (!d) {
      memStore.players[tg_id] = { tg_id, username, first_name, last_name, last_seen: Date.now() };
      return;
    }
    await d.collection('players').updateOne(
      { tg_id },
      { $set: { username, first_name, last_name, last_seen: Date.now() },
        $setOnInsert: { created_at: Date.now() } },
      { upsert: true }
    );
  }
};

const upsertSave = {
  async run({ tg_id, save_data, epoch, score }) {
    const d = await connect();
    if (!d) {
      console.warn(`⚠️ Збереження в пам'ять (MongoDB недоступна) для ${tg_id}`);
      memStore.saves[tg_id] = { tg_id, save_data, epoch, score, updated_at: Date.now() };
      return;
    }
    await d.collection('saves').updateOne(
      { tg_id },
      { $set: { save_data, epoch, score, updated_at: Date.now() },
        $setOnInsert: { created_at: Date.now() } },
      { upsert: true }
    );
  }
};

const getSave = {
  async get(tg_id) {
    const d = await connect();
    if (!d) return memStore.saves[tg_id] || null;
    return await d.collection('saves').findOne({ tg_id }, { projection: { save_data: 1 } });
  }
};

const getLeaderboard = {
  async all() {
    const d = await connect();
    if (!d) {
      return Object.values(memStore.saves)
        .sort((a, b) => b.score - a.score).slice(0, 10)
        .map(s => ({ ...s, ...(memStore.players[s.tg_id] || {}) }));
    }
    return await d.collection('saves').aggregate([
      { $sort: { score: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'players', localField: 'tg_id', foreignField: 'tg_id', as: 'player' } },
      { $unwind: { path: '$player', preserveNullAndEmpty: true } },
      { $project: {
          tg_id: 1, epoch: 1, score: 1,
          first_name: { $ifNull: ['$player.first_name', 'Гравець'] },
          username: '$player.username'
      }}
    ]).toArray();
  }
};

const getPlayerRank = {
  async get(tg_id) {
    const d = await connect();
    if (!d) {
      const my = memStore.saves[tg_id];
      if (!my) return { rank: null };
      const rank = Object.values(memStore.saves).filter(s => s.score > my.score).length + 1;
      return { rank };
    }
    const my = await d.collection('saves').findOne({ tg_id }, { projection: { score: 1 } });
    if (!my) return { rank: null };
    const rank = await d.collection('saves').countDocuments({ score: { $gt: my.score } });
    return { rank: rank + 1 };
  }
};

module.exports = { connect, upsertPlayer, upsertSave, getSave, getLeaderboard, getPlayerRank };
