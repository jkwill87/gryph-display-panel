# gryph-display-panel (GDP)

GDP is a web application developed for the University of Guelph's athletic department's new digital signage. It is designed to display meeting and event schedules, as well as to validate and report member participation during classes. It does this through Active Net's SOAP WSDL service and by making server-side HTTPS requests using curl.

Its backend is developed using PHP and the frontend using JavaScript, Bootstrap, and HTML. The service can be run as a simple web page in a browser on a PC or mobile device.

## Features

### Viewing Events

![gryph display panel](_readme/gdp-main.png)

GDP has a responsive design that can scale to a variety of device and screen ratios. It will limit the number of displayed events by the amount displayable by the screen. It can be configured, as described below, to highlight the current event and to cull past events.

### Pass Validation

Pass validation works by capturing keypresses from the browser and submitting once the enter key is pressed. A card reader or RFID scanner which registers as a keyboard device is the intended source of input. Regular expressions are used to parse members' IDs so that these devices can be used out of the box without configuring their output formatting. Student, staff, or Active IDs should all work in order to pull up membership accounts.

When a swipe is registered it is validated against the workstation ID associated with it (see administration below). This works the same way as it would through the front desk. Swipes are recorded and can be used to generate usage reports. Swiping will display one of two alerts:

* **Valid Pass**, in green, which indicates that the member has a valid membership which qualifies for the activity.
* **Invalid Pass**, in yellow, which indicates that the member has a valid membership, but one that does not qualify for the activity.

If the user does not have a valid pass they are advised to see the front desk for assistance.

![changing gdp settings](_readme/gdp-validate.png)

### Configuration

All of the service's settings can be configured through the browser with a mouse or touchscreen. Just click on the settings icon in the top right of the screen. This will pop up a configuration modal where the user can change the displayed facility and set event management options, such as highlighting the current event and toggling whether past events are displayed. Click 'Save & Reload' to commit changes.

![changing gdp settings](_readme/gdp-config.png)

## Deployment

### Server Setup

Before being hosted `data/auth.txt` needs to be configured with Active Net credentials. The first line must contain the plaintext username for the account and the second line must contain the corresponding password. This file is accompanied by a `.htaccess` file to protect it from being served with Apache.

The latest version distributable version of GDP can be downloaded from the project [releases page](https://github.com/jkwill87/gryph-display-panel/releases) or built interactively using [grunt](http://gruntjs.com). Either way the web application can be deployed by uploading the contents of 'dist' to a web server. Ensure that the 'cache' directory has full read-write access for the `apache` user or else swiping will not work-- ie. `chmod -R 777 cache` . GDP requires PHP and has been tested as working with versions 5.3, 5.6, and 7.0.

If you chose to go the grunt route you need to have [NodeJS](https://nodejs.org) installed on your system. Afterwards GDP can be transpiled and configured interactively using the following commands:

``` shell
npm install
npm run build
```

![configuring gdp with grunt](_readme/grunt.gif)

## Administration

### Managing Rooms

Rooms can be managed by editing `data/rooms.json` . Here's a breakdown of the various fields and how they are formatted:  

``` json5
[
  {
    "name": "Gryphon Field House",  // Display name
    "facility_id": 9,               // The id to pull event data for
    "workstation_id": null,         // Where to send swipe data to (if set)
    "visible": false                // Whether to display the room as a selectable option
  },
  {
    "name": "Mitchell Gym - Court #1",
    "facility_id": 10,
    "workstation_id": 34,
    "visible": true
  },
  //...
]
```

This scheme would make two facilities selectable from the dropdown menu, Gryphon Field House and Mitchell Gym - Court #1. By using a workstation number of 34, it would record card swipes at the W. F. Mitchell building's left turnstile. Gryphon Field House would not show up in the facility menu because it's visible entry is set to false.

#### Finding Active Net Facility IDs

Facility IDs are used internally by Active Net in order to query event listings. Unfortunately the process of finding them is somewhat involved.

Log in to Active Net and navigate to the [Resource Scheduler](https://anprodca.active.com/uofg/servlet/flexResourceScheduler.sdi). Click on the blue link for the facility you are interested in (1). This will activate a popup window. The URL for this window will have the text `facility_id=...` that number is the facility id. For instance, in the depicted example it would be 131(2).

![finding active net facility ids](_readme/find_fid.png)

### Finding Active Net Workstation IDs

Open cookie management in your browsers web developer tools. This will vary based on your browser, Google is your friend here. Delete any cookies under `anprodca.active.com` . This will log you out if you were previously logged in. Navigate to the [Assign Workstation](https://anprodca.active.com/uofg/servlet/processAssignWorkstation.sdi). Login, select a workstation, and note the value of the `uofg_workstation_id` cookie. Repeat for each workstation you're interested in. **Note:** `uofg_workstation_id` is only set when you login and initially set your workstation so you need to clear your cookies and log in again for each workstation.

#### Setting Default Settings

You are able to configure the default and fallback options for GDP in `data/settings.json` . These are loaded by default when the system is powered or when cookies are cleared.

### Kiosk Setup

The kiosks will be deployed on about a dozen Raspberry Pi 3s paired with 22" Dell touchscreen LCD displays. The Pis are running a customized version of Raspbian Jessie Lite. It runs a full-screen Midori browser using Matchbox window manager. This package mounts the SD card as read-only in order to improve security and prolong the life of SD cards.

The filesystem can be easily be remounted with either read-only or read-write access for maintenance, etc. by executing `/root/remount.sh ro` or `/root/remount.sh rw` , respectively. tty2 onwards have been disabled to prevent tampering and the sudo account cannot be SSHed into directly. Only the `gdp` user can be SSHed into using public-private key pairs.

#### Formatting the SD Card (Linux and MacOS)

* [Download the latest image](https://gryphons.ca/gryphrec/gdp/rpi) from gryphons.ca.
* Expand the gzip archive; ie. `tar xvzf gdp-v1.img.tar.gz`.
* dd the image onto the SD card; ie. `dd bs=512 if=~/Downloads/gdp.img of=/dev/rdisk2`.

#### Formatting the SD Card (Windows)

* [Download the latest image](https://gryphons.ca/gryphrec/gdp/rpi)  from gryphons.ca.
* [Download 7zip](http://www.7-zip.org/download.html) to expand the gzip archive.
* [Download Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager) to copy the image onto the SD card.
