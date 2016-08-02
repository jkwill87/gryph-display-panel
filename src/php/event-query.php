<?php

function getCredentials() {
    $credentials = null;
    try {
        if ($fh = fopen('../data/auth.txt', 'r')) {
            $credentials = (object)array(
              "userName" => trim(fgets($fh)),
              "password" => trim(fgets($fh)),
              "keepAlive" => false
            );
        }
    } catch (Exception $ignored) {

    }
    return $credentials;
}

function getDates($dateOffset = 0) {
    date_default_timezone_set('America/Toronto');
    $brokenTime = getdate(strtotime("+" . $dateOffset . " day"));
    return sprintf(
        "%02d/%02d/%d", $brokenTime['mon'],
        $brokenTime['mday'],
        $brokenTime['year']
    );
}

function queryEvents($credentials, $facilityID, $dates) {
    $WSDL_URL = 'http://anprodca.active.com/uofg/servlet/ActiveNetWS?wsdl';
    $WSDL_LOCAL = '../data/ActiveNetWS.xml';

    if (!$credentials) return null;

    $rawEvents = null;
    $params = array(
        "ws_system_user" => $credentials,
        "resource_ids" => array(intval($facilityID)),
        "dates" => $dates,
        "include_linked_resources" => false,
        "returning_render_customer_id" => 0
    );

    // ini_set("soap.wsdl_cache_enabled", "0");  // disable caching
    try {
        $soap = new SoapClient($WSDL_URL);
        $response = $soap->wsGetResourceBookings($params);
    } catch (Exception $ignored) {
      // echo 'Caught exception: ',  $ignored->getMessage(), "\n";
      return null;
    }
    if (property_exists($response, "return")) {
        $rawEvents = $response->return;
        if (is_array($rawEvents)) {
            usort($rawEvents, function ($a, $b) {
                return strtotime($a->startEventDateTime)
                - strtotime($b->startEventDateTime);
            });
        } else $rawEvents = array($rawEvents);
    }
    return $rawEvents;
}

function parseEvents($facilityID, $dateOffset, $debug = false) {

    $NAME_REGX = '~([^A-z]+$)|((summer|spring|fall|winter)[^A-z]*$)~i';

    $credentials = getCredentials();
    $dates = getDates($dateOffset);
    $rawEvents = queryEvents($credentials, $facilityID, $dates);
    if (!($credentials && $dates && $rawEvents)) return null;
    $events = array();
    foreach ($rawEvents as $rawEvent) {
        $event = array();
        if ($rawEvent) {
            $event['organizer'] = $rawEvent->customerName;
            $event['company'] = $rawEvent->companyName;
            $event['name'] = preg_replace($NAME_REGX, '',
                htmlspecialchars_decode($rawEvent->eventName)
            );
            $event['time_from'] = strtotime($rawEvent->startEventDateTime);
            $event['time_to'] = strtotime($rawEvent->endScheduleDateTime);
            array_push($events, $event);
        }
    }

    /* Print debug information on request */
    if ($debug) var_dump($facilityID, $dates, $rawEvents, $events);

    return json_encode($events);
}

/* Entry point ****************************************************************/
$activeID = isset($_GET['activeId']) ? $_GET['activeId'] : null;
$dateOffset = isset($_GET['dateOffset']) ? intval($_GET['dateOffset']) : 0;
$debug = isset($_GET['debug']);

if ($activeID) {
    $response = parseEvents($activeID, $dateOffset, $debug);
    echo $response ? $response : '{}';
} else {
    echo '{}';
}
/******************************************************************************/
