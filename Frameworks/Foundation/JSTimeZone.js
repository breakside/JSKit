// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
// #import "JSDate.js"
// #import "JSBinarySearcher.js"
// #feature Intl
/* global JSGregorianCalendar, Intl, DataView */
'use strict';

(function(){

JSClass("JSTimeZone", JSObject, {

    initWithIdentifier: function(identifier){
        var lookup = zoneinfo.map[identifier];
        if (lookup === undefined){
            return null;
        }
        var zone = zoneinfo.zones[lookup.index];
        this._transitionTimes = zone.transitions;
        this._transitionTimesToLocalTimeTypes = zone.map;
        this._localTimeTypes = zone.types;
        this._futureRules = zone.rule || null;
        if (this._localTimeTypes.length === 0){
            return null;
        }
        this._defaultTimeTypeIndex = this._getDefaultTimeTypeIndex();
    },

    initWithTimeIntervalFromUTC: function(timeInterval, abbreviation){
        this._fixedOffset = timeInterval;
        this._fixedAbbreviation = abbreviation;
    },

    initWithData: function(data){
        // https://www.man7.org/linux/man-pages/man5/tzfile.5.html
        if (!(data instanceof JSData)){
            return null;
        }

        var dataLength = data.length;

        // Header is 44 bytes
        if (dataLength < 44){
            return null;
        }

        // Must start with TZif
        if (data[0] != 0x54 || data[1] != 0x5A || data[2] != 0x69 || data[3] != 0x66){
            return null;
        }

        // Version is an ASCII number
        var version = data[4];

        // (next 15 bytes are ignored)
        var offset = 20;

        var dataView = data.dataView();
        var readCounts = function(offset){
            return {
                universal: dataView.getUint32(offset),
                standard: dataView.getUint32(offset + 4),
                leap: dataView.getUint32(offset + 8),
                transition: dataView.getUint32(offset + 12), 
                type: dataView.getUint32(offset + 16),
                abbreviation: dataView.getUint32(offset + 20)
            };
        };

        var counts;
        if (version == 0x32 || version == 0x33){ // ASCII "2" or "3"
            // vesion 2 or 3 means skip version 1 header and data
            counts = readCounts(offset);
            offset += 24;
            offset += 4 * counts.transition;
            offset += 1 * counts.transition;
            offset += 6 * counts.type;
            offset += counts.abbreviation;
            offset += 8 * counts.leap;
            offset += 1 * counts.standard;
            offset += 1 * counts.universal;
            if (offset + 44 > dataLength){
                // not enough input for expected v2/3 header
                return null;
            }
            // skip to offset for v2/3 counts
            offset += 20;
        }else if (version == 0x6A){ // ASCII "j" for jskit
            // custom JSKit version that omits v1 data
            // (we're already at the correct offset)
        }else{
            // We only support version 2, 3, and j
            return null;
        }

        // read v2/3 data
        counts = readCounts(offset);
        offset += 24;
        var length = offset;
        length += 8 * counts.transition;
        length += 1 * counts.transition;
        length += 6 * counts.type;
        length += counts.abbreviation;
        length += 12 * counts.leap;
        length += 1 * counts.standard;
        length += 1 * counts.universal;
        if (length > dataLength){
            // not enough input for data described by counts
            return null;
        }

        this._transitionTimes = [];
        this._transitionTimesToLocalTimeTypes = [];
        this._localTimeTypes = [];
        this._futureRules = null;

        // transition times are 8-byte signed integers
        var i;
        for (i = 0; i < counts.transition; ++i, offset += 8){
            this._transitionTimes.push(dataView.jskitGetInt64(offset));
        }

        // transition times map values are 1-byte integers
        for (i = 0; i < counts.transition; ++i, ++offset){
            if (data[offset] > counts.types - 1){
                return null;
            }
            this._transitionTimesToLocalTimeTypes.push(data[offset]);
        }

        // must have at least 1 type
        if (counts.type <= 0){
            return null;
        }

        // types are 6-byte structs
        // 0: 4-byte signed integer
        // 4: 1-byte boolean
        // 5: 1-byte offset into abbreviationsRange
        var abbreviationsRange = JSRange(offset + 6 * counts.type, counts.abbreviation);
        var readAbbreviation = function(offset){
            if (!abbreviationsRange.contains(offset)){
                return null;
            }
            var end = offset;
            var l = dataLength;
            while (end < dataLength && data[end] != 0x00){
                ++end;
            }
            if (!abbreviationsRange.contains(end)){
                return null;
            }
            return data.subdataInRange(JSRange(offset, end - offset)).stringByDecodingUTF8();
        };
        var type;
        for (i = 0; i < counts.type; ++i, offset += 6){
            type = {
                off: dataView.getInt32(offset),
                dst: data[offset + 4] !== 0,
                abbr: readAbbreviation(abbreviationsRange.location + data[offset + 5])
            };
            if (type.abbr === null){
                return null;
            }
            this._localTimeTypes.push(type);
        }

        // After the data comes a newline-enclosed
        // string describing how to handle future dates
        offset = length;
        var tzString = null;
        if (offset < dataLength && data[offset] == 0x0A){
            ++offset;
            i = offset;
            while (i < dataLength && data[i] !== 0x0A){
                ++i;
            }
            if (i == dataLength){
                // expecting newline
                return null;
            }
            tzString = data.subdataInRange(JSRange(offset, i - offset)).stringByDecodingUTF8();
            offset = i + 1;
            this._futureRules = JSTimeZone.rulesFromPOSIXString(tzString);
        }

        this._defaultTimeTypeIndex = this._getDefaultTimeTypeIndex();
    },

    _fixedOffset: null,
    _fixedAbbreviation: null,
    _transitionTimes: null,
    _transitionTimesToLocalTimeTypes: null,
    _localTimeTypes: null,
    _futureRules: null,
    _defaultTimeTypeIndex: 0,

    timeIntervalFromUTC: JSReadOnlyProperty(),

    getTimeIntervalFromUTC: function(){
        return this.timeIntervalFromUTCForDate(JSDate.now);
    },

    timeIntervalFromUTCForDate: function(date){
        if (this._fixedOffset !== null){
            return this._fixedOffset;
        }
        var localTimeType = this._getLocalTimeTypeForDate(date);
        return localTimeType.off;
    },

    abbreviation: JSReadOnlyProperty(),

    getAbbreviation: function(){
        return this.abbreviationForDate(JSDate.now);
    },

    abbreviationForDate: function(date){
        var offset = 0;
        if (this._fixedOffset !== null){
            if (this._fixedAbbreviation !== null){
                return this._fixedAbbreviation;
            }
            offset = this._fixedOffset;
        }else{
            var localTimeType = this._getLocalTimeTypeForDate(date);
            if (localTimeType.abbr !== ''){
                return localTimeType.abbr;
            }
            offset = this.timeIntervalFromUTCForDate(date);
        }
        var negative = offset < 0;
        if (negative){
            offset = -offset;
        }
        var hours = Math.floor(offset / 3600);
        var minutes = Math.floor((offset % 3600) / 60);
        var seconds = (offset % 3600) % 60;
        if (seconds !== 0){
            return "UTC%s%d:%02d:%02d".sprintf(negative ? '-' : '+', hours, minutes, seconds);
        }
        if (minutes !== 0){
            return "UTC%s%d:%02d".sprintf(negative ? '-' : '+', hours, minutes);
        }
        return "UTC%s%d".sprintf(negative ? '-' : '+', hours);
    },

    isDaylightSavingsTime: JSReadOnlyProperty(),

    getIsDaylightSavingsTime: function(){
        return this.isDaylightSavingsTimeForDate(JSDate.now);
    },

    isDaylightSavingsTimeForDate: function(date){
        if (this._fixedOffset !== null){
            return false;
        }
        var localTimeType = this._getLocalTimeTypeForDate(date);
        return localTimeType.dst;
    },

    _getTransitionIndexForDate: function(date){
        var searcher = JSBinarySearcher(this._transitionTimes, function(t_, transition){
            return t_ - transition;
        });
        var t = date.timeIntervalSince1970;
        var i = searcher.insertionIndexForValue(t);
        if (i < this._transitionTimes.length && t < this._transitionTimes[i]){
            --i;
        }
        return i;
    },

    _getLocalTimeTypeForDate: function(date){
        if (this._transitionTimes.length > 0){
            var t = date.timeIntervalSince1970;
            if (t >= this._transitionTimes[0]){
                if (t < this._transitionTimes[this._transitionTimes.length - 1]){
                    var i = this._getTransitionIndexForDate(date);
                    var localTimeType = this._localTimeTypes[this._transitionTimesToLocalTimeTypes[i]];
                    return localTimeType;
                }
                if (this._futureRules){
                    return this._getLocalTimeTypeForFutureTimestamp(t);
                }
                // Guessing if we don't have a future rule we should just the last transition availble
                return this._localTimeTypes[this._transitionTimesToLocalTimeTypes[this._transitionTimesToLocalTimeTypes.length - 1]];
            }
        }
        return this._localTimeTypes[this._defaultTimeTypeIndex];
    },

    nextDaylightSavingsTransition: JSReadOnlyProperty(),

    getNextDaylightSavingsTransition: function(){
        return this.nextDaylightSavingsTransitionAfterDate(JSDate.now);
    },

    nextDaylightSavingsTransitionAfterDate: function(date){
        if (this._fixedOffset !== null){
            return null;
        }
        if (this._transitionTimes.length > 0){
            var t = date.timeIntervalSince1970;
            if (t >= this._transitionTimes[0]){
                if (t < this._transitionTimes[this._transitionTimes.length - 1]){
                    var i = this._getTransitionIndexForDate(date) + 1;
                    return JSDate.initWithTimeIntervalSince1970(this._transitionTimes[i]);
                }
                if (this._futureRules){
                    var transition = this._nextDaylightSavingsTransitionAfterFutureTimestamp(t);
                    return JSDate.initWithTimeIntervalSince1970(transition);
                }
                return null;
            }
            return JSDate.initWithTimeIntervalSince1970(this._transitionTimes[0]);
        }
        return null;
    },

    localizedName: function(style, locale){
        // TODO:
    },

    _getDefaultTimeTypeIndex: function(){
        // The default time type is determined according to the following rules
        // 1. If no transition uses type 0, then type 0 is the default
        // 2. If the first transition is to daylight, use the closest previous standard type
        // 3. Use the first standard type
        // 4. Use 0
        var i = this._transitionTimesToLocalTimeTypes.indexOf(0);
        var localTimeType;
        if (i < 0){
            return 0;
        }
        if (this._transitionTimes.length > 0){
            i = this._transitionTimesToLocalTimeTypes[0];
            localTimeType = this._localTimeTypes[i];
            if (localTimeType.dst){
                --i;
                while (i >= 0){
                    localTimeType = this._localTimeTypes[i];
                    if (!localTimeType.dst){
                        return i;
                    }
                }
            }
        }
        for (i = 0; i < this._localTimeTypes.length; ++i){
            localTimeType = this._localTimeTypes[i];
            if (!localTimeType.dst){
                return i;
            }
        }
        return 0;
    },

    _nextDaylightSavingsTransitionAfterFutureTimestamp: function(t){
        var rules = this._futureRules;

        // No transition unless we have both standard and daylight rules
        if (!rules.standard || !rules.daylight){
            return null;
        }

        // NOTE: we're using the UTC year here, which may not be the actual local year
        // if `t` is within the timezone's offset to a year change.  But it gets us close
        // enough to ultimately get the right answer.  See more detailed notes on this in
        // _getRuleForFutureTimestamp
        var year = new Date(t * 1000).getUTCFullYear();
        var transitions = this._getTransitionsForFutureYear(year);
        var a = transitions.fromStandard;
        var b = transitions.toStandard;
        var c;

        // If a < b then the year starts with standard, goes to daylight, and ends with standard,
        // which is the typical pattern for summer daylight in the northern hemisphere
        if (a < b){
            if (t < a){
                return a;
            }
            if (t < b){
                return b;
            }
            // If we're after the final transition of the year, we need to find the first transition
            // of the next year, which when a < b is the fromStandard transition.
            transitions = this._getTransitionsForFutureYear(year + 1);
            return transitions.fromStandard;
        }

        // If a > b then the year starts with daylight, goes to standard, and ends with daylight,
        // which is the typical pattern for summer daylight in the southern hemisphere
        if (t < b){
            return b;
        }
        if (t < a){
            return a;
        }
        // If we're after the final transition of the year, we need to find the first transition
        // of the next year, which when a > b is the toStandard transition.
        transitions = this._getTransitionsForFutureYear(year + 1);
        return transitions.toStandard;
    },

    _getLocalTimeTypeForFutureTimestamp: function(t){
        // NOTE: We've made the rule struct the same as the localTimeType struct, so
        // all we need to do is return the rule
        return this._getRuleForFutureTimestamp(t);
    },

    _getTransitionForRuleInFutureYear: function(rule, year, offset){
        // NOTE: Date.UTC behaves differently for years 0-99, making turning them
        // into 1900s.  Since this function is only called for future dates, we
        // shouldn't have to worry about it here.
        // NOTE: JSGregorianCalendar.isLeapYear and .lastDayOfMonthInYear expect
        // to be passed an astronomical year, which means 0 or negative integers for BC years.
        // Since this function is only called for future date, we can assume we're always given an astronomical year.
        var t = Math.floor(Date.UTC(year, 0) / 1000);
        var days = 0;
        if (rule.day0 !== undefined){
            days = (rule.day0 + 1);
            if (days >= 60 && JSGregorianCalendar.isLeapYear(year)){
                days += 1;
            }
        }else if (rule.day1 !== undefined){
            days = rule.day1;
        }else{
            var dow0 = new Date(t * 1000).getUTCDay();
            var mdays = 0;
            for (var m = rule.month - 1; m > 0; --m){
                days += JSGregorianCalendar.lastDayOfMonthInYear(m, year);
            }
            dow0 = (dow0 + days) % 7;
            if (rule.dow < dow0){
                mdays += 7;
            }
            for (var w = 1; w < rule.week; ++w){
                mdays += 7;
            }
            mdays += rule.dow - dow0;
            while (mdays >= JSGregorianCalendar.lastDayOfMonthInYear(m, year)){
                mdays -= 7;
            }
            days += mdays;
        }
        return t + days * secondsPerDay + rule.time - offset;
    },

    _getTransitionsForFutureYear: function(year){
        var rules = this._futureRules;
        return {
            fromStandard: this._getTransitionForRuleInFutureYear(rules.fromStandard, year, rules.standard.off),
            toStandard: this._getTransitionForRuleInFutureYear(rules.toStandard, year, rules.daylight.off)
        };
    },

    _getRuleForFutureTimestamp: function(t){
        var rules = this._futureRules;
        if (!rules.daylight){
            return rules.standard;
        }
        if (!rules.standard){
            return rules.daylight;
        }

        // NOTE: we're using the UTC year here, which may not be the actual local year
        // if `t` is within the timezone's offset to a year change.
        // What happens in this case?
        // Say we're in the US Pacific and have an -8 hour offset on Dec 31, and t represents
        // 10pm on dec 31 2040.  The UTC year will be 2041.  So we query the transitions for 2041
        // and find one in March and one in November.  Even though t is in 2040 Pacific time,
        // knowing that it falls before March of 2041 is enough to get the correct answer.
        // Even a timezone that has a Midnight Jan 1 transition would be correct.  The only
        // possible problem would arise if there is a tiny window of transition both to and from
        // standard right around new years, which never happens.
        var year = new Date(t * 1000).getUTCFullYear();
        var transitions = this._getTransitionsForFutureYear(year);
        var a = transitions.fromStandard;
        var b = transitions.toStandard;

        // If the transition times are equal, then we must be in standard all year
        if (a == b){
            return rules.standard;
        }

        // If a < b then the year starts with standard, goes to daylight, and ends with standard,
        // which is the typical pattern for summer daylight in the northern hemisphere
        if (a < b){
            if (t < a){
                return rules.standard;
            }
            if (t < b){
                return rules.daylight;
            }
            return rules.standard;
        }

        // If a > b, then the year starts with daylight, goes to standard, and ends with daylight,
        // which is the typical pattern for summer daylight in the southern hemisphere
        if (t < b){
            return rules.daylight;
        }
        if (t < a){
            return rules.standard;
        }
        return rules.daylight;
    }

});

JSTimeZone.changeLocalTimeZone = function(identifer){
    localIdentifier = identifer;
    Object.defineProperty(JSTimeZone, 'local', defaultLocalProperty);
};

var defaultLocalProperty = {
    configurable: true,
    get: function JSTimeZone_getLocal(){
        var timezone = null;
        if (localIdentifier !== null){
            timezone = JSTimeZone.initWithIdentifier(localIdentifier);
        }
        Object.defineProperty(JSTimeZone, 'local', {configurable: true, value: timezone});
        return timezone;
    }
};

var defaultKnownIdentifiersProperty = {
    configurable: true,
    get: function JSTimeZone_getKnownTimeZoneIdentifiers(){
        var identifiers = Object.keys(zoneinfo.map);
        Object.defineProperty(JSTimeZone, 'knownTimeZoneIdentifiers', {value: identifiers});
        return identifiers;
    }
};

Object.defineProperties(JSTimeZone, {

    systemTimeZoneIdentifier: {
        get: function JSTimeZone_getSystemTimeZoneIdentifier(){
            // FIXME: if no identifier, try to guess based on offset?
            return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        }
    },

    local: defaultLocalProperty,

    utc: {
        configurable: true,
        get: function JSTimeZone_getUTC(){
            var timezone = JSTimeZone.initWithTimeIntervalFromUTC(0, 'UTC');
            Object.defineProperty(JSTimeZone, 'utc', {configurable: false, value: timezone});
            return timezone;
        }
    },

    knownTimeZoneIdentifiers: defaultKnownIdentifiersProperty
});

var localIdentifier = JSTimeZone.systemTimeZoneIdentifier;

var secondsPerMinute = 60;
var minutesPerHour = 60;
var secondsPerHour = secondsPerMinute * minutesPerHour;
var hoursPerDay = 24;
var secondsPerDay = secondsPerHour * hoursPerDay;

JSTimeZone.importZoneInfo = function(info){
    zoneinfo = info;
};

JSTimeZone.clearZoneInfo = function(info){
    zoneinfo = emptyZoneInfo;
    Object.defineProperty(JSTimeZone, 'knownTimeZoneIdentifiers', defaultKnownIdentifiersProperty);
    JSTimeZone.changeLocalTimeZone(JSTimeZone.systemTimeZoneIdentifier);
};

JSTimeZone.rulesFromPOSIXString = function(str){
    // std offset
    // std offset dst [offset],start[/time],end[/time]
    if (str === null || str === undefined){
        return null;
    }
    if (str.length === 0){
        return null;
    }
    var i = 0;
    var l = str.length;
    var isDigit = function(c){
        return c >= "0" && c <= "9";
    };
    var isABBR = function(c){
        if (isDigit(c)){
            return false;
        }
        if (c == "-" || c == "+"){
            return false;
        }
        if (c == ","){
            return false;
        }
        return true;
    };
    var parseABBR = function(){
        if (i >= l){
            return null;
        }
        var abbr = "";
        if (str[i] == "<"){
            ++i;
            while (i < l && str[i] != ">"){
                abbr += str[i];
                ++i;
            }
            if (i == l){
                return null;
            }
            ++i;
        }else{
            while (i < l && isABBR(str[i])){
                abbr += str[i];
                ++i;
            }
        }
        return abbr;
    };
    var parseInteger = function(){
        var digits = "";
        while (i < l && isDigit(str[i])){
            digits += str[i];
            ++i;
        }
        if (digits.length > 0){
            return parseInt(digits);
        }
        return null;
    };
    var parseOffset = function(){
        if (i >= l){
            return null;
        }
        var h = 0;
        var m = 0;
        var s = 0;
        var factor = -1;
        if (str[i] === "-"){
            factor = 1;
            ++i;
        }else if (str[i] === "+"){
            ++i;
        }
        h = parseInteger();
        if (h === null){
            return null;
        }
        if (i < l && str[i] === ":"){
            ++i;
            m = parseInteger();
            if (m === null){
                return null;
            }
            if (i < l && str[i] === ":"){
                ++i;
                s = parseInteger();
                if (s === null){
                    return null;
                }
            }
        }
        return factor * (h * 3600 + m * 60 + s);
    };
    var parseRule = function(){
        if (i >= l){
            return null;
        }
        if (str[i] !== ","){
            return null;
        }
        ++i;
        if (i >= l){
            return null;
        }
        var rule = {};
        if (str[i] == "J"){
            ++i;
            rule.day1 = parseInteger();
            if (rule.day1 === null){
                return null;
            }
        }else if (str[i] == "M"){
            ++i;
            rule.month = parseInteger();
            if (i < l && str[i] !== "."){
                return null;
            }
            ++i;
            rule.week = parseInteger();
            if (i < l && str[i] !== "."){
                return null;
            }
            ++i;
            rule.dow = parseInteger();
            if (rule.month === null || rule.week === null || rule.dow === null){
                return null;
            }
        }else{
            rule.day0 = parseInteger();
            if (rule.day0 === null){
                return null;
            }
        }
        rule.time = 7200;
        if (i < l && str[i] === "/"){
            ++i;
            rule.time = parseOffset();
            if (rule.time === null){
                return null;
            }
            rule.time = -rule.time;
        }
        return rule;
    };
    var rules = {
        standard: {
            dst: false,
            abbr: parseABBR(),
            off: parseOffset()
        }
    };
    if (rules.standard.abbr === null || rules.standard.off === null){
        return null;
    }
    if (i < l){
        rules.daylight = {
            dst: true,
            abbr: parseABBR()
        };
        if (i < l && str[i] != ","){
            rules.daylight.off = parseOffset();
        }else{
            rules.daylight.off = rules.standard.off + 3600;
        }
        if (rules.daylight.abbr === null || rules.daylight.off === null){
            return null;
        }
        rules.fromStandard = parseRule();
        rules.toStandard = parseRule();
        if (rules.fromStandard === null || rules.toStandard === null){
            return null;
        }
    }
    return rules;
};

var emptyZoneInfo = {
    zones: [],
    map: {}
};

var zoneinfo = emptyZoneInfo;

var buffer32 = new Uint32Array(2);

DataView.prototype.jskitGetInt64 = function(offset){
    // Using a Uint32Array buffer to do bitwise operations because
    // with Number, JS will default to *signed* 32-bit integer operations
    buffer32[0] = this.getUint32(offset);
    buffer32[1] = this.getUint32(offset + 4);
    if ((buffer32[0] & 0x80000000) === 0){
        // we've got a positive 64-bit number
        // JS can't shift beyond 32 bits, so we'll multiply by 2**32 instead
        return buffer32[0] * 0x100000000 + buffer32[1];
    }
    // we've got a negative 64-bit number
    // reverse the two's compliment
    buffer32[0] = ~buffer32[0];
    buffer32[1] = ~buffer32[1];
    buffer32[1] += 1;
    if (buffer32[1] === 0){
        buffer32[0] += 1;
    }
    // then return a negative version of our calculation
    return -(buffer32[0] * 0x100000000 + buffer32[1]);
};

})();