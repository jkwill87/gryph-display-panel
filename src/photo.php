<?php

ob_start();
$img_filename = ltrim(array_shift(array_keys($_GET)), '0');
$img_path = "img/photo/{$img_filename}.png";
if (!is_file($img_path)) {
    $img_path = "img/photo/missing.png";
}
$fp = fopen($img_path, 'rb');
ob_end_clean();
header("Content-Type: image/png");
header("Content-Length: " . filesize($img_path));
fpassthru($fp);
exit;
