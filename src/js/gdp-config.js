var GDP_DATA_LOADED = true;

/* You can add new rooms to the display panel by adding entries below.
 * The key is the ActiveNet facility ID, the workstation is used for swiping,
 * and if set as visible it will be selectable from the gdp drop-down menu.
 * For more info view the README at github.com/jkwill87/gryph-display-panel.
 */
var GDP_FACILITIES = {
    27: {
        name: "Gold Rink",
        workstation: 0,
        visible: true
    },
    131: {
        name: "Gryphon Lounge",
        workstation: 0,
        visible: true
    },
    541: {
        name: "Main Lobby",
        workstation: 0,
        visible: false
    },
    545: {
        name: "Gryphon Suite",
        workstation: 0,
        visible: false
    },
    549: {
        name: "GGAC Recreation Room 3205",
        workstation: 51,
        visible: true
    },
    548: {
        name: "GGAC Wrestling Room 3206",
        workstation: 52,
        visible: true
    },
    550: {
        name: "GGAC Studio Room 3212",
        workstation: 53,
        visible: true
    },
    553: {
        name: "GGAC Studio Room 3213",
        workstation: 54,
        visible: true
    },
    551: {
        name: "GGAC Studio Room 3214",
        workstation: 55,
        visible: true
    },
    552: {
        name: "GGAC Studio Room 3216",
        workstation: 56,
        visible: true
    }
};

var GDP_SETTINGS = {
    show_passed_events: false,
    highlight_current: false,
    training: false,
    facility: 131
};
