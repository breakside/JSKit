// #import "Foundation/JSObject.js"
// #import "Foundation/JSDate.js"
// #feature Intl
/* global Intl, JSClass, JSObject, JSDate, JSReadOnlyProperty, JSTimeZone */
'use strict';

JSClass("JSTimeZone", JSObject, {

    initWithName: function(name){
        // TODO: lookup data structure for name
    },

    initWithAbbreviation: function(abbreviation){
        var name = JSTimeZone.abbreviationDictionary[abbreviation];
        if (!name){
            return null;
        }
        this.initWithName(name);
    },

    initWithTimeIntervalFromUTC: function(timeInterval){
        // init data structure according to single fixed time interval
    },

    timeIntervalFromUTC: JSReadOnlyProperty(),

    getTimeIntervalFromUTC: function(){
        return this.timeIntervalFromUTCForDate(JSDate.now);
    },

    timeIntervalFromUTCForDate: function(date){
        // TODO:
    },

    abbreviation: JSReadOnlyProperty(),

    getAbbreviation: function(){
        return this.abbreviationForDate(JSDate.now);
    },

    abbreviationForDate: function(date){
        if (this.isDaylightSavingsTimeForDate(date)){
            // TODO:
        }else{
            // TODO:
        }
    },

    isDaylightSavingTime: JSReadOnlyProperty(),

    getIsDaylightSavingsTime: function(){
        return this.isDaylightSavingsTimeForDate(JSDate.now);
    },

    isDaylightSavingsTimeForDate: function(date){
        // TODO:
    },

    nextDaylightSavingsTransition: JSReadOnlyProperty(),

    getNextDaylightSavingsTransition: function(){
        return this.nextDaylightSavingsTransitionAfterDate(JSDate.now);
    },

    nextDaylightSavingsTransitionAfterDate: function(date){
        // TODO:
    },

    localizedName: function(style, locale){
        // TODO:
    }

});

Object.defineProperties(JSTimeZone, {
    local: {
        configurable: true,
        get: function JSTimeZone_getLocal(){
            var name = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
            var timezone = JSTimeZone.initWithName(name);
            Object.defineProperties(JSTimeZone, 'local', {configurable: true, value: timezone});
            return timezone;
        }
    },
    utc: {
        configurable: true,
        get: function JSTimeZone_getUTC(){
            var timezone = JSTimeZone.initWithTimeIntervalFromUTC(0);
            Object.defineProperties(JSTimeZone, 'utc', {configurable: false, value: timezone});
            return timezone;
        }
    }
});

JSTimeZone.knownTimeZoneNames = [
];

JSTimeZone.abbreviationDictionary = {
};