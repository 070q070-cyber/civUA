// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const { connect, upsertPlayer, upsertSave, getSave, getLeaderboard, getPlayerRank } = require('./db');
const { requireTgAuth } = require('./tgAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const GAME_URL = process.env.GAME_URL || `http://localhost:${PORT}`;
const BOT_TOKEN = process.env.BOT_TOKEN;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================
// DB — підключення з retry
// ============================================================
async function connectWithRetry(attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      await connect();
      console.log('✅ MongoDB підключено');
      return true;
    } catch (e) {
      console.error(`❌ MongoDB спроба ${i+1}/${attempts}:`, e.message);
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return false;
}
connectWithRetry();

// ============================================================
// BOT
// ============================================================
let bot;
if (BOT_TOKEN) {
  const botMode = process.env.BOT_MODE || (GAME_URL.includes('localhost') ? 'polling' : 'webhook');
  if (botMode === 'webhook') {
    bot = new TelegramBot(BOT_TOKEN, { webHook: true });
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    bot.deleteWebHook().then(() => {
      bot.setWebHook(`${GAME_URL}${webhookPath}`);
      console.log('🤖 Бот: webhook →', `${GAME_URL}${webhookPath}`);
    });
    app.post(webhookPath, (req, res) => { bot.processUpdate(req.body); res.sendStatus(200); });
  } else {
    bot = new TelegramBot(BOT_TOKEN, { polling: { interval: 2000, autoStart: true } });
    console.log('🤖 Бот: polling');
  }
  setupBotHandlers(bot);
} else {
  console.warn('⚠️  BOT_TOKEN не вказаний');
}

function setupBotHandlers(bot) {
  bot.onText(/\/start/, async (msg) => {
    const name = msg.from.first_name || 'Мандрівнику';
    await bot.sendMessage(msg.chat.id,
      `⚒ *Ласкаво просимо до Кубічної Цивілізації!*\n\nПривіт, ${name}!\n\n🏰 Побудуй цивілізацію від кам\'яного віку до автоматизованого майбутнього!\n⚔️ Захищай місто від хвиль гоблінів\n🔬 Досліджуй 12 епох розвитку\n🏆 Змагайся у рейтингу\n\n👇 Натисни кнопку нижче!`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '⚒ ГРАТИ', web_app: { url: GAME_URL } }]] } }
    );
  });
  bot.onText(/\/play/, async (msg) => {
    await bot.sendMessage(msg.chat.id, '▶️ Відкрий гру:', {
      reply_markup: { inline_keyboard: [[{ text: '⚒ ГРАТИ', web_app: { url: GAME_URL } }]] }
    });
  });
  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      `⚒ *Кубічна Цивілізація — Довідка*\n\n📦 Клікай по ресурсах\n🏗 Будуй виробничі споруди\n🔬 Відкривай технології\n⚔️ Захищай місто від гоблінів\n💾 Прогрес зберігається автоматично!`,
      { parse_mode: 'Markdown' }
    );
  });
  bot.onText(/\/top|\/leaderboard/, async (msg) => {
    try {
      const rows = await getLeaderboard.all();
      if (!rows.length) return bot.sendMessage(msg.chat.id, '📊 Рейтинг поки порожній!');
      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
      const lines = rows.map((r, i) => {
        const name = r.username ? `@${r.username}` : r.first_name;
        return `${medals[i]} ${name} — Еп.${r.epoch} · ${(r.score||0).toLocaleString()}`;
      });
      const rankRow = await getPlayerRank.get(msg.from.id);
      await bot.sendMessage(msg.chat.id,
        `🏆 *ТОП-10*\n\n${lines.join('\n')}\n\n📍 Твій ранг: *#${rankRow?.rank || '?'}*`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      bot.sendMessage(msg.chat.id, '⚠️ Помилка завантаження рейтингу');
    }
  });
  bot.on('polling_error', e => console.error('Polling:', e.message));
}

// ============================================================
// DB retry wrapper
// ============================================================
async function withDbRetry(fn, res) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`DB error (спроба ${i+1}/3):`, e.message);
      if (i < 2) {
        await connect().catch(() => {});
        await new Promise(r => setTimeout(r, 1500));
      } else {
        if (!res.headersSent) res.status(500).json({ ok: false, error: 'DB error' });
      }
    }
  }
}

// ============================================================
// API
// ============================================================
app.get('/api/save', requireTgAuth, async (req, res) => {
  await withDbRetry(async () => {
    const row = await getSave.get(req.tgUser.id);
    if (!row) return res.json({ ok: true, save: null });
    res.json({ ok: true, save: JSON.parse(row.save_data) });
  }, res);
});

app.post('/api/save', requireTgAuth, async (req, res) => {
  const { state, epoch = 1, score = 0 } = req.body;
  if (!state || typeof state !== 'object') return res.status(400).json({ ok: false, error: 'Invalid state' });
  if (state._reset) return res.json({ ok: true });
  console.log(`💾 Save: user=${req.tgUser?.id} epoch=${epoch} score=${score}`);
  await withDbRetry(async () => {
    const user = req.tgUser;
    await upsertPlayer.run({
      tg_id: user.id,
      username: user.username || null,
      first_name: user.first_name || 'Гравець',
      last_name: user.last_name || null,
    });
    await upsertSave.run({
      tg_id: user.id,
      save_data: JSON.stringify(state),
      epoch: Math.max(1, Math.min(12, parseInt(epoch) || 1)),
      score: Math.max(0, parseInt(score) || 0),
    });
    res.json({ ok: true });
  }, res);
});

app.get('/api/leaderboard', async (req, res) => {
  await withDbRetry(async () => {
    const rows = await getLeaderboard.all();
    res.json({ ok: true, data: rows });
  }, res);
});

app.get('/api/rank/:tg_id', async (req, res) => {
  await withDbRetry(async () => {
    const row = await getPlayerRank.get(parseInt(req.params.tg_id));
    res.json({ ok: true, rank: row?.rank || null });
  }, res);
});

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: Math.floor(process.uptime()), ts: Date.now() });
});

// ============================================================
// KEEP ALIVE — через Telegram bot (надійніше ніж self-ping)
// Кожні 14 хвилин бот надсилає webhook запит сам собі
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🎮 Сервер запущено на порту ${PORT}`);
  console.log(`🌐 ${GAME_URL}`);

  if (GAME_URL && !GAME_URL.includes('localhost')) {
    // Ping через зовнішній запит до власного /health
    // Render блокує self-ping але не блокує зовнішні запити
    const keepAlive = () => {
      const https = require('https');
      const url = new URL(GAME_URL + '/health');
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: { 'User-Agent': 'KeepAlive/1.0' }
      };
      const req = https.request(options, r => {
        console.log(`🏓 Keep-alive: ${r.statusCode} (uptime: ${Math.floor(process.uptime())}s)`);
      });
      req.on('error', e => console.warn('Keep-alive error:', e.message));
      req.end();
    };

    // Пінгуємо кожні 14 хвилин
    setInterval(keepAlive, 14 * 60 * 1000);
    // Перший пінг через 1 хвилину після старту
    setTimeout(keepAlive, 60 * 1000);
    console.log('🏓 Keep-alive активовано (кожні 14 хв)');
  }
});
