/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */

/**
 * gdp.js
 * A set of utility functions used by GDP to query, configure, and display event
 * information as well as capturing ID swiping. Depends on jQuery 2+ and
 * day.js.
 *
 * Created August 29, 2016
 * Author: Jessy Williams
 * Contact: jessy@jessywilliams.com
 */

// Global Data
var ROOM_DATA, SETTING_DATA;
var _selected_room, _swipe_cooldown, _swipe_timer;

/**
 * Clears url query parameters
 */

function url_reset() {
  window.location.href = window.location.pathname;
}

/**
 * Encodes settings into url query parameters
 */
function url_encode() {
  window.location.href = window.location.pathname + "?" + $.param(SETTING_DATA);
}

/**
 * Parses key/ value pairs from url query parameters
 */
function url_decode() {
  var value;
  var key;
  var kv_pair;
  var kv_pairs = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  if (kv_pairs.length == 1) url_encode();
  console.log("GDP: initializing settings");
  for (var i = 0; i < kv_pairs.length; i++) {
    kv_pair = kv_pairs[i].split("=");
    key = kv_pair[0];
    value = kv_pair[1];
    if (value == "true") value = true;
    if (value == "false") value = false;
    if (
      SETTING_DATA[key] != undefined &&
      typeof value !== "undefined" &&
      value
    ) {
      console.log("\t* read and set '" + key + "' as " + value);
      SETTING_DATA[key] = value;
    }
  }
}

/**
 * Captures keypresses from the browser.
 */
function control_keypress() {
  var regMatch = /0*(\d{6,10})/; // 6-10 digits, trimming leading zeroes
  var userInput = "";

  /* Record users keypresses */
  $(document).keypress(function (e) {
    if (e.which != 13) userInput += String.fromCharCode(e.which);
    /* When the user presses enter attempt to parse swipe id */ else {
      if ((userInput = regMatch.exec(userInput)) !== null) {
        userInput = parseInt(userInput[1]);
        view_swipe_modal(userInput, 5); // visible for 5 secs.
      }
      userInput = ""; // reset id string
    }
  });
}

/**
 * Toggles boolean values w/i SETTING_DATA object.
 * @param name - the name of the setting to toggle.
 */
function settings_toggle(name) {
  SETTING_DATA[name] = !SETTING_DATA[name];
}

/**
 * Activates the Bootstrap3 swipe modal w/ user photo and validation info.
 * @param customer_id - Swiped customer_id (probably ActiveNet alternate key).
 * @param timeout - The amount of time until the modal is dismissed.
 */
function view_swipe_modal(customer_id, timeout) {
  var _selected_room = ROOM_DATA.find(function (room) {
    return room.facility_id === Number(SETTING_DATA.facility);
  });

  if (_selected_room && SETTING_DATA.training)
    _selected_room.workstation_id = null;
  var image = new Image();
  image.className = "img-responsive";
  var alertDetails, alertStatus, alertClass;

  /* Make ajax call to card-reader.php  */
  $.ajax({
    url: "swipe.php",
    cache: true,
    data: {
      workstationId: _selected_room.workstation_id,
      customerId: customer_id,
    },
    success: function success(response) {
      var valid = response.valid,
        error = response.error;

      if (valid) {
        alertDetails = "Attendance Recorded";
        alertStatus = "Valid Pass";
        alertClass = "alert-success";
      } else {
        alertDetails = "See Customer Service";
        alertStatus = "Invalid Pass";
        alertClass = "alert-warning";
      }

      image.src = "photo.php?" + customer_id;
      /* Display Model */

      document.getElementById("cr-response").innerHTML =
        '<div class="alert ' +
        alertClass +
        '" role="alert"><strong>' +
        alertStatus +
        ": </strong>" +
        alertDetails +
        "</div>";
      document.body.appendChild(image);
      document.getElementById("cr-response").appendChild(image);
      $("#swipe-modal").modal("show");

      /* Hide modal after timeout */
      _swipe_cooldown = timeout * 1000;
      if (_swipe_cooldown) {
        clearTimeout(_swipe_timer);
        _swipe_timer = setTimeout(function () {
          $("#swipe-modal").modal("hide");
        }, _swipe_cooldown);
      }
    },
  });
}

