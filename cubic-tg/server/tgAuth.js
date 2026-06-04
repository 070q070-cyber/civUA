// server/tgAuth.js — Перевірка підпису Telegram WebApp
const crypto = require('crypto');

/**
 * Перевіряємо що запит справді від Telegram WebApp.
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * @param {string} initData  — рядок з window.Telegram.WebApp.initData
 * @param {string} botToken  — токен бота
 * @returns {{ ok: boolean, user?: object, error?: string }}
 */
function verifyTelegramWebApp(initData, botToken) {
  if (!initData) return { ok: false, error: 'No initData' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'No hash' };

  // Збираємо рядок для перевірки (всі поля крім hash, відсортовані)
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // HMAC-SHA256: secret_key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    return { ok: false, error: 'Invalid hash' };
  }

  // Перевіряємо свіжість (не старіше 24 годин)
  const authDate = parseInt(params.get('auth_date') || '0');
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    return { ok: false, error: 'Data is too old' };
  }

  // Парсимо user
  let user = null;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    return { ok: false, error: 'Invalid user JSON' };
  }

  return { ok: true, user };
}

/**
 * Express middleware — перевіряє Telegram підпис.
 * Додає req.tgUser якщо все ок.
 */
function requireTgAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData;
  const botToken = process.env.BOT_TOKEN;

  const result = verifyTelegramWebApp(initData, botToken);

  if (!result.ok) {
    // В режимі dev дозволяємо тестовий user_id через хедер
    if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user-id']) {
      req.tgUser = { id: parseInt(req.headers['x-dev-user-id']), first_name: 'Dev', username: 'dev' };
      return next();
    }
    return res.status(401).json({ error: result.error });
  }

  req.tgUser = result.user;
  next();
}

module.exports = { verifyTelegramWebApp, requireTgAuth };
