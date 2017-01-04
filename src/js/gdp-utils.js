/**
 * gdp-utils.js
 * A set of utility functions used by GDP to query, configure, and display event
 * information as well as capturing ID swiping. Depends on jQuery 2+ and
 * moment.js.
 *
 * Created August 29, 2016
 * Author: Jessy Williams
 * Contact: jessy@jessywilliams.com
 */


/* Query String Encoding/ Decoding ********************************************/

/**
 *
 */
function url_encode(){
    window.location.href = window.location.pathname + "?"
        + $.param(GDP_SETTINGS);
}

/**
 * Parses key/ value pairs from the url query
 */
function url_decode() {
    var value;
    var key;
    var kv_pair;
    var kv_pairs = window.location.href.slice(
        window.location.href.indexOf('?') + 1
    ).split('&');
    if(kv_pairs.length==1) url_encode();
    console.log("GDP: initializing settings");
    for (var i = 0; i < kv_pairs.length; i++) {
        kv_pair = kv_pairs[i].split('=');
        key = kv_pair[0];
        value = kv_pair[1];
        if (value=='true') value = true;
        if (value=='false') value = false;
        if (GDP_SETTINGS[key] != undefined
            && typeof(value) !== "undefined" && value) {
            console.log("\t* read and set '" + key + "' as " + value);
            GDP_SETTINGS[key] = value;
        }
    }
}

/**
 * Encodes key/ value pairs into the url
 */
function url_reset(){
    window.location.href = window.location.pathname;
}


/* UI Interaction *************************************************************/

/**
 * Captures keypresses from the browser.
 */
function control_keypress() {
    var regMatch = /0*(\d{6,10})/;  // 6-10 digits, trimming leading zeroes
    var userInput = '';

    /* Record users keypresses */
    $(document).keypress(function (e) {
        if (e.which != 13) userInput += String.fromCharCode(e.which);

        /* When the user presses enter attempt to parse swipe id */
        else {
            if ((userInput = regMatch.exec(userInput)) !== null) {
                userInput = parseInt(userInput[1]);
                view_swipe_modal(userInput, 5); // visible for 5 secs.
            }
            userInput = ''; // reset id string
        }
    });
}

/**
 * Toggles boolean values w/i GDP_SETTINGS object.
 * @param name - the name of the setting to toggle.
 */
function settings_toggle(name) {
    GDP_SETTINGS[name] = !GDP_SETTINGS[name];
}

/**
 * Activates the Bootstrap3 swipe modal w/ user photo and validation info.
 * @param customerID - Swiped customerID (probably ActiveNet alternate key).
 * @param timeout - The amount of time until the modal is dismissed.
 */
function view_swipe_modal(customerID, timeout) {

    /* Make ajax call to CardReader.php  */
    $.ajax({
        url: 'php/card-reader.php',
        data: {
            'workstationId': GDP_FACILITIES[GDP_SETTINGS.training]
                ? 0
                : GDP_FACILITIES[GDP_SETTINGS.facility].workstation,
            'customerId': customerID
        },
        success: function (response) {

            var status = response.split(";")[0];
            var imgUrl = response.split(";")[1];
            switch (status) {
                case '1':
                    var alertDetails = 'Attendance Recorded';
                    var alertStatus = 'Valid Pass';
                    var alertClass = "alert-success";
                    break;
                case '0':
                    alertDetails = 'See Customer Service';
                    alertStatus = 'Invalid Pass';
                    alertClass = "alert-warning";
                    break;
                default:
                    alertDetails = 'See Customer Service';
                    alertStatus = 'Invalid ID';
                    alertClass = "alert-danger";
                    break;
            }

            /* Display Model */
            document.getElementById('cr-response').innerHTML =
                '<div class="alert ' + alertClass + '" role="alert"><strong>' +
                alertStatus + ': </strong>' + alertDetails + '</div>';
            document.getElementById('cr-response').innerHTML += '<img src="' +
                imgUrl + '" class="img-responsive" >';
            $('#swipe-modal').modal('show');

            /* Hide modal after timeout */
            __gdp_swipe_cooldown = (timeout * 1000);
            if (__gdp_swipe_cooldown) {
                clearTimeout(__gdp_swipe_timer);
                __gdp_swipe_timer = setTimeout(function () {
                    $('#swipe-modal').modal('hide');
                }, __gdp_swipe_cooldown);
            }
        }
    });
}


/* Content Handlers ***********************************************************/

/**
 * Loads the display's title and appearance based on that configuration.
 */
function init_config() {

    /* Load settings from url query */
    url_decode();

    /* Set Facility Name */
    document.getElementById('facility-name').innerHTML =
        GDP_FACILITIES[GDP_SETTINGS.facility].name;

    var nameLen = (GDP_FACILITIES[GDP_SETTINGS.facility].name).length;
    $('#facility-name').css("font-size", 2.5 + 40 / nameLen + "vw");

    /* Configure Settings Modal */
    $.each(GDP_FACILITIES, function (fid, fname) {
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'facility_id';
        input.id = fid;
        input.onclick = function () {
            GDP_SETTINGS.facility = fid;
        };
        input.checked = fid == GDP_SETTINGS.facility;

        var label = document.createElement('label');
        label.setAttribute('for', fid);
        label.className = 'label-primary';

        var div = document.createElement("div");
        div.className = "material-switch pull-right";
        div.appendChild(input);
        div.appendChild(label);

        var li = document.createElement("li");
        li.className = "list-group-item";
        li.appendChild(document.createTextNode(GDP_FACILITIES[fid].name));
        li.appendChild(div);

        $("#facility-dropdown").append(li);
    });

    $('#load-settings').on('click', function () {
        $('#settings-modal').modal('show');
        $.each(GDP_SETTINGS, function (setting, state) {
            if (setting != 'facility') {
                $('#' + setting).prop("checked", Boolean(state));
            }
        });
    });

    /* Activate swiping if a workstation is set */
    if (GDP_FACILITIES[GDP_SETTINGS.facility].workstation != 0)
        control_keypress();
}

