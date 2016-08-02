/* Ensure that data from 'gdp-config.js' has been loaded */
if (typeof GDP_DATA_LOADED == 'undefined')
    console.log('GDP: error, configuration parameters could not be loaded');

document.body.style.overflow = 'hidden'; // disable scrollbars


var __gdp_swipe_timer;
var __gdp_swipe_cooldown = 0;


/* Cookie Management */

function control_cookie_create(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 86400000));
        expires = "; expires=" + date.toGMTString();
    } else expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function control_cookie_read(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function control_cookie_erase(name) {
    control_cookie_create(name, "", -1);
}

function settings_save() {
    $.each(GDP_SETTINGS, function(setting, state) {
        control_cookie_create('gdp_' + setting, String(state));
    });
    location.reload();
}

/* User Interaction */

function control_keypress() {
    var regMatch = /\d+/;
    var cid = '';

    /* Record users keypresses */
    $(document).keypress(function(e) {
        if (e.which != 13) cid += String.fromCharCode(e.which);

        /* When the user presses enter attempt to parse swipe id */
        else {
            if ((cid = regMatch.exec(cid)) !== null) {
                cid = cid[0];
                if (cid.indexOf('000') === 0) cid = cid.substring(2);
                view_swipe_modal(cid, 5); // visible for 5 secs.
            }
            cid = ""; // reset id string
        }
    });
}

function control_toggle_setting(name) {
    switch (GDP_SETTINGS[name]) {
        case "true":
            GDP_SETTINGS[name] = false;
            console.log("GDP: '" + name + "'set to false");
            return;
        case "false":
            GDP_SETTINGS[name] = true;
            console.log("GDP: '" + name + "'set to true");
            return;
        default:
            console.log("GDP: can't set '" + name);
            return;
    }
}

function settings_toggle(setting) {
    GDP_SETTINGS[setting] = !GDP_SETTINGS[setting];
}

function view_swipe_modal(customerId, timeout) {

    /* Make ajax call to CardReader.php  */
    $.ajax({
        url: 'php/card-reader.php',
        data: {
            'workstationId': GDP_FACILITIES[GDP_SETTINGS.facility].workstation,
            'customerId': customerId
        },
        success: function(response) {

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
                __gdp_swipe_timer = setTimeout(function() {
                    $('#swipe-modal').modal('hide');
                }, __gdp_swipe_cooldown);
            }
        }
    });
}

/* Content Handlers */

function init_config() {

    /* Load settings using cookies */

    console.log("GDP: initializing settings");
    var name;
    var cookie;
    var reset = false;
    $.each(GDP_SETTINGS, function(setting, state) {
        name = "gdp_" + setting;
        cookie = control_cookie_read(name);
        if (cookie !== null) {
            console.log("\t* read and set '" + name + "' as " + cookie);
        } else {
            cookie = GDP_SETTINGS[setting];
            control_cookie_create(name, cookie);
            console.log("\t* wrote and set '" + name + "' as " + cookie);
            reset = true;
        }
        if (cookie == "true") cookie = true;
        if (cookie == "false") cookie = false;
        GDP_SETTINGS[setting] = cookie;
    });

    /* Set Facility Name */
    document.getElementById('facility-name').innerHTML =
        GDP_FACILITIES[GDP_SETTINGS.facility].name;

    var nameLen = (GDP_FACILITIES[GDP_SETTINGS.facility].name).length;
    $('#facility-name').css("font-size", 4 + 45 / nameLen + "vw");


    /* Configure Settings Modal */

    $.each(GDP_FACILITIES, function(fid, fname) {
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'facility_id';
        input.id = fid;
        input.onclick = function() {
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


    $('#load-settings').on('click', function() {
        $('#settings-modal').modal('show');
        $.each(GDP_SETTINGS, function(setting, state) {
            if (setting != 'facility') {
                $('#' + setting).prop("checked", Boolean(state));
            }
        });
    });

    // if(reset) location.reload();
}

function init_clock() {
    document.getElementById('live-time').innerHTML = moment().format('h:mma');
    setTimeout(function() {
        init_clock();
    }, 5000); // 5 seconds
}

function init_event() {

    /* Set body content based on event listing */
    $.ajax({
        url: "php/event-query.php",
        data: {
            'activeId': GDP_SETTINGS.facility
                //,'dateOffset': "-1"
        },
        success: function(response) {

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
    setTimeout(function() {
        init_event();
    }, 300000); // 5 min
}

function format_time(from, to) {
    return moment.unix(from).format('hh:mma') + ' \u2013 ' +
        moment.unix(to).format('hh:mma');
}

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
