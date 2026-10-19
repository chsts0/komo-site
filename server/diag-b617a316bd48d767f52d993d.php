<?php
// Временная проверка сети с хостинга, удалить после диагностики
header('Content-Type: text/plain; charset=utf-8');
function probe($url) {
  $t = microtime(true);
  $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 8, 'ignore_errors' => true]]);
  $r = @file_get_contents($url, false, $ctx);
  $code = isset($http_response_header[0]) ? $http_response_header[0] : 'нет ответа';
  return sprintf("%s -> %s, %.1fs, %d байт", $url, $code, microtime(true) - $t, $r === false ? 0 : strlen($r));
}
echo probe('https://api.telegram.org/'), "\n";
echo probe('https://komo-site.vercel.app/'), "\n";
echo probe('https://ya.ru/'), "\n";
echo 'curl: ', function_exists('curl_init') ? 'есть' : 'нет', "\n";
echo 'mail(): ', function_exists('mail') ? 'есть' : 'нет', "\n";
echo 'php ', PHP_VERSION, "\n";
