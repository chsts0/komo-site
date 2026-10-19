<?php
header('Content-Type: text/plain; charset=utf-8');
$url = 'https://komo-site.vercel.app/api/lead';
$payload = json_encode(['kind' => 'client']);
$t = microtime(true);
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $payload, 'timeout' => 15, 'ignore_errors' => true]]);
$res = @file_get_contents($url, false, $ctx);
echo "stream: ", var_export($res, true), " ", round(microtime(true) - $t, 2), "s ", json_encode(error_get_last()), "\n";
echo "headers: ", json_encode($http_response_header ?? null), "\n";
$t = microtime(true);
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
$r = curl_exec($ch);
echo "curl: ", var_export($r, true), " code ", curl_getinfo($ch, CURLINFO_HTTP_CODE), " ", round(microtime(true) - $t, 2), "s err ", curl_error($ch), " ip ", curl_getinfo($ch, CURLINFO_PRIMARY_IP), "\n";
