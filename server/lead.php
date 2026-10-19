<?php
// Обычный хостинг с PHP (reg.ru): принимает анкету с сайта и пересылает её в Telegram.
// С хостинга reg.ru api.telegram.org не открывается, поэтому анкета сначала уходит
// через функцию на Vercel (api/lead.js), которая уже сама шлёт в Telegram.
// Если не вышло, пробуем Telegram напрямую, а в крайнем случае шлём письмо на почту.
// Настройки в server/config.php (его нет в репо, см. config.example.php).

const LABELS = [
  'client' => [
    'title' => 'Новая анкета заказчика',
    'fields' => [
      ['name', 'Имя'], ['contact', 'Контакт'], ['object', 'Что открывает'],
      ['area', 'Площадь, м²'], ['address', 'Адрес'], ['stage', 'Стадия'],
      ['need', 'Что требуется'], ['need_other', 'Другое'],
      ['budget', 'Бюджет'], ['deadline', 'Сроки открытия'],
    ],
  ],
  'job' => [
    'title' => 'Новая анкета соискателя',
    'fields' => [
      ['name', 'Имя'], ['contact', 'Контакт'], ['role', 'Кем хочет работать'],
      ['city', 'Город'], ['experience', 'Опыт, лет'], ['cv', 'Резюме'], ['about', 'О себе'],
    ],
  ],
];

header('Content-Type: application/json; charset=utf-8');

function reply($code, $data) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function clip($s, $n = 1000) {
  return mb_strlen($s) > $n ? mb_substr($s, 0, $n) . '…' : $s;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Allow: POST');
  reply(405, ['ok' => false]);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) reply(400, ['ok' => false]);

// Ловушка для ботов: настоящий человек это поле не видит
if (!empty($body['website'])) reply(200, ['ok' => true]);

$form = LABELS[$body['kind'] ?? ''] ?? null;
if (!$form) reply(400, ['ok' => false]);
if (trim((string)($body['name'] ?? '')) === '' || trim((string)($body['contact'] ?? '')) === '') {
  reply(400, ['ok' => false, 'error' => 'name and contact are required']);
}

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$relay = $config['relay_url'] ?? 'https://komo-site.vercel.app/api/lead';
$token = $config['tg_bot_token'] ?? '';
$chatId = $config['tg_chat_id'] ?? '';
$mailTo = $config['mail_to'] ?? 'komoconsalting@yandex.ru';

function post_json($url, $data, $timeout) {
  $ctx = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => "Content-Type: application/json\r\n",
    'content' => json_encode($data, JSON_UNESCAPED_UNICODE),
    'timeout' => $timeout,
    'ignore_errors' => true,
  ]]);
  $res = @file_get_contents($url, false, $ctx);
  return $res !== false && (json_decode($res, true)['ok'] ?? false);
}

// 1. Через Vercel
if ($relay && post_json($relay, $body, 8)) reply(200, ['ok' => true]);

$lines = [$form['title']];
foreach ($form['fields'] as [$key, $label]) {
  $raw = $body[$key] ?? '';
  $value = is_array($raw) ? implode(', ', array_map('strval', $raw)) : trim((string)$raw);
  if ($value !== '') $lines[] = "$label: " . clip($value);
}

// 2. Telegram напрямую, если с хостинга он вдруг откроется
if ($token && $chatId) {
  $html = array_map(fn($l) => htmlspecialchars($l, ENT_NOQUOTES), $lines);
  $html[0] = '<b>' . $html[0] . '</b>';
  $sent = post_json("https://api.telegram.org/bot$token/sendMessage", [
    'chat_id' => $chatId,
    'text' => implode("\n", $html),
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => true,
  ], 4);
  if ($sent) reply(200, ['ok' => true]);
}

// 3. Письмо, чтобы анкета не потерялась
if ($mailTo) {
  $subject = '=?UTF-8?B?' . base64_encode($form['title'] . ' с сайта') . '?=';
  $headers = "From: KOMO <noreply@komoconsulting.ru>\r\nContent-Type: text/plain; charset=utf-8\r\n";
  if (@mail($mailTo, $subject, implode("\n", $lines), $headers)) reply(200, ['ok' => true]);
}

reply(502, ['ok' => false]);
