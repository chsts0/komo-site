<?php
header('Content-Type: text/plain; charset=utf-8');
echo "A: ", json_encode(gethostbynamel('komo-site.vercel.app')), "\n";
echo "AAAA: ", json_encode(array_column(dns_get_record('komo-site.vercel.app', DNS_AAAA) ?: [], 'ipv6')), "\n";
function t($label, $opts) {
  $t = microtime(true);
  $ch = curl_init('https://komo-site.vercel.app/api/lead');
  curl_setopt_array($ch, $opts + [CURLOPT_POST => true, CURLOPT_POSTFIELDS => '{"kind":"client"}', CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
  $r = curl_exec($ch);
  echo "$label: code ", curl_getinfo($ch, CURLINFO_HTTP_CODE), " ", round(microtime(true) - $t, 2), "s connect ", round(curl_getinfo($ch, CURLINFO_CONNECT_TIME), 2), " ip ", curl_getinfo($ch, CURLINFO_PRIMARY_IP), " err ", curl_error($ch), "\n";
}
t('default', []);
t('default2', []);
t('v4', [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
t('v4 ct2', [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, CURLOPT_CONNECTTIMEOUT => 3]);
t('v6', [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V6]);
