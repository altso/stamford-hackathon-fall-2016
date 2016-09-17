(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['babyparse'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require('babyparse'));
    } else {
        // Browser globals (Note: root is window)
        root.returnExports = factory(root.babyparse);
    }
} (this, function (baby) {
    var state = {};

    console.log("babyparse", baby);
    console.log("babyparse.Baby", baby.Baby)

    function loadData(stops, stop_times, trips, routes) {
        state.stops = baby.parse(stops);
        state.stop_times = baby.parse(stop_times);
        state.trips = baby.parse(trips);
        state.routes = baby.parse(routes);
    }

    function getDistance(latitude1, longitude1, latitude2, longitude2) {
        const r = 6371 * 1000; // km

        var dLat = getRad(latitude2 - latitude1);
        var dLon = getRad(longitude2 - longitude1);
        var lat1 = getRad(latitude1);
        var lat2 = getRad(latitude2);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = r * c;

        return d;
    }

    function getRad(value) {
         return value * Math.PI / 180;
    }

    function getNextRoutes(lat, lon, count, now) {
        var stop = getClosestStop(lat, lon, state.stops);
        return stop;
    }

    function getClosestStop(lat, lon, stops) {
        var closestStop = null, closestDistance = 1000000000, distance;
        for (var i = 0; i < stops.length; i++) {
            distance = getDistance(lat, lon, stops[i].stop_lat, stops[i].stop_lon);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestStop = stop[i];
            }
        }
        return closestStop;
    }

    // Exposed public methods
    return {
        loadData: loadData
    }
}));