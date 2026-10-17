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

## Выкладка на обычный хостинг с PHP (reg.ru)

1. Залить в папку сайта всё, кроме `api/`, `vercel.json`, `.vercelignore`, `README.md`.
2. Скопировать `server/config.example.php` в `server/config.php` и вписать токен бота и id чата.
3. `.htaccess` сам переводит сайт на https без www, отдаёт `/api/lead` через `server/lead.php` и прячет служебные файлы.

## Автозаливка

После пуша в main GitHub Actions (`.github/workflows/deploy.yml`) заливает сайт на хостинг по FTP. Нужны секреты репо `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` и, если FTP-пользователь смотрит не в папку сайта, `FTP_DIR`.
