# komoconsulting.ru

Одностраничный сайт KOMO: статичный HTML/CSS/JS плюс одна серверная функция `api/lead.js`, которая пересылает анкеты в Telegram.

## Выкладка (Vercel)

1. vercel.com → Add New → Project → импортировать репозиторий `komo-site`. Framework: Other, сборка не нужна.
2. Settings → Environment Variables:
   - `TG_BOT_TOKEN`: токен бота из @BotFather
   - `TG_CHAT_ID`: id чата, куда падают анкеты
3. Settings → Domains → добавить `komoconsulting.ru` и `www.komoconsulting.ru`.
4. В reg.ru (DNS-записи домена):
   - `A` для `@` → `76.76.21.21`
   - `CNAME` для `www` → `cname.vercel-dns.com`

## Структура

- `index.html`, `styles.css`, `main.js`: страница
- `img/`: фото и логотип
- `privacy.html`: политика конфиденциальности
- `api/lead.js`: приём анкет
