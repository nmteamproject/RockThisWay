var app = (function () {
    // Application object.
    var app = {};

    // History of enter/exit events.
    var mRegionEvents = [];

    // Nearest ranged beacon.
    var mNearestBeacon = null;

    // Timer that displays nearby beacons.
    var mNearestBeaconDisplayTimer = null;

    // Background flag.
    var mAppInBackground = false;

    // Background notification id counter.
    var mNotificationId = 0;

    var previousBeacon;

    // Mapping of region event state names.
    // These are used in the event display string.
    var mRegionStateNames = {
        'CLRegionStateInside': 'Enter',
        'CLRegionStateOutside': 'Exit'
    };

    //Looks for beacons that have the following properties.
    //In order for a beacon to be detected, it has to be put into the following list
    var mRegions = [
        {
            id: 'region1',
            uuid: '7b44b47b-52a1-5381-90c2-f09b6838c5d4',
            major: 112,
            minor: 154
		},
        {
            id: 'region2',
            uuid: '7b44b47b-52a1-5381-90c2-f09b6838c5d4',
            major: 152,
            minor: 114
		},
        {
            id: 'region3',
            uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
            major: 19175,
            minor: 17780
		},
        {
            id: 'region4',
            uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
            major: 18015,
            minor: 60062
		},
        {
            id: 'region5',
            uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
            major: 50017,
            minor: 64202
		}

	];

    //Name of the beacons in range.
    var mRegionData = {
        'region1': 'iPhone iBeacon',
        'region2': 'iPhone iBeacon',
        'region3': 'Green Estimote Beacon',
        'region4': 'Ice Estimote Beacon',
        'region5': 'Indigo Estimote Beacon'
    };

    app.initialize = function () {
        document.addEventListener('deviceready', onDeviceReady, false);
        document.addEventListener('pause', onAppToBackground, false);
        document.addEventListener('resume', onAppToForeground, false);
    };

    function onDeviceReady() {
        startMonitoringAndRanging();
        startNearestBeaconDisplayTimer();
        displayRegionEvents();
    }

    function onAppToBackground() {
        mAppInBackground = true;
        stopNearestBeaconDisplayTimer();
    }

    function onAppToForeground() {
        mAppInBackground = false;
        startNearestBeaconDisplayTimer();
        displayRegionEvents();
    }

    function startNearestBeaconDisplayTimer() {
        mNearestBeaconDisplayTimer = setInterval(displayNearestBeacon, 1000);
    }

    function stopNearestBeaconDisplayTimer() {
        clearInterval(mNearestBeaconDisplayTimer);
        mNearestBeaconDisplayTimer = null;
    }

    function startMonitoringAndRanging() {
        function onDidDetermineStateForRegion(result) {
            saveRegionEvent(result.state, result.region.identifier);
            displayRecentRegionEvent();
        }

        function onDidRangeBeaconsInRegion(result) {
            updateNearestBeacon(result.beacons);
        }

        function onError(errorMessage) {
            console.log('Monitoring beacons did fail: ' + errorMessage);
        }

        // Request permission from user to access location info.
        cordova.plugins.locationManager.requestAlwaysAuthorization();

        // Create delegate object that holds beacon callback functions.
        var delegate = new cordova.plugins.locationManager.Delegate();
        cordova.plugins.locationManager.setDelegate(delegate);

        // Set delegate functions.
        delegate.didDetermineStateForRegion = onDidDetermineStateForRegion;
        delegate.didRangeBeaconsInRegion = onDidRangeBeaconsInRegion;

        // Start monitoring and ranging beacons.
        startMonitoringAndRangingRegions(mRegions, onError);
    }

    function startMonitoringAndRangingRegions(regions, errorCallback) {
        // Start monitoring and ranging regions.
        for (var i in regions) {
            startMonitoringAndRangingRegion(regions[i], errorCallback);
        }
    }

    function startMonitoringAndRangingRegion(region, errorCallback) {
        // Create a region object.
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(
            region.id,
            region.uuid,
            region.major,
            region.minor);

        // Start ranging.
        cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
            .fail(errorCallback)
            .done();

        // Start monitoring.
        cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
            .fail(errorCallback)
            .done();
    }

    function saveRegionEvent(eventType, regionId) {
        // Save event.
        mRegionEvents.push({
            type: eventType,
            time: getTimeNow(),
            regionId: regionId
        });

        // Truncate if more than ten entries.
        if (mRegionEvents.length > 10) {
            mRegionEvents.shift();
        }
    }

    function getBeaconId(beacon) {
        return beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
    }

    function isSameBeacon(beacon1, beacon2) {
        return getBeaconId(beacon1) == getBeaconId(beacon2);
    }

    function isNearerThan(beacon1, beacon2) {
        return beacon1.accuracy > 0 && beacon2.accuracy > 0 && beacon1.accuracy < beacon2.accuracy;
    }

    function updateNearestBeacon(beacons) {
        for (var i = 0; i < beacons.length; ++i) {
            var beacon = beacons[i];
            if (!mNearestBeacon) {
                mNearestBeacon = beacon;
            } else {
                if (isSameBeacon(beacon, mNearestBeacon) ||
                    isNearerThan(beacon, mNearestBeacon)) {
                    mNearestBeacon = beacon;
                }
            }
        }
    }

    function displayNearestBeacon() {
        if (!mNearestBeacon) {
            return;
        }

        // If the nearest beacon changes, the code on beacons.html will change to the following based on beacon.major

        if (mNearestBeacon.major != previousBeacon) {
            $('#test').empty();
            $('#homeScreen').empty();
            if (mNearestBeacon.major == 19175) {
                var tester = $('<a href="triviagame.html"><p style="background:#00ff00" class="gameNotification animated slideInUp"><strong class = "gameText">Play a Trivia Game!</strong></p></a>');
                var hScreen = $('<img src="images/map1.png" width="100%">');
            } else if (mNearestBeacon.major == 18015) {
                var tester = $('<a href="againstthecrowd.html"><p style="background:#ffff00" class="gameNotification animated slideInUp"><strong class = "gameText">Play Battle of the Bands!</strong></p></a>');
                var hScreen = $('<img src="images/map2.png" width="100%">');
            } else if (mNearestBeacon.major == 50017) {
                var tester = $('<a href="lyricgame.html"><p style="background:#00ffff" class="gameNotification animated slideInUp"><strong class = "gameText">Play Lyracle!</strong></p></a>');
                var hScreen = $('<img src="images/map3.png" width="100%">');
            } else {
                var tester = $(' ');
            }

            $('#test').append(tester);
            $('#homeScreen').append(hScreen);
        }
        previousBeacon = mNearestBeacon.major;

    }

    function displayRecentRegionEvent() {
        if (mAppInBackground) {
            // Set notification title.
            var event = mRegionEvents[mRegionEvents.length - 1];
            if (!event) {
                return;
            }
            var title = getEventDisplayString(event);

            // Create notification.
            cordova.plugins.notification.local.schedule({
                id: ++mNotificationId,
                title: title
            });
        } else {
            displayRegionEvents();
        }
    }

    function displayRegionEvents() {
        // Displayed before it connects to beacons or while there is no beacon in range.
        //uncomment bottom line if we need to change the home screen.
        if (mRegionEvents.length <= 0) {
            var element = $(
                '<li>' + '<strong>' + 'Waiting for region events, please move into or out of a beacon region.' + '</strong>' + '</li>'
            );
            //$('#homeScreen').append(element);
        }
    }

    function getEventDisplayString(event) {
        return event.time + ': ' + mRegionStateNames[event.type] + ' ' + mRegionData[event.regionId];
    }

    function getTimeNow() {
        function pad(n) {
            return (n < 10) ? '0' + n : n;
        }

        function format(h, m, s) {
            return pad(h) + ':' + pad(m) + ':' + pad(s);
        }

        var d = new Date();
        return format(d.getHours(), d.getMinutes(), d.getSeconds());
    }

    return app;

})();

app.initialize();