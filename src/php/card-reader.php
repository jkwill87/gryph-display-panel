<?php

/**
 * 'Swipes' the passed customer ID at the accompanying workstation and returns
 * ActiveNet's pass validation response.
 * @param string username
 * @param string password
 * @param integer $card_id - either the ActiveNet primary or alternate key
 * (ie. student/staff number) used to swipe against.
 * @param int $workstation_id - the workstation ID number used to log the
 * transaction record.
 * @return array|null
 */
function swipe_card($username, $password, $card_id, $workstation_id)
{
    $curl = curl_init();
    // Authenticate
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://anprodca.active.com/uofg/servlet/processAdminLogin.sdi',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => "uname=$username&adminloginpassword=$password",
        CURLOPT_HTTPHEADER => array(
            "Cookie: uofg_workstation_id=$workstation_id",
        ),
        CURLOPT_COOKIEJAR => '-'
    ));
    curl_exec($curl);
    if (curl_errno($curl)) return;
    // Register card swipe
    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://anprodca.active.com/uofg/servlet/scanCard.sdi?scan_element=$card_id",
        CURLOPT_POSTFIELDS => 'class_name=Pass&isNewPassValidation=true&fromScanCard=true&no_page_redirect=true',
    ));
    $result = curl_exec($curl);
    if (curl_errno($curl)) return;
    $json = json_decode($result, true);
    if (is_array($json)) {
        if (array_key_exists('openGate', $json)) {
            $valid = $json['openGate'] == true;
        } else {
            $valid = false;
        }
    } else {
        $valid = false;
    }
    // Download picture, encode as Base64 string
    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://anprodca.active.com/uofg/servlet/adminChange.sdi"
            . '?oc=Customer'
            . '&scan_card=true'
            . "&scan_element={$card_id}"
    ));
    $output = curl_exec($curl);
    if (curl_errno($curl)) return;
    if (!preg_match("/'downloadPicture\.sdi\?class_name=Customer&customer_id=(.+)'/U", $output, $matches)) return;
    $photo_id = $matches[1];
    if ($photo_id) {
        $image_url = "https://anprodca.active.com/uofg/servlet/downloadPicture.sdi?customer_id=$photo_id";
        curl_setopt_array($curl, array(
            CURLOPT_HEADER => 0,
            CURLOPT_URL => $image_url,
        ));
        $image_data =  base64_encode(curl_exec($curl));
    }
    curl_close($curl);
    // Return a mapping which can be serialized as JSON
    return [
        "valid" => $valid,
        "image_data" => $image_data
    ];
}
