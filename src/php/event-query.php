<?php

/**
 * Parses a plaintext, newline delimited unicode file which contains a username
 * on the first line and a password on the second.
 *
 * @param string $path - the path (relative or absolute) to the authentication
 * file.
 * @return null|object - returns null on error, else an object containing the
 * username, password, and required keepalive properties to issue a request
 * to ActiveNet's SOAP web service.
 */
function getCredentials($path = '../data/auth.txt') {
    $credentials = null;
    try {
        if ($fh = fopen($path, 'r')) {
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

/**
 * Will return the current or offset datetime as a string in the format
 * required to query ActiveNet.
 *
 * @param int $dateOffset - date offset, relative to now, to get a date for.
 * @return string - date formatted as "MM/DD/YYYY".
 */
function getDateString($dateOffset = 0) {
    date_default_timezone_set('America/Toronto');
    $brokenTime = getdate(strtotime("+" . $dateOffset . " day"));
    return sprintf(
        "%02d/%02d/%d",
        $brokenTime['mon'],
        $brokenTime['mday'],
        $brokenTime['year']
    );
}

/**
 * Queries ActiveNet's Server for a listing of events taking place over the next
 * day.
 *
 * @param object $credentials - object created by the 'getCredentials' function
 * which contains the required username, password, and required keepalive
 * properties to issue a request to ActiveNet's SOAP web service.
 * @param int $facilityID - the ActiveNet facility ID to query with regards to.
 * @param string $date - date formatted as "MM/DD/YYYY"
 * @return array|null - null if error or nothing scheduled else an array of
 * arrays w/ event information to be parsed by 'parseEvents'.
 */
function queryEvents($credentials, $facilityID, $date) {
    $WSDL_URL = 'http://anprodca.active.com/uofg/servlet/ActiveNetWS?wsdl';
    $WSDL_LOCAL = '../data/ActiveNetWS.xml';

    if (!$credentials) return null;

    $rawEvents = null;
    $params = array(
        "ws_system_user" => $credentials,
        "resource_ids" => array(intval($facilityID)),
        "dates" => $date,
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


/**
 * Used to call and parse 'queryEvents' which contains the raw response from
 * ActiveNet.
 *
 * @param int $facilityID - the ActiveNet facility ID to query with regards to.
 * @param int $dateOffset - date offset, relative to now, to query events for.
 * @param bool $debug - if true will dump ActiveNet's raw response.
 * @return null|string - null on error else a json encoded string containing
 * an organized, company, name, time_from, and time_to field for each scheduled
 * event.
 */
function parseEvents($facilityID, $dateOffset, $debug = false) {

    $NAME_REGX = '~([^A-z]+$)|((summer|spring|fall|winter)[^A-z]*$)~i';

    $credentials = getCredentials();
    $dates = getDateString($dateOffset);
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
if (!defined("GDP_NOEXEC")) {
    $activeID = isset($_GET['activeId']) ? $_GET['activeId'] : null;
    $dateOffset = isset($_GET['dateOffset']) ? intval($_GET['dateOffset']) : 0;
    $debug = isset($_GET['debug']);

    if ($activeID) {
        $response = parseEvents($activeID, $dateOffset, $debug);
        echo $response ? $response : '{}';
    } else {
        echo '{}';
    }
}
/******************************************************************************/
