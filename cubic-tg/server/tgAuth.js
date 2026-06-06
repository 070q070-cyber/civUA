// server/tgAuth.js
const crypto = require('crypto');

function verifyTelegramWebApp(initData, botToken) {
  if (!initData) return { ok: false, error: 'No initData' };
  if (!botToken) return { ok: false, error: 'No BOT_TOKEN configured' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'No hash in initData' };

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (expectedHash !== hash) return { ok: false, error: 'Invalid hash' };

  // Перевірка свіжості — 24 години
  const authDate = parseInt(params.get('auth_date') || '0');
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return { ok: false, error: 'Data expired' };

  let user = null;
  try { user = JSON.parse(params.get('user') || 'null'); } catch { return { ok: false, error: 'Bad user JSON' }; }

  return { ok: true, user };
}

function requireTgAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData || '';
  const botToken = process.env.BOT_TOKEN || '';

  // DEV режим — обходимо перевірку
  if (process.env.NODE_ENV !== 'production') {
    const devId = req.headers['x-dev-user-id'];
    if (devId) {
      req.tgUser = { id: parseInt(devId), first_name: 'Dev', username: 'dev' };
      return next();
    }
    // В dev без initData — дозволяємо анонімно з фейковим ID
    if (!initData) {
      req.tgUser = { id: 0, first_name: 'Anonymous', username: null };
      return next();
    }
  }

  // Якщо initData є — перевіряємо
  if (initData) {
    const result = verifyTelegramWebApp(initData, botToken);
    if (result.ok) {
      req.tgUser = result.user;
      return next();
    }
    console.warn('TG auth failed:', result.error);
  }

  // FALLBACK: якщо initData порожній але є user_id в body — приймаємо
  // (деякі версії Telegram WebApp не передають initData коректно)
  const fallbackId = req.body?.tg_user_id;
  if (fallbackId && typeof fallbackId === 'number') {
    req.tgUser = { id: fallbackId, first_name: req.body?.tg_first_name || 'Гравець', username: null };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { verifyTelegramWebApp, requireTgAuth };
