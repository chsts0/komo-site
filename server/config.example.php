<?php
// Скопируйте этот файл в config.php рядом и впишите свои значения.
// Анкеты идут через функцию на Vercel (relay_url), токен там лежит в переменных окружения.
// tg_bot_token и tg_chat_id здесь нужны только как запасной путь, mail_to на самый крайний случай.
return [
  'relay_url' => 'https://komo-site.vercel.app/api/lead',
  'tg_bot_token' => 'ТОКЕН_БОТА_ИЗ_BOTFATHER',
  'tg_chat_id' => '-5090900216',
  'mail_to' => 'komoconsalting@yandex.ru',
];
