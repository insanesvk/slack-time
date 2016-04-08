var SlackTime = {};
var moment = require('moment-timezone');
var _ = require('lodash');
var timezones = require('./timezones.json');
var Helpers = require('./helpers');

SlackTime.processRequest = function(command) {
    var processed = this._processCommand(command);

    if(processed.continue === false) {
        return processed.response;
    }

    return this._processTZDiff(
        processed.response.time,
        processed.response.format,
        processed.response.zoneA,
        processed.response.zoneB
    );
}

SlackTime._processCommand = function(command) {
    if(command == "help") {
        return {
            continue: false,
            response: this._returnHelp()
        };
    }

    var exploded = command.split(" ");
    var timeToCheck,
        format,
        zoneIndexA = 0,
        zoneIndexB = 0;

    if(exploded[0].indexOf(":") == -1) {
        exploded[0] = exploded[0] + ":00";
    } else {
        var splitTime = exploded[0].split(":");
        if(splitTime[0].length == 1) {
            exploded[0] = "0" + splitTime[0] + ":" + splitTime[1];
        }
    }

    // check time format (12/24h)
    if(exploded[1].toLowerCase() == "am" || exploded[1].toLowerCase() == "pm") {
        timeToCheck = exploded[0] + " " + exploded[1].toUpperCase();
        format = "Y-MM-DD hh:mm AA";
        zoneIndexA = 2;
        zoneIndexB = 4;
    } else {
        timeToCheck = exploded[0];
        format = "Y-MM-DD HH:mm";
        zoneIndexA = 1;
        zoneIndexB = 3;
    }

    if(exploded[zoneIndexA] !== undefined && exploded[zoneIndexB] !== undefined) {
        var searchedZoneA = exploded[zoneIndexA].toUpperCase();
        var searchedZoneB = exploded[zoneIndexB].toUpperCase();

        // check if timezones are found within the timezones file
        var zonesObjA = _.find(timezones, { zoneName: searchedZoneA });
        var zonesObjB = _.find(timezones, { zoneName: searchedZoneB });

        if(zonesObjA !== undefined && zonesObjB !== undefined) {
            return {
                continue: true,
                response: {
                    time: timeToCheck,
                    format: format,
                    zoneA: zonesObjA,
                    zoneB: zonesObjB
                }
            }
        } else {
            return {
                continue: false,
                response: "Timezones not found"
            };
        }
    } else {
        return {
            continue: false,
            response: "err" //todo improve this err
        };
    }

}

SlackTime._processTZDiff = function(time, format, zoneA, zoneB) {
    var nowInA = moment.tz(zoneA.timezone),
         firstDate = moment.tz(nowInA.format("Y-MM-DD") + " " + time, format, zoneA.timezone),
         toDate = firstDate.tz(zoneB.timezone);

    var dayOfWeekB = Helpers.dayNames()[toDate.get('day')],
        dayOfWeekA = Helpers.dayNames()[nowInA.get('day')];

    return time + " " + dayOfWeekA + ", " + nowInA.format("zz") + " is " + toDate.format("HH:mm") + " " + dayOfWeekB
        + ", " + toDate.format("zz");
}

SlackTime._returnHelp = function() {
    return "You can do stuff like \/whattimeis 12 pm CET in PST or \/whattimeis help";
}

module.exports = SlackTime;
