<?php
// Обычный хостинг с PHP (reg.ru): принимает анкету с сайта и пересылает её в Telegram.
// Токен и id чата лежат в server/config.php (его нет в репо, см. config.example.php).

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
$token = $config['tg_bot_token'] ?? '';
$chatId = $config['tg_chat_id'] ?? '';
if (!$token || !$chatId) reply(500, ['ok' => false, 'error' => 'not configured']);

$lines = ['<b>' . $form['title'] . '</b>'];
foreach ($form['fields'] as [$key, $label]) {
  $raw = $body[$key] ?? '';
  $value = is_array($raw) ? implode(', ', array_map('strval', $raw)) : trim((string)$raw);
  if ($value !== '') $lines[] = "<b>$label:</b> " . htmlspecialchars(clip($value), ENT_NOQUOTES);
}

$payload = json_encode([
  'chat_id' => $chatId,
  'text' => implode("\n", $lines),
  'parse_mode' => 'HTML',
  'disable_web_page_preview' => true,
], JSON_UNESCAPED_UNICODE);

$ctx = stream_context_create(['http' => [
  'method' => 'POST',
  'header' => "Content-Type: application/json\r\n",
  'content' => $payload,
  'timeout' => 10,
  'ignore_errors' => true,
]]);
$res = @file_get_contents("https://api.telegram.org/bot$token/sendMessage", false, $ctx);
$ok = $res !== false && (json_decode($res, true)['ok'] ?? false);

reply($ok ? 200 : 502, ['ok' => (bool)$ok]);
