<?php

const IMG_DIR = __DIR__ . "/../img/photo";

/**
 * 'Swipes' the passed customer ID at the accompanying workstation and returns
 * ActiveNet's pass validation response.
 * @param string username
 * @param string password
 * @param integer $card_id - either the ActiveNet primary or alternate key
 * (ie. student/staff number) used to swipe against.
 * @param int $workstation_id - the workstation ID number used to log the
 * transaction record.
 * @param bool trainer - determines whether to use the staging or production portal URL.
 * @return array|null
 */
function swipe_card($username, $password, $card_id, $workstation_id, $trainer = false)
{
    $ch = curl_init();
    $portal = $trainer ? 'uoftrainer' : 'uofg';
    $base_url = "https://anprodca.active.com/{$portal}/servlet";
    // Authenticate
    curl_setopt_array($ch, array(
        CURLOPT_URL => "{$base_url}/processAdminLogin.sdi",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => "uname={$username}&adminloginpassword={$password}",
        CURLOPT_HTTPHEADER => array(
            "Cookie: uofg_workstation_id={$workstation_id}",
        ),
        CURLOPT_COOKIEJAR => '-'
    ));
    curl_exec($ch);
    if (curl_errno($ch)) return;
    // Register card swipe
    curl_setopt_array($ch, array(
        CURLOPT_URL => "{$base_url}/scanCard.sdi?scan_element={$card_id}",
        CURLOPT_POSTFIELDS => 'class_name=Pass&isNewPassValidation=true&fromScanCard=true&no_page_redirect=true',
    ));
    $result = curl_exec($ch);
    if (curl_errno($ch)) return;
    $json = json_decode($result, true);
    if (is_array($json)) {
        if (array_key_exists('openGate', $json)) {
            $valid = $json['openGate'] == true;
        }
    }
    // Get Client Photo
    cull_expired_image_files();
    $img_path = IMG_DIR . "/$card_id.png";
    if (!is_file($img_path)) {
        curl_setopt_array($ch, array(
            CURLOPT_URL => "{$base_url}/adminChange.sdi"
                . '?oc=Customer'
                . '&scan_card=true'
                . "&scan_element={$card_id}"
        ));
        $output = curl_exec($ch);
        preg_match(
            "/'downloadPicture\.sdi\?class_name=Customer&customer_id=(.+)'/U",
            $output,
            $matches
        );
        $photo_hash = $matches[1];
        if ($photo_hash) {
            $image_url = "{$base_url}/downloadPicture.sdi?customer_id={$photo_hash}";
            curl_setopt_array($ch, array(
                CURLOPT_HEADER => 0,
                CURLOPT_URL => $image_url,
            ));
            $photo_data = curl_exec($ch);
            if ($photo_data) {
                $fp = fopen($img_path, "w");
                fwrite($fp, $photo_data);
                fclose($fp);
            }
        }
    }
    curl_close($ch);
    return !!$valid;
}

function cull_expired_image_files($max_age_days = 7)
{
    $image_files = glob(IMG_DIR . "/*");
    $now = time();
    $cull_count = 0;
    foreach ($image_files as $image_file) {
        if (is_file($image_file)) {
            if ($now - filemtime($image_file) >= 60 * 60 * 24 * $max_age_days) {
                $cull_count += 1;
                unlink($image_files);
            }
        }
    }
    return $cull_count;
}
