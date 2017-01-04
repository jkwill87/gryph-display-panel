<?php

/**
 * ics-parser.php
 * Will generate an iCalendar file from an ActiveNet facility ID. Requires
 * an authentication file be available in '../data/auth.txt'.
 *
 * Created August 30, 2016
 * Author: Jessy Williams
 * Contact: jessy@jessywilliams.com
 */

class VEVENT {
    private $uid;
    private $summary;
    private $location;
    private $created;
    private $start;
    private $end;

    /**
     * VEVENT constructor.
     *
     * @param string $summary - used for the VEVENT's SUMMARY property.
     * @param string $location - used for the VEVENT's LOCATION property.
     * @param integer $start - used for the VEVENT's DTSTART property.
     * @param integer $end - used for the VEVENT's DTEND property.
     */
    function __construct($summary, $location, $start, $end) {
        $this->uid = uniqid("ath", true);
        $this->summary = $this::strFormat($summary);
        $this->location = $this::strFormat($location);
        $this->start = $this::dateToCal($start);
        $this->end = $this::dateToCal($end);
        $this->created = $this::dateToCal(time());
    }

    public function __toString() {
        return "BEGIN:VEVENT\r\n" .
        "CREATED:$this->created\r\n" .
        "LAST-MODIFIED:$this->created\r\n" .
        "DTSTAMP:$this->created\r\n" .
        "SUMMARY:$this->summary\r\n" .
        "DTSTART:$this->start\r\n" .
        "DTEND:$this->end\r\n" .
        "LOCATION:$this->location\r\n" .
        "UID:$this->uid\r\n" .
        "END:VEVENT\r\n";
    }

    /**
     * Returns a UTC formatted string from a timestamp.
     *
     * @param $timestamp - UNIX timestamp.
     * @return string - UTC formatted string, ie. 19700101T013334Z.
     */
    private static function dateToCal($timestamp) {
        return gmdate('Ymd\THis\Z', $timestamp);
    }

    /**
     * Formats a string into the required RFC2445 specified iCAL format.
     *
     * @param $string - the string to format.
     * @param int $lineLimit - the maximum line length.
     * @return string - the formatted version of the string.
     */
    private static function strFormat($string, $lineLimit = 70) {
        $string = preg_replace('/([\,;])/', '\\\$1', $string);
        $output = '';
        $pos = 0;
        while ($pos < strlen($string)) {
            $newLinepos = strpos($string, "\n", $pos + 1);
            if (!$newLinepos)
                $newLinepos = strlen($string);
            $line = substr($string, $pos, $newLinepos - $pos);
            if (strlen($line) <= $lineLimit) {
                $output .= $line;
            } else {
                $output .= substr($line, 0, $lineLimit);
                $line = substr($line, $lineLimit);
                $output .= "\n " . substr($line, 0, $lineLimit - 1);
                while (strlen($line) > $lineLimit - 1) {
                    $line = substr($line, $lineLimit - 1);
                    $output .= "\n " . substr($line, 0, $lineLimit - 1);
                }
            }
            $pos = $newLinepos;
        }
        return $output;
    }
}


class ICS {

    private $events = array();

    public function __toString() {
        $ics = "BEGIN:VCALENDAR\r\n" .
            "VERSION:2.0\r\n" .
            "PRODID:-//GRYPHONS_ATHLETICS//NONSGML v1.0//EN\r\n" .
            "CALSCALE:GREGORIAN\r\n" .
            "METHOD:PUBLISH\r\n" .
            "X-WR-CALNAME:ActiveNet Schedule\r\n" .
            "X-WR-TIMEZONE:America/Toronto\r\n";
        foreach ($this->events as $event) $ics .= $event;
        $ics .= "END:VCALENDAR\r\n";
        return $ics;
    }

    /**
     * @param string $summary - used for the VEVENT's SUMMARY property.
     * @param string $location - used for the VEVENT's LOCATION property.
     * @param integer $start - used for the VEVENT's DTSTART property.
     * @param integer $end - used for the VEVENT's DTEND property.
     */
    public function newEvent($summary, $location, $start, $end) {
        array_push($this->events,
            new VEVENT($summary, $location, $start, $end));
    }
}


/**
 * Performs all the heavy lifting of querying ActiveNet for an event list and
 * converting it into a iCal formatted object.
 * @param array|string $facilityId - the facility/facilites to get an event
 * listing for.
 * @return ICS - an ICS object which contains all the events for the queried
 * facility as a VCALENDAR object.
 */
function facilityToICS($facilityId) {
    define("GDP_NOEXEC", true);
    require_once("event-query.php");
    $NAME_REGX = '~([^A-z]+$)|((summer|spring|fall|winter)[^A-z]*$)~i';

    $ics = new ICS();
    if (!$facilityId) return $ics;

    $credentials = getCredentials();
    foreach ($facilityId as $id) {
        $rawEvents = queryEvents($credentials, $id, getDateString());
        if ($rawEvents) {
            foreach ($rawEvents as $rawEvent) {
                $ics->newEvent(
                    preg_replace($NAME_REGX, '',
                        htmlspecialchars_decode($rawEvent->eventName)),
                    $rawEvent->resourceName,
                    strtotime($rawEvent->startEventDateTime),
                    strtotime($rawEvent->endEventDateTime)
                );
            }
        }
    }
    return $ics;
}

/* Entry point ****************************************************************/
if (isset($_GET))
    header('Content-type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename=activecal.ics');
$query = isset($_SERVER['QUERY_STRING'])
    ? explode("&", $_SERVER['QUERY_STRING'])
    : null;
echo facilityToICS($query);
/******************************************************************************/
