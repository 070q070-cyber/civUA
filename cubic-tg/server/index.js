// server/index.js — Головний сервер
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const { upsertPlayer, upsertSave, getSave, getLeaderboard, getPlayerRank } = require('./db');
const { requireTgAuth } = require('./tgAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const GAME_URL = process.env.GAME_URL || `http://localhost:${PORT}`;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json({ limit: '2mb' }));  // стейт гри може бути великим

// Роздаємо статичні файли (гра)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================
// BOT SETUP
// ============================================================
let bot;
if (BOT_TOKEN) {
  const botMode = process.env.BOT_MODE || 'polling';

  if (botMode === 'webhook') {
    bot = new TelegramBot(BOT_TOKEN, { webHook: true });
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    bot.setWebHook(`${GAME_URL}${webhookPath}`);
    app.post(webhookPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    console.log('🤖 Бот: webhook режим');
  } else {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });
    console.log('🤖 Бот: polling режим');
  }

  setupBotHandlers(bot);
} else {
  console.warn('⚠️  BOT_TOKEN не вказаний — бот вимкнений');
}

// ============================================================
// BOT HANDLERS
// ============================================================
function setupBotHandlers(bot) {
  // /start — привітання + кнопка гри
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Мандрівнику';

    await bot.sendMessage(chatId,
      `⚒ *Ласкаво просимо до Кубічної Цивілізації!*\n\n` +
      `Привіт, ${firstName}!\n\n` +
      `🏰 Побудуй цивілізацію від кам'яного віку до автоматизованого майбутнього!\n` +
      `⚔️ Захищай місто від хвиль гоблінів\n` +
      `🔬 Досліджуй 12 епох розвитку\n` +
      `🏆 Змагайся з іншими гравцями у рейтингу\n\n` +
      `👇 Натисни кнопку нижче щоб почати!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '⚒ ГРАТИ',
              web_app: { url: GAME_URL }
            }
          ]]
        }
      }
    );
  });

  // /help
  bot.onText(/\/help/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      `⚒ *Кубічна Цивілізація — Довідка*\n\n` +
      `📦 *РЕСУРСИ* — клікай по кнопках видобутку\n` +
      `🏗 *БУДІВЛІ* — будуй виробничі ланцюги\n` +
      `🔬 *ТЕХНОЛОГІЇ* — відкривай бонуси\n` +
      `⚔️ *ОБОРОНА* — будуй вежі й мури проти гоблінів\n` +
      `🤖 *АВТОКЛІКЕР* — автоматизуй збір ресурсів\n` +
      `📜 *КВЕСТИ* — виконуй завдання за нагороди\n\n` +
      `💾 Прогрес *автоматично зберігається* у хмарі!`,
      { parse_mode: 'Markdown' }
    );
  });

  // /leaderboard
  bot.onText(/\/top|\/leaderboard/, async (msg) => {
    try {
      const rows = getLeaderboard.all();
      if (rows.length === 0) {
        return bot.sendMessage(msg.chat.id, '📊 Рейтинг поки порожній — стань першим!');
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const lines = rows.map((r, i) => {
        const name = r.username ? `@${r.username}` : r.first_name;
        return `${medals[i]} ${name} — Еп.${r.epoch} · ${r.score.toLocaleString()} очок`;
      });

      // Ранг поточного гравця
      const rankRow = getPlayerRank.get(msg.from.id);
      const myRank = rankRow ? rankRow.rank : '?';

      await bot.sendMessage(msg.chat.id,
        `🏆 *ТОП-10 ГРАВЦІВ*\n\n${lines.join('\n')}\n\n` +
        `📍 Твій ранг: *#${myRank}*`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('leaderboard error:', e);
      bot.sendMessage(msg.chat.id, '⚠️ Помилка завантаження рейтингу');
    }
  });

  // /play — кнопка гри
  bot.onText(/\/play/, async (msg) => {
    await bot.sendMessage(msg.chat.id, '▶️ Відкрий гру:', {
      reply_markup: {
        inline_keyboard: [[{ text: '⚒ ГРАТИ', web_app: { url: GAME_URL } }]]
      }
    });
  });

  bot.on('polling_error', (err) => console.error('Polling error:', err.message));
}

// ============================================================
// API ROUTES
// ============================================================

/**
 * GET /api/save
 * Завантаження збереження гравця
 */
app.get('/api/save', requireTgAuth, (req, res) => {
  try {
    const row = getSave.get(req.tgUser.id);
    if (!row) {
      return res.json({ ok: true, save: null }); // нова гра
    }
    res.json({ ok: true, save: JSON.parse(row.save_data) });
  } catch (e) {
    console.error('GET /api/save error:', e);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

/**
 * POST /api/save
 * Збереження стану гри
 * Body: { initData, state: {...}, epoch, score }
 */
app.post('/api/save', requireTgAuth, (req, res) => {
  try {
    const { state, epoch = 1, score = 0 } = req.body;

    if (!state || typeof state !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid state' });
    }

    const user = req.tgUser;

    // Зберігаємо/оновлюємо гравця
    upsertPlayer.run({
      tg_id: user.id,
      username: user.username || null,
      first_name: user.first_name || 'Гравець',
      last_name: user.last_name || null,
    });

    // Зберігаємо стейт
    upsertSave.run({
      tg_id: user.id,
      save_data: JSON.stringify(state),
      epoch: Math.max(1, Math.min(12, parseInt(epoch) || 1)),
      score: Math.max(0, parseInt(score) || 0),
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/save error:', e);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

/**
 * GET /api/leaderboard
 * Топ-10 гравців для відображення в грі
 */
app.get('/api/leaderboard', (req, res) => {
  try {
    const rows = getLeaderboard.all();
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error('GET /api/leaderboard error:', e);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

/**
 * GET /api/rank/:tg_id
 * Ранг конкретного гравця
 */
app.get('/api/rank/:tg_id', (req, res) => {
  try {
    const row = getPlayerRank.get(parseInt(req.params.tg_id));
    res.json({ ok: true, rank: row ? row.rank : null });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🎮 Кубічна Цивілізація запущена!`);
  console.log(`🌐 Сервер: http://localhost:${PORT}`);
  console.log(`🎯 Гра: ${GAME_URL}`);
  console.log(`📁 Статика: public/`);
});