/**
 * Will display the current time within the 'live-time id'. Formatted to look
 * like 10:00am, for example. Calls itself recursively to update the time.

 */
function init_clock() {
    document.getElementById('live-time').innerHTML = moment().format('h:mma');
    setTimeout(function () {
        init_clock();
    }, 5000); // 5 seconds
}

/**
 * Interacts w/ GDP's php backend to query ActiveNet for event listing. Displays
 * these items inside 'event-body' id. Content is set to be updated/ culled on
 * an interval of 5 minutes.
 */
function init_event() {

    /* Set body content based on event listing */
    $.ajax({
        url: "php/event-query.php",
        data: {
            'activeId': GDP_SETTINGS.facility
            //,'dateOffset': "-1"
        },
        success: function (response) {

            var json = $.parseJSON(response);
            var time_now = Date.now() / 1000 | 0;

            /* Hide passed events */
            if (!GDP_SETTINGS.show_passed_events) {
                for (var event in json)
                    if (json.hasOwnProperty(event))
                        if (time_now > json[event].time_to)
                            delete json[event];
            }

            if ($.isEmptyObject(json)) {
                $('#event-body').html('Nothing Scheduled').attr(
                    'class', 'event-text');
            } else {

                var maxrows = Math.floor(window.innerHeight /
                    window.innerWidth * 9);

                /* Create headings */
                var span_name = document.createElement('span');
                span_name.className = 'fa fa-calendar-o';
                var th_name_col = document.createElement('th');
                th_name_col.appendChild(span_name);
                th_name_col.appendChild(document.createTextNode(' Event Name'));

                var span_clock = document.createElement('span');
                span_clock.className = 'fa fa-clock-o';
                var th_time_col = document.createElement('th');
                th_time_col.appendChild(span_clock);
                th_time_col.appendChild(document.createTextNode(' Time'));

                var tr_head = document.createElement('tr');
                tr_head.appendChild(th_time_col);
                tr_head.appendChild(th_name_col);

                var thead = document.createElement('thead');
                thead.appendChild(tr_head);

                /* Create table body */
                var tbody = document.createElement('tbody');

                var colour = '#000000';
                var steps = Object.keys(json).length;
                steps = 1 / (steps <= maxrows ? steps : maxrows);
                var step = 0;

                for (var entry in json) {
                    if (json.hasOwnProperty(entry)) {

                        var tr_body = document.createElement('tr');
                        var time_from = json[entry].time_from;
                        var time_to = json[entry].time_to;

                        var td_time = document.createElement('td');
                        td_time.appendChild(document.createTextNode(
                            format_time(time_from, time_to)));
                        tr_body.appendChild(td_time);


                        var td_name = document.createElement('td');
                        td_name.appendChild(document.createTextNode(
                            json[entry].name));
                        tr_body.appendChild(td_name);

                        tr_body.style.color = colour;
                        tr_body.style.color = (time_from < time_now) &&
                        (time_now < time_to) &&
                        GDP_SETTINGS.highlight_current ?
                            '#4da6ff' : colour;
                        tbody.appendChild(tr_body);
                        colour = shadeColour(colour,
                            (steps * ++step) / 1.5 - 0.1);

                        if (step == maxrows) break;
                    }
                }

                /* Display table */
                var table = document.createElement('table');
                table.className = "table";
                table.appendChild(thead);
                table.appendChild(tbody);
                $('#event-body').html(table).attr('class', 'event-table');
            }
        }
    });
    setTimeout(function () {
        init_event();
    }, 300000); // 5 min
}


/* Helper Functions ***********************************************************/

/**
 * Will turn a time range into a formatted string.
 * @param from - the from UNIX timestamp.
 * @param to - the to UNIX timestamp.
 * @returns {string} - the formatted time string.
 */
function format_time(from, to) {
    return moment.unix(from).format('hh:mma') + ' \u2013 ' +
        moment.unix(to).format('hh:mma');
}

/**
 * Takes a hex colour code and darkens/lightens it by the provided percentage.
 * @param color - the hex colour code to transform
 * @param percent - the percentage to darken (if positive) or lighten (if
 * negative).
 * @returns {string} - the new hex colour code.
 */
function shadeColour(color, percent) {
    var f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)).toString(16).slice(1);
}


/* Entry Point ****************************************************************/

if (typeof GDP_DATA_LOADED == 'undefined')
    console.log('GDP: error, configuration parameters could not be loaded');

document.body.style.overflow = 'hidden';  // disable scrollbars

var __gdp_swipe_timer;
var __gdp_swipe_cooldown = 0;