/**
 * Turns a time range into a formatted string.
 * @param from - the from UNIX timestamp.
 * @param to - the to UNIX timestamp.
 * @returns {string} - the formatted time string.
 */
function format_time(from, to) {
  return (
    dayjs.unix(from).format("hh:mma") +
    " \u2013 " +
    dayjs.unix(to).format("hh:mma")
  );
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
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Loads the display's title and appearance based on that configuration.
 */
function init_config() {
  /* Load settings from url query */
  url_decode();
  _selected_room = ROOM_DATA.find(function (room) {
    return Number(room.facility_id) === Number(SETTING_DATA.facility);
  });
  if (_selected_room && SETTING_DATA.training)
    _selected_room.workstation_id = null;

  /* Set Facility Name */
  document.getElementById("facility-name").innerHTML = _selected_room.name;
  var nameLen = _selected_room.name.length;
  $("#facility-name").css("font-size", 2.5 + 40 / nameLen + "vw");

  /* Configure Settings Modal */
  ROOM_DATA.forEach(function (room) {
    if (!room.visible) return;
    var input = document.createElement("input");
    input.type = "radio";
    input.name = "facility_id";
    input.id = room.facility_id;
    input.onclick = function () {
      SETTING_DATA.facility = room.facility_id;
    };
    input.checked = room.facility_id == SETTING_DATA.facility;
    var label = document.createElement("label");
    label.setAttribute("for", room.facility_id);
    label.className = "label-primary";
    var div = document.createElement("div");
    div.className = "material-switch pull-right";
    div.appendChild(input);
    div.appendChild(label);
    var li = document.createElement("li");
    li.className = "list-group-item";
    li.appendChild(document.createTextNode(room.name));
    li.appendChild(div);
    $("#facility-dropdown").append(li);
  });
  $("#load-settings").on("click", function () {
    $("#settings-modal").modal("show");
    $.each(SETTING_DATA, function (setting, state) {
      if (setting != "facility") {
        $("#" + setting).prop("checked", Boolean(state));
      }
    });
  });

  /* Activate swiping if a workstation is set */
  if (_selected_room.workstation_id) control_keypress();
}

/**
 * Will display the current time within the 'live-time id'. Formatted to look
 * like 10:00am, for example. Calls itself recursively to update the time.
 */
function init_clock() {
  // eslint-disable-next-line no-undef
  document.getElementById("live-time").innerHTML = dayjs().format("h:mma");
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
      activeId: SETTING_DATA.facility, //,'dateOffset': "-1"
    },
    success: function success(response) {
      var json = JSON.parse(response);
      var time_now = (Date.now() / 1000) | 0;

      /* Hide passed events */
      if (!SETTING_DATA.show_passed_events) {
        for (var event in json) {
          if (json.hasOwnProperty(event))
            if (time_now > json[event].time_to) delete json[event];
        }
      }

      if ($.isEmptyObject(json)) {
        $("#event-text").css("display", "block");
        $("#event-table").css("display", "none");
      } else {
        $("#event-text").css("display", "none");
        $("#event-table").css("display", "table");
        var maxrows = Math.floor((window.innerHeight / window.innerWidth) * 9);
        var tbody = document.getElementById("event-table-body");
        var colour = "#000000";
        var steps = Object.keys(json).length;
        steps = 1 / (steps <= maxrows ? steps : maxrows);
        var step = 0;

        for (var entry in json) {
          if (json.hasOwnProperty(entry)) {
            var tr_body = document.createElement("tr");
            var time_from = json[entry].time_from;
            var time_to = json[entry].time_to;
            var td_time = document.createElement("td");
            td_time.appendChild(
              document.createTextNode(format_time(time_from, time_to))
            );
            tr_body.appendChild(td_time);
            var td_name = document.createElement("td");
            td_name.appendChild(document.createTextNode(json[entry].name));
            tr_body.appendChild(td_name);
            tr_body.style.color = colour;
            tr_body.style.color =
              time_from < time_now &&
              time_now < time_to &&
              SETTING_DATA.highlight_current
                ? "#4da6ff"
                : colour;
            tbody.appendChild(tr_body);
            colour = shadeColour(colour, (steps * ++step) / 1.5 - 0.1);
            if (step == maxrows) break;
          }
        }
      }
    },
  });
  setTimeout(function () {
    init_event();
  }, 300000); // 5 min
}
