<!DOCTYPE html>
<html lang="en-CA">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gryphon Display Panel</title>

    <!-- Stylesheets -->
    <link href="vendor.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
</head>


<body>
    <!--Swipe Modal Content-->
    <div class="modal" id="swipe-modal" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-body" id="cr-response"></div>
            </div>
        </div>
    </div>

    <!-- Button trigger modal -->
    <button class="btn btn-default config-button" type="button" id="load-settings">
        <?php echo file_get_contents("img/cogs.svg") ?>
    </button>

    <!-- Setting Modal Content -->
    <div class="modal" id="settings-modal" role="dialog">

        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <button class="close" type="button" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h1 class="modal-title" id="settings-modal-label">
                        Gryph Display Panel
                    </h1>
                </div>

                <div class="modal-body" id="modal-body">
                    <div class="panel-group" id="accordion">

                        <!-- Facility Selection -->
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <a data-toggle="collapse" data-parent="#accordion" href="#collapse1">
                                    Facility Selection
                                </a>
                            </div>

                            <div class="panel-collapse collapse" id="collapse1">
                                <ul class="list-group" id="facility-dropdown">
                                </ul>
                            </div>
                        </div>

                        <!-- Event Management -->
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <a data-toggle="collapse" data-parent="#accordion" href="#collapse2">
                                    Event Management
                                </a>
                            </div>
                            <div id="collapse2" class="panel-collapse collapse">

                                <ul class="list-group">

                                    <li class="list-group-item">
                                        Show Passed Events
                                        <div class="material-switch pull-right">
                                            <input id="show_passed_events" name="show_passed_events" type="checkbox" onclick="settings_toggle('show_passed_events')" />
                                            <label for="show_passed_events" class="label-primary"></label>
                                        </div>
                                    </li>

                                    <li class="list-group-item">
                                        Highlight Current Event
                                        <div class="material-switch pull-right">
                                            <input id="highlight_current" name="highlight-current" type="checkbox" onclick="settings_toggle('highlight_current')" />
                                            <label for="highlight_current" class="label-primary"></label>
                                        </div>
                                    </li>
                                    <li class="list-group-item">
                                        Use ActiveNet Trainer
                                        <div class="material-switch pull-right">
                                            <input id="training" name="highlight-current" type="checkbox" onclick="settings_toggle('training')" />
                                            <label class="label-primary" for="training">
                                            </label>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" type="button" onclick="url_encode()">
                        Save & Reload
                    </button>
                    <button class="btn btn-link pull-right" type="button" onclick="url_reset()">
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Page Content -->
    <div class="container-fluid">

        <!-- Dynamic Time -->
        <div class="row buffer-lg">
            <div class="col-sm-10 col-xs-12">
                <h1 id="facility-name"></h1>
            </div>
            <div class="col-sm-2 visible-lg">
                <p class="pull-right" id="live-time"></p>
            </div>
        </div>

        <!-- Event Table -->
        <div class="row">
            <p id="event-body"></p>
        </div>

    </div>

    <!-- Scripting -->
    <script>
        var ROOM_DATA = <?php include('data/rooms.json') ?>
        var SETTING_DATA = <?php include('data/settings.json') ?>
    </script>
    <script type="text/javascript" src="vendor.js"></script>
    <script type="text/javascript" src="gdp.js"></script>

    <!-- JavaScript Modules -->
    <script>
        document.body.style.overflow = 'hidden'; // disable scrollbars
        init_config();
        init_clock();
        init_event();
    </script>

</body>

</html>