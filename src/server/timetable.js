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

        console.log(now);

        var now_time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        var stop = getClosestStop(lat, lon, state.stops);
        var times = getNextTimes(stop.stop_id, now_time, state.stop_times, count);
        var result = [], time, trip, route, i, len;
        var tripMap = {}, routeMap = {};
        for (i = 0, len = state.trips.length; i < len; i++) {
            trip = state.trips[i];
            if (trip.trip_id) {
                tripMap[trip.trip_id] = trip;
            }
        }
        for (i = 0, len = state.routes.length; i < len; i++) {
            route = state.routes[i];
            if (route.route_id) {
                routeMap[route.route_id] = route;
            }
        }
        for (i = 0, len = times.length; i < len; i++) {
            time = times[i];
            trip = tripMap[time.trip_id];
            route = routeMap[trip.route_id];
            result.push({
                route_short_name: route.route_short_name.toString(),
                route_color: ("000000" + route.route_color.toString()).substring(route.route_color.toString().length),
                trip_headsign: trip.trip_headsign,
                arrival_time: time.arrival_time
            })
        }
        return result;
    }

    function findTrip(trips, trip_id) {
        for (var i = 0, len = trips.length; i < len; i++) {
            if (trips[i].trip_id === trip_id) return trips[i];
        }
        return null;
    }
    function findRoute(routes, route_id) {
        for (var i = 0, len = routes.length; i < len; i++) {
            if (routes[i].route_id === route_id) return routes[i];
        }
        return null;
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

        //console.log("Distance between (" + latitude1 + ", " + longitude1 + ") and (" + latitude2 + ", " + longitude2 + ") = " + d);

        return d;
    }

    function getRad(value) {
        return value * Math.PI / 180;
    }

    function getClosestStop(lat, lon, stops) {
        console.log(lat);
        console.log(lon);

        var closestStop = null, closestDistance = 1000000000, distance, stop;
        for (var i = 0; i < stops.length; i++) {
            stop = stops[i];

            distance = getDistance(lat, lon, stop.stop_lat, stop.stop_lon);
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
        /*
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
        */
        return result;
    }

    function getUniqueRoutes(times) {

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
        getNextRoutes: getNextRoutes,
        getClosestStop: getClosestStop,
        parseTime: parseTime
    }
}));