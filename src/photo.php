<?php

$img_filename = array_shift(array_keys($_GET));
$img_filename = isset($img_filename) ? $img_filename : 'missing';
$img_filename = ltrim($img_filename, '0');
$img_path = "img/photo/{$img_filename}.png";
$fp = fopen($img_path, 'rb');
header("Content-Type: image/png");
header("Content-Length: " . filesize($img_path));
fpassthru($fp);
exit;
