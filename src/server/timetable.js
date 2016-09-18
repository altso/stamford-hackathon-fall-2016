(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
      console.log("1");
        // AMD
        define(['babyparse'], factory);
    } else if (typeof exports === 'object') {
           console.log("2");
   // CommonJS
        module.exports = factory(require('babyparse'));
    } else if (typeof require === 'function') {
      // scriptr
        root.Timetable = factory(require('babyparse.js').Baby, require("document"));
      
    } else {

          console.log(root);
    // Browser globals (Note: root is window)
        root.Timetable = factory(root.Baby);
    }
} (this, function (baby, document) {
	function loadData(stops, stop_times, trips, routes) {
        var i, len, options = { header: true, dynamicTyping: true }, state = {};

        // stops
        state.stops = baby.parse(stops, options).data;

        // stop times
        state.stop_times = baby.parse(stop_times, options).data;

        // trips
        var trips = baby.parse(trips, options).data;
        state.trips = trips;

        // routes
        var routes = baby.parse(routes, options).data;
        state.routes = routes;
      
      return state;
    }

    function getNextRoutes(state, lat, lon, count, now) {
        // defaults
        count = count || 5;
        now = now || new Date();

        var now_time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        var stop = getClosestStop(lat, lon, state.stops);
        var times = getNextTimes(stop.stop_id, now_time, state.stop_times, count);
        var result = [], time, trip;
        for (var i = 0, len = times.length; i < len; i++) {
            time = times[i];
            trip = state.trips[time.trip_id];
            result.push({
                stop_time: time,
                trip: state.trips[time.trip_id],
                route: state.routes[trip.route_id]
            })
        }
        return result;
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

    function getClosestStop(lat, lon, stops) {
        var closestStop = null, closestDistance = 1000000000, distance;
        for (var i = 0; i < stops.length; i++) {
            distance = getDistance(lat, lon, stops[i].stop_lat, stops[i].stop_lon);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestStop = stops[i];
            }
        }
        return closestStop;
    }

    function getNextTimes(stop_id, now_time, stop_times, count) {
        var i, len, stop_time, prev_stop_time, start_index = -1, result = [];
        for (i = 0, len = stop_times.length; i < len; i++) {
            stop_time = stop_times[i];
            if (stop_time.stop_id === stop_id) {
                result.push(stop_time);
            }
        }

        result.sort(function (a, b) {
            return parseTime(a.arrival_time) - parseTime(b.arrival_time);
        });

        for (i = 0, len = result.length; i < len; i++) {
            if (now_time > parseTime(result[i].arrival_time)) {
                if (start_index < 0) {
                    start_index = Math.max(0, i - 1);
                }
            }
        }

        if (start_index > 0) {
            result.splice(0, start_index);
        }
        result.splice(count);
        return result;
    }

    function parseTime(time) {
        if (time === undefined) return 0;
        var m = time.match(/(\d+)\:(\d+)\:(\d+)/i);
        return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
    }

    // Exposed public methods
    return {
        version: 1,
        loadData: loadData,
        getNextRoutes: getNextRoutes
    }
}));