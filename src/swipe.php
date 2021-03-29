<?php

require_once(__DIR__ . "/php/card-reader.php");

function abort($code)
{
    http_response_code($code);
    die();
}

$customer_id = trim(array_shift(array_filter([$_GET['customerId'], $_GET['customer_id']])));
$workstation_id = trim(array_shift(array_filter([$_GET['workstationId'], $_GET['workstation_id']])));
if (!$customer_id || !$workstation_id) abort(422);
try {
    if ($fh = fopen(__DIR__ . '/data/auth.txt', 'r')) {
        $username = trim(fgets($fh));
        $password = fgets($fh);
    } else {
        abort(422);
    }
} catch (Exception $ignored) {
    abort(422);
}

$swipe = swipe_card($username, $password, $customer_id, $workstation_id, $access_token);
if (!$swipe) {
    abort(400);
}
header('Content-Type: application/json');
echo json_encode($swipe);
