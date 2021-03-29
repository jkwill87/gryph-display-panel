<?php

require_once(__DIR__ . "/php/card-reader.php");

$customer_id = trim(array_shift(array_filter([$_GET['customerId'], $_GET['customer_id']])));
$workstation_id = trim(array_shift(array_filter([$_GET['workstationId'], $_GET['workstation_id']])));
if (!$customer_id || !$workstation_id) {
    http_response_code(422);
    die();
}
$swipe = swipe_card('gdp', 'Gryph.2020', $customer_id, $workstation_id, $access_token);
if (!$swipe) {
    http_response_code(400);
}
header('Content-Type: application/json');
echo json_encode($swipe);
