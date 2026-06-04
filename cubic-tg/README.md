# ⚒ Кубічна Цивілізація — Telegram Mini App

Повна інструкція для розгортання гри в Telegram з хмарним збереженням прогресу.

---

## 📁 Структура проекту

```
cubic-tg/
├── public/
│   └── index.html          ← Гра (адаптована під Telegram + мобільний)
├── server/
│   ├── index.js            ← Express сервер + Telegram бот
│   ├── db.js               ← SQLite база даних
│   └── tgAuth.js           ← Перевірка підпису Telegram
├── data/
│   └── game.db             ← База даних (створюється автоматично)
├── .env.example            ← Шаблон налаштувань
├── package.json
└── README.md
```

---

## 🚀 КРОК 1 — Встановлення

```bash
cd cubic-tg
npm install
cp .env.example .env
```

---

## 🤖 КРОК 2 — Створення Telegram бота

1. Відкрий [@BotFather](https://t.me/BotFather) у Telegram
2. Надішли `/newbot`
3. Введи назву: `Кубічна Цивілізація`
4. Введи username: `cubic_civilization_bot` (або будь-який вільний)
5. **Скопіюй токен** і встав у `.env`:
   ```
   BOT_TOKEN=7xxxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## ☁️ КРОК 3 — Хостинг (обери один варіант)

### Варіант A: Render.com (безкоштовно, рекомендовано)

1. Зареєструйся на [render.com](https://render.com)
2. Натисни **New → Web Service**
3. Підключи свій GitHub репозиторій з цим кодом
4. Налаштування:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Environment Variables:** додай всі змінні з `.env`
5. Після деплою отримаєш URL типу `https://cubic-civ.onrender.com`

### Варіант B: Railway.app (безкоштовно)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Варіант C: VPS (Hetzner/DigitalOcean ~€4/міс)

```bash
# На сервері:
git clone <твій репо>
cd cubic-tg
npm install
# Встанови PM2 для автозапуску:
npm install -g pm2
pm2 start server/index.js --name cubic-tg
pm2 save
pm2 startup

# Nginx конфіг (приклад):
# proxy_pass http://localhost:3000;
```

---

## ⚙️ КРОК 4 — Налаштування .env

```env
BOT_TOKEN=7xxxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GAME_URL=https://cubic-civ.onrender.com   # твій URL з хостингу
PORT=3000
BOT_MODE=webhook    # webhook для продакшену, polling для локального
```

---

## 📱 КРОК 5 — Налаштування Mini App у BotFather

1. Відкрий [@BotFather](https://t.me/BotFather)
2. Надішли `/newapp`
3. Обери свого бота
4. Введи назву: `Кубічна Цивілізація`
5. Введи опис: `Побудуй цивілізацію від кам'яного віку до роботів!`
6. Завантаж іконку (640×640 PNG)
7. **Web App URL:** `https://cubic-civ.onrender.com` (твій URL)
8. Готово! Бот видасть посилання виду `https://t.me/cubic_civilization_bot/app`

---

## 🧪 Локальна розробка

```bash
# У .env встанови:
BOT_MODE=polling
NODE_ENV=development
GAME_URL=http://localhost:3000

# Запуск:
npm run dev

# Гра доступна на:
# http://localhost:3000
```

Для тестування API без Telegram додай хедер:
```
x-dev-user-id: 12345
```

---

## 📊 API Endpoints

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/save` | Завантажити збереження |
| POST | `/api/save` | Зберегти стан гри |
| GET | `/api/leaderboard` | Топ-10 гравців |
| GET | `/api/rank/:tg_id` | Ранг гравця |
| GET | `/health` | Статус сервера |

---

## 🔧 Команди бота

| Команда | Дія |
|---------|-----|
| `/start` | Привітання + кнопка гри |
| `/play` | Кнопка для запуску |
| `/top` | Топ-10 рейтинг |
| `/help` | Довідка по грі |

---

## 💾 База даних

SQLite файл зберігається в `data/game.db`. 

**Резервна копія:**
```bash
cp data/game.db data/game_backup_$(date +%Y%m%d).db
```

**Перегляд даних:**
```bash
sqlite3 data/game.db "SELECT p.first_name, s.epoch, s.score FROM saves s JOIN players p ON p.tg_id = s.tg_id ORDER BY s.score DESC LIMIT 10;"
```

---

## ✅ Чеклист запуску

- [ ] `npm install` виконано
- [ ] `.env` заповнений (BOT_TOKEN + GAME_URL)
- [ ] Сервер запущений і доступний по HTTPS
- [ ] BotFather: бот створений
- [ ] BotFather: `/newapp` налаштований з правильним URL
- [ ] Тест: `/start` в боті показує кнопку гри
- [ ] Тест: гра відкривається та зберігає прогрес
