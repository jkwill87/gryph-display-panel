<?php

require_once(__DIR__ . "/php/card-reader.php");

function abort($code, $msg)
{
    http_response_code($code);
    echo json_encode([
        'valid' => false,
        'error' => $msg,
    ]);
    die();
}

$customer_id = trim(array_shift(array_filter([$_GET['customerId'], $_GET['customer_id']])));
$customer_id = ltrim($customer_id, '0');
$workstation_id = trim(array_shift(array_filter([$_GET['workstationId'], $_GET['workstation_id']])));
if (!$customer_id || !$workstation_id) {
    abort(422, 'missing customer_id or workstation_id query parameters');
}
try {
    if ($fh = fopen(__DIR__ . '/data/auth.txt', 'r')) {
        $username = trim(fgets($fh));
        $password = fgets($fh);
    } else {
        abort(422, 'unable to load credentials');
    }
} catch (Exception $ignored) {
    abort(422, 'unable to load credentials');
}

$is_valid = swipe_card($username, $password, $customer_id, $workstation_id, $access_token);
if ($is_valid === null) {
    abort(400, 'card swiping failed');
}
header('Content-Type: application/json');
echo json_encode(['valid' => $is_valid, 'error' => null]);
