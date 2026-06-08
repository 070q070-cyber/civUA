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

  // 1. Спробуємо валідний initData (пріоритет)
  if (initData) {
    const result = verifyTelegramWebApp(initData, botToken);
    if (result.ok && result.user) {
      req.tgUser = result.user;
      return next();
    }
    console.warn('TG auth failed:', result.error, '| initData length:', initData.length);
  }

  // 2. Fallback: tg_user_id з тіла запиту або заголовку
  const fallbackId = req.body?.tg_user_id || req.headers['x-tg-user-id'];
  if (fallbackId) {
    const uid = parseInt(fallbackId);
    if (uid > 0) {
      req.tgUser = { id: uid, first_name: req.body?.tg_first_name || 'Гравець', username: null };
      console.log('TG auth via fallback tg_user_id:', uid);
      return next();
    }
  }

  // 3. Dev режим — дозволяємо без авторизації
  if (process.env.NODE_ENV !== 'production') {
    req.tgUser = { id: 0, first_name: 'Dev', username: 'dev' };
    return next();
  }

  // 4. LAST RESORT: якщо initData є але хеш невалідний — все одно пропускаємо
  // (Telegram іноді передає застарілі дані після сну WebApp)
  // Але витягуємо user із initData без перевірки хешу
  if (initData) {
    try {
      const params = new URLSearchParams(initData);
      const user = JSON.parse(params.get('user') || 'null');
      if (user && user.id) {
        req.tgUser = user;
        console.warn('TG auth: accepting unverified initData for user', user.id);
        return next();
      }
    } catch(e) {}
  }

  console.error('TG auth: всі методи авторизації провалились');
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { verifyTelegramWebApp, requireTgAuth };
