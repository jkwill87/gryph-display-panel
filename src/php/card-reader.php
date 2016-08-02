<?php

define('CACHE', '../cache');
define('GRANTED', 1);
define('DENIED', 0);
define('ERROR', 2);

function query($workstationId, $customerId, $test = true)
{
    date_default_timezone_set('America/Toronto');
    $USER_AGENT = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13)'
        .' Gecko/20080311 Firefox/2.0.0.13';
    $site = $test ? 'uofgtrainer' : 'uofg';
    $now = time();
    $stale = true;

    /* Create cache directory if missing */
    if (!file_exists(CACHE)) {
        mkdir(CACHE, 0777, true);
    }

    /* Check to see if there are any cookie files */
    $cookies = array_values(
        array_filter(scandir(CACHE), function ($cookie
        ) {
            return $cookie[0] !== '.';
        }));

    /* If there are check to see if the most recent's is expired */
    if ($cookies) {
        $expiration = intval(end($cookies)) + 3600;
        $stale = $now > $expiration;
    }
    ob_start();      // prevent any output

    /* ... if still valid reuse cookie */
    if (!$stale) {
        $cookie = CACHE."/$cookies[0]";
    } /* ... if expired create a new one */
    else {
        foreach ($cookies as $cookie) {
            unlink(CACHE."/$cookie");
        }
        $cookie = CACHE."/$now";
        touch($cookie);
        chmod($cookie, 0777);

        try {
            if ($fh = fopen('../data/auth.txt', 'r')) {
                $user = trim(fgets($fh));
                $pass = fgets($fh);
            } else {
                return;
            }
        } catch (Exception $ignored) {
            return;
        }

        /* Login, get new sessionid */
        $ch = curl_init();
        $url = "http://anprodca.active.com/$site/servlet/processAdminLogin.sdi";
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS,
            "uname=$user&adminloginpassword=$pass");
        curl_exec($ch); // execute the curl command
        curl_close($ch);
        unset($ch);
    }
    /* Set workstation id */
    $ch = curl_init();
    $url = "http://anprodca.active.com/$site/servlet/"
        .'processAssignWorkstation.sdi';
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, "workstation_id=$workstationId");
    curl_exec($ch); // execute the curl command
    curl_close($ch);
    unset($ch);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);
    curl_setopt($ch, CURLOPT_URL,
        "http://anprodca.active.com/$site/servlet/scanCard.sdi?oc=Customer"
        .'&class_name=Pass&isNewPassValidation=true&fromScanCard=true'
        ."&no_page_redirect=true&scan_element=$customerId"
    );
    $output = curl_exec($ch);

    curl_close($ch);
    unset($ch);

    /* Parse response */
    $json = json_decode($output, true);
    if (is_array($json)) {
        if (array_key_exists('openGate', $json)) {
            $status = $json['openGate'] == true ? GRANTED : DENIED;
        } else {
            $status = ERROR;
        }  // invalid JSON response
    } else {
        $status = ERROR;
    }  // no JSON response

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    curl_setopt($ch, CURLOPT_USERAGENT, $USER_AGENT);

    curl_setopt($ch, CURLOPT_URL,
        "http://anprodca.active.com/$site/servlet/adminChange.sdi?oc=Customer"
        ."&scan_card=true&scan_element=$customerId");
    $output = curl_exec($ch);

    curl_close($ch);
    unset($ch);

    /* Lookup customer active id */
    $imgUrl = null;
    if (preg_match('/<title>.+#(\d+)\)<\/title>/', $output, $matches) == 1) {
        if ($status == ERROR) {
            $status = DENIED;
        }  // old account

        /* Get customer img url if available */
        if ((strpos($output, 'downloadPicture.sdi') !== false)) {
            $usrImg = $matches[1];
            $imgUrl = "http://anprodca.active.com/$site/servlet/downloadPicture"
                .".sdi?class_name=Customer&customer_id=$usrImg";
        }
    } else {
        $status = ERROR;
    }  // account couldn't be found on ActiveNet
    ob_end_clean();  // stop preventing output
    return array($status, $imgUrl ? $imgUrl : 'img/missing.png');
}

/* Entry point ****************************************************************/
if (isset($_GET['workstationId']) and isset($_GET['customerId'])) {
    $swipe = query($_GET['workstationId'], $_GET['customerId']);
    echo "$swipe[0];$swipe[1]";
}
/******************************************************************************/
