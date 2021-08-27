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
// #import "JSTimeZone.js"
// #import "JSTimeInterval.js"
'use strict';

(function(){

JSClass("JSCalendar", JSObject, {

    initWithIdentifier: function(identifier){
        switch (identifier){
            case JSCalendar.Identifier.gregorian:
                return JSCalendar.gregorian;
        }
        return null;
    },

    timezone: JSDynamicProperty('_timezone', null),

    getTimezone: function(){
        if (this._timezone !== null){
            return this._timezone;
        }
        return JSTimeZone.local;
    },

    componentsFromDate: function(units, date, timezone){
    },

    componentsBetweenDates: function(units, date1, date2, timezone){
    },

    dateFromComponents: function(components){
    },

    dateByAddingComponents: function(addedComponents, toDate){
    }

});

JSClass("JSGregorianCalendar", JSCalendar, {

    componentsFromDate: function(units, date, timezone){
        // We'll make use of the built in JavaScript Date class as much as possible
        // since it returns the gregorian components.
        // However, it can only deal in the local timezone or the UTC timezone.
        // We'll work in UTC as much as possible, since that's what our JSDate
        // time intervals represent (seconds since Jan 1 1970 UTC).
        // 1. In order to adjust for the requested timezone, we'll adjust our
        //    timestamp by the offset that the timezone itself reports for the
        //    given date.  This will ensure that when we request UTC components,
        //    we'll get numbers that line up with the requested timezone.
        // 2. Then we'll create a JavaScript Date object from that adjusted
        //    timestamp.  Like all JS Dates, its typical functions will report
        //    components in the local timezone, so we don't want to use those.
        // 3. We'll use the getUTC variants, which will return exactly what we
        //    want for the target timezone.
        timezone = timezone || this.timezone;
        var offset = timezone.timeIntervalFromUTCForDate(date);
        var adjustedInterval = date.timeIntervalSince1970 + offset;
        var components = {};
        var nativeDate = new Date(adjustedInterval * 1000);

        // Since we're supporting eras, our year isn't exactly what the native Date
        // object reports.  It basically reports an "astronomical year", which doesn't
        // account for eras, and goes into negatives for BC years.  But because of the
        // jump from 1 BC to 1 CE, the translation is not as simple as taking the
        // absolute value of the astronomical year.
        // - All CE years match the astronomical year
        // - 1 BC = 0 astro
        // - 2 BC = -1 astro
        // - 3 BC = -2 astro
        // ... and so on
        // bcYear = -astroYear + 1 => astroYear = -bcYear + 1
        var astronomicalYear = nativeDate.getUTCFullYear();
        if (units & JSCalendar.Unit.era){
            if (astronomicalYear <= 0){
                components.era = 0;
            }else{
                components.era = 1;
            }
        }
        if (units & JSCalendar.Unit.year){
            if (astronomicalYear <= 0){
                components.year = -astronomicalYear + 1;
            }else{
                components.year = astronomicalYear;
            }
        }

        // Months in JavaScript are from 0-11.  We want 1-12, so add 1.
        if (units & JSCalendar.Unit.month){
            components.month = nativeDate.getUTCMonth() + 1;
        }
        if (units & JSCalendar.Unit.day){
            components.day = nativeDate.getUTCDate();
        }
        if (units & JSCalendar.Unit.hour){
            components.hour = nativeDate.getUTCHours();
        }
        if (units & JSCalendar.Unit.minute){
            components.minute = nativeDate.getUTCMinutes();
        }
        if (units & JSCalendar.Unit.second){
            components.second = nativeDate.getUTCSeconds();
        }
        if (units & JSCalendar.Unit.millisecond){
            components.millisecond = nativeDate.getUTCMilliseconds();
        }
        // Weekdays in JavaScript are from 0-6.  We want 1-7, so add 1.
        if (units & JSCalendar.Unit.weekday){
            components.weekday = nativeDate.getUTCDay() + 1;
        }
        if (units & JSCalendar.Unit.timezone){
            components.timezone = timezone;
        }
        if (units & JSCalendar.Unit.calendar){
            components.calendar = this;
        }
        return components;
    },

    dateFromComponents: function(components){
        var era = components.era !== undefined ? components.era : 1;
        var year = components.year !== undefined ? components.year : 1;
        var month = components.month !== undefined ? components.month : 1;
        var day = components.day !== undefined ? components.day : 1;
        var hour = components.hour !== undefined ? components.hour : 0;
        var minute = components.minute !== undefined ? components.minute : 0;
        var second = components.second !== undefined ? components.second : 0;
        var millisecond = components.millisecond !== undefined ? components.millisecond : 0;

        // Adjust year to astronomical year if needed for BC dates
        var astronomicalYear = year;
        if (components.era === 0){
            astronomicalYear = -year + 1;
        }

        // 1. First we'll create a UTC date, which gets us close, but not quite there if our
        //    timezone has an offset from UTC.
        var millisecondsSince1970 = Date.UTC(astronomicalYear, month - 1, day, hour, minute, second, millisecond);
        // Javascript thinks that years between 0 and 99 are for the 1900s, so if that's what we have,
        // we need to do a little more work to correct the timestamp
        if (astronomicalYear >= 0 && astronomicalYear <= 99){
            var d = new Date(millisecondsSince1970);
            d.setUTCFullYear(astronomicalYear);
            millisecondsSince1970 = d.getTime();   
        }
        var date = JSDate.initWithTimeIntervalSince1970(millisecondsSince1970 / 1000);

        // 2. Next, we'll adjust the date according to our timezone offset.  But, the adjustment
        //    may cross a daylight savings transition, which means the offset wasn't quite correct.
        //    So we'll try again.
        var timezone = components.timezone || this.timezone;
        var offset = timezone.timeIntervalFromUTCForDate(date);
        var cutoff;
        if (offset < 0){
            // A negative offset means the UTC date we created is behind the
            // true UTC date we're looking for, and adding the offset may
            // take us across a time change boundary.
            var next = timezone.nextDaylightSavingsTransitionAfterDate(date);
            if (next !== null){
                var nextOffset = timezone.timeIntervalFromUTCForDate(next);
                if (nextOffset > offset){
                    // The next transition is a spring forward
                    cutoff = next.addingTimeInterval(nextOffset);
                }else{
                    // The next transition is a fall back
                    cutoff = next.addingTimeInterval(offset);
                }
                if (date.compare(cutoff) < 0){
                    // If we haven't made it past the cutoff, then just use
                    // the original offset we queried
                    date = date.addingTimeInterval(-offset);
                }else{
                    // If we are at or past the cutoff, then we are after
                    // the next time change boundary, and should use its offset instead
                    date = date.addingTimeInterval(-nextOffset);
                }
            }else{
                // If there is no next time change boundary, we can only use the offset we have
                date = date.addingTimeInterval(-offset);
            }
        }else if (offset > 0){
            // A positive offset means the UTC date we created is ahead of the
            // true UTC date we're looking for, and subtracting the offset may
            // take us across a time change boundary.  We'll look for a nearby
            // previous boundary by asking for the next boundary after a day ago.
            // If that next boundary isn't before our date, then we're not close
            // enough to a time change to matter.
            var dayAgo = date.addingTimeInterval(-secondsPerHour * 24);
            var prev = timezone.nextDaylightSavingsTransitionAfterDate(dayAgo);
            if (prev !== null && prev.compare(date) <= 0){
                var prevOffset = timezone.timeIntervalFromUTCForDate(dayAgo);
                if (prevOffset < offset){
                    // The previous transition was a spring forward
                    cutoff = prev.addingTimeInterval(offset);
                }else{
                    // The previous transition was a fall back
                    cutoff = prev.addingTimeInterval(prevOffset);
                }
                if (date.compare(cutoff) < 0){
                    // If we haven't made it past the cutoff, then use the previous offset
                    date = date.addingTimeInterval(-prevOffset);
                }else{
                    // If we are at or past the cutoff, use or offset
                    date = date.addingTimeInterval(-offset);
                }
            }else{
                // If there is no previous time change boundary, or if the previous
                // boundary is more than a day ago, use the offset we have.
                date = date.addingTimeInterval(-offset);
            }
        }
        return date;
    },

    dateByAddingComponents: function(addedComponents, toDate){
        var addedYears = addedComponents.year || 0;
        var addedMonths = addedComponents.month || 0;
        var addedDays = addedComponents.day || 0;

        var baseDate = toDate;
        if (addedYears !== 0 || addedMonths !== 0 || addedDays !== 0){
            // If we're adding years, months, or days, we need to work with the components in the
            // requested timezone because of special transformations done to the year and month components at edges.
            var components = this.componentsFromDate(JSCalendar.Unit.adjustable | JSCalendar.Unit.timezone, toDate, addedComponents.timezone);

            // Note: adding eras is not supported because such an operation isn't well defined for the gregorian calendar.
            // If we have a date of 5 BC and add 1 to the era, should it be 5 CE?  Doesn't seem to make much sense as a
            // practical matter.

            // Adding Years: For the gregorian calendar, we need to consider the era we're dealing
            // in order to know the proper way to add years.
            // - 5 BC + 1 should go to 4 BC
            // - 4 BC + 4 should go to 1 CE
            var astronomicalYear;
            if (components.era === 0){
                astronomicalYear = -components.year + 1;
            }else{
                astronomicalYear = components.year;
            }
            astronomicalYear += addedYears;
            if (astronomicalYear <= 0){
                components.era = 0;
                components.year = -astronomicalYear + 1;
            }else{
                components.era = 1;
                components.year = astronomicalYear;
            }

            // Adding Months: If adding a month causes the day value to be after
            // the end of the month for our year, we need to back up the last day
            // of the month we landed at.
            // NOTE: This consideration is why it's critical to use the user's
            // requested timezone for the calculation.  If we, say, converted to
            // and from UTC to avoid timezone issues, what looks like Jan 31 in our
            // timezone may be Feb 1 in UTC, and after adding a month we wouldn't
            // catch this end of month issue.
            // NOTE: This end of month adjustment happens regardless of how may extra
            // days we're adding via addedComponents.day.  Say we wanted to add
            // 1 month and 1 day from Jan 31.  The natural interpretation is to end up
            // with March 1 (+1 month = last day of Feb, +1 day = first day of March).
            components.month += addedMonths;
            var lastDayOfMonth = JSGregorianCalendar.lastDayOfMonthInYear(components.month, astronomicalYear);
            if (components.day > lastDayOfMonth){
                components.day = lastDayOfMonth;
            }

            components.day += addedDays;

            // Adding hours, minutes, seconds, milliseconds: We need to watch out
            // for daylight savings transformations.
            // - Adding 1 hr to 1:59am on a "spring forward" day should result in 3:49
            // - Adding 1 hr to 1:59am on a "fall back" day should result in 1:59 still
            // This is easiest to achieve if we get a unix timestamp now and then simply
            // add the calculated number of total seconds accounting for each component.
            // NOTE: this does not account for leap seconds, but neither do any of the
            // standard JavaScript Date functions.
            // NOTE: we're careful not to adjust the base date from the toDate we were given
            // unless we have to.  Consider the scenario where it's 1:59am on a "fall back"
            // day and we add 1 hr to get 1:59 again.  If we call this function on the new
            // date and add 1 hr again, we should now get 2:59, which is truly an hour after
            // the second 1:59.  Had we instead re-parsed the base date from unchanged components,
            // we would have gotten back an ambiguous 1:59, and a subsequent addition could
            // just give us 1:59 again forever.
            baseDate = this.dateFromComponents(components);
        }
        var timezoneIndifferentTimeInterval = 
            (addedComponents.hour || 0) * secondsPerHour +
            (addedComponents.minute || 0) * secondsPerMinute +
            (addedComponents.second || 0) +
            (addedComponents.millisecond || 0) * secondsPerMillisecond;
        return baseDate.addingTimeInterval(timezoneIndifferentTimeInterval);
    },

    componentsBetweenDates: function(units, date1, date2, timezone){
        timezone = timezone || this.timezone;
        var diff = {
            year: 0,
            month: 0,
            day: 0,
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0,
            calendar: this,
            timezone: timezone
        };
        var compare = date1.compare(date2) > 0;
        var negative = compare > 0;
        if (compare !== 0){
            // Swap things around so date1 is always less that date2
            // Remember if we sapped so we can add negative signs to the final result
            if (negative){
                var temp = date1;
                date1 = date2;
                date2 = temp;
            }
            var components1 = this.componentsFromDate(JSCalendar.Unit.adjustable | JSCalendar.Unit.timezone, date1, timezone);
            var components2 = this.componentsFromDate(JSCalendar.Unit.adjustable | JSCalendar.Unit.timezone, date2, timezone);

            var astronomicalYear1;
            var astronomicalYear2;
            var y, m;
            if (components1.era === 0){
                astronomicalYear1 = -components1.year + 1;
            }else{
                astronomicalYear1 = components1.year;
            }
            if (components2.era === 0){
                astronomicalYear2 = -components2.year + 1;
            }else{
                astronomicalYear2 = components2.year;
            }

            // First lets collect years, months, down-filling to days
            // if years and/or months are not requested.
            diff.year = astronomicalYear2 - astronomicalYear1;
            if (components2.month < components1.month){
                // NOTE: with the way we swap date1 and date2 so date1 is always < date2,
                // if components2.month is < components1.month, then we must have at least
                // one year between them, so doing a -1 keeps diff.year >= 0
                diff.year -= 1;
                diff.month = 12 - (components1.month - components2.month);
            }else{
                diff.month = components2.month - components1.month;
            }
            if (diff.year > 0 && (units & JSCalendar.Unit.year) === 0){
                // no year requested.  Down-fill to months or days
                if ((units & JSCalendar.Unit.month) !== 0){
                    // easy to down-fill into months if the user has requested those
                    diff.month += diff.year * 12;
                }else{
                    // down-fill actual count of days whether the user want them or not
                    // (we'll further down-convert later if needed)
                    for (y = astronomicalYear1; y < astronomicalYear2; ++y){
                        diff.day += JSGregorianCalendar.isLeapYear(components1.month < 3 ? y : y + 1) ? 366 : 365;
                    }
                }
                diff.year = 0;
            }

            if (components2.day < components1.day){
                if (diff.month === 0){
                    diff.month = 12;
                    diff.year -= 1;
                }
                diff.month -= 1;
                var daysInMonth;
                if (components2.month > 1){
                    daysInMonth = JSGregorianCalendar.lastDayOfMonthInYear(components2.month - 1, astronomicalYear2);
                }else{
                    daysInMonth = JSGregorianCalendar.lastDayOfMonthInYear(12, astronomicalYear2 - 1);
                }
                diff.day += daysInMonth - (Math.min(daysInMonth, components1.day) - components2.day);
            }else{
                diff.day += components2.day - components1.day;
            }
            if (diff.month > 0 && (units & JSCalendar.Unit.month) === 0){
                // If the user didn't request months, down-fill to days.  Since years have already
                // been down-filled if needed, we only need to worry about the remaining < 12 months
                // Count days from month1 to month2, crossing astronomicalYear2 boundary if needed 
                m = components1.month;
                diff.day = -components1.day;
                if (components2.month <= components1.month){
                    for (; m <= 12; ++m){
                        diff.day += JSGregorianCalendar.lastDayOfMonthInYear(m, astronomicalYear2 - 1);
                    }
                    m = 1;
                }
                for (; m < components2.month; ++m){
                    diff.day += JSGregorianCalendar.lastDayOfMonthInYear(m, astronomicalYear2);
                }
                diff.day += components2.day;
                diff.month = 0;
            }

            // Thing can get tricky around daylight saving time changes
            // Our goals:
            // 1) Return values that work in the inverse with .dateByAddingComponents
            // 2) Return values that seem natural and sensical to a human
            // 3) For situations where 1d != 24h, return the exact hours if days are not requested and are down-filled to hours
            // 2018,3,11,6 - 2018,3,10,5 = 1d+1h/24h
            // 2018,3,11,5 - 2018,3,10,5 = 1d/23h
            // 2018,3,11,4 - 2018,3,10,5 = 22h
            // 2018,3,11,3 - 2018,3,10,3 = 1d/23h
            // 2018,3,11,3 - 2018,3,10,2 = 1d+1h/24h
            // 2018,3,11,1 - 2018,3,10,1 = 1d/24h
            // 2018,11,4,6 - 2018,11,3,5 = 1d+1h/26h
            // 2018,11,4,5 - 2018,11,3,5 = 1d/25h
            // 2018,11,4,4 - 2018,11,3,5 = 24hr
            // 2018,11,4,2 - 2018,11,3,2 = 1d/25h
            // 2018,11,4,1 - 2018,11,3,1 = 1d?/25h *second 1am
            // 2018,11,4,1 - 2018,11,3,1 = 1d/24h

            // We've taken care of years and months, now we can fill in the rest of
            // the components, but we'll need to be careful about daylight saving transition
            if (components2.hour < components1.hour){
                diff.day -= 1;
            }

            var date3 = this.dateByAddingComponents({year: diff.year, month: diff.month, day: diff.day}, date1);
            var running = Math.round((date2.timeIntervalSince1970 - date3.timeIntervalSince1970) * 1000);
            diff.millisecond = running % 1000;
            running = (running - diff.millisecond) / 1000;
            diff.second = running % 60;
            running = (running - diff.second) / 60;
            diff.minute = running % 60;
            running = (running - diff.minute) / 60;
            diff.hour = running;
            var seconds;
            // Now we can down- or up-fill as needed
            if (diff.day > 0 && (units & JSCalendar.Unit.day) === 0){
                if (units & (JSCalendar.Unit.hour | JSCalendar.Unit.minute | JSCalendar.Unit.second | JSCalendar.Unit.millisecond)){
                    // If we have something below, down-fill to hours by recalulating the number of hours/minutes/seconds/ms
                    // based on the number of seconds remaining between the two dates after accouting for years/momths
                    date3 = this.dateByAddingComponents({year: diff.year, month: diff.month}, date1);
                    running = Math.round((date2.timeIntervalSince1970 - date3.timeIntervalSince1970) * 1000);
                    diff.millisecond = running % 1000;
                    running = (running - diff.millisecond) / 1000;
                    diff.second = running % 60;
                    running = (running - diff.second) / 60;
                    diff.minute = running % 60;
                    running = (running - diff.minute) / 60;
                    diff.hour = running;
                }else if (units & JSCalendar.Unit.month){
                    // fill up to months...we'll do a rounding approximation based on a 30 day month
                    seconds = diff.hour * secondsPerHour + diff.minute * secondsPerMinute + diff.second + diff.millisecond * millisecondsPerSecond;
                    if (seconds >= secondsPerHour * 12){
                        diff.day += 1;
                    }
                    if (units.day >= 15){
                        diff.month += 1;
                    }
                }else if (units & JSCalendar.Unit.year){
                    // fill up to years...we'll do a rounding approximation based on a 365 day year
                    seconds = diff.hour * secondsPerHour + diff.minute * secondsPerMinute + diff.second + diff.millisecond * millisecondsPerSecond;
                    if (seconds >= secondsPerHour * 12){
                        diff.day += 1;
                    }
                    if (units.day > 182){
                        diff.year += 1;
                    }
                }
                // else, no units are set and it doesn't matter what we do because nothing will be returned
            }

            if (diff.hour > 0 && (units & JSCalendar.Unit.hour) === 0){
                if (units & (JSCalendar.Unit.minute | JSCalendar.Unit.second | JSCalendar.Unit.millisecond)){
                    // if we have something below, down-fill to minutes
                    diff.minute += diff.hour * minutesPerHour;
                }else if (units & JSCalendar.Unit.day){
                    // If we can up-fill to days, do a rounding approximation
                    seconds = diff.hour * secondsPerHour + diff.minute * secondsPerMinute + diff.second + diff.millisecond * millisecondsPerSecond;
                    if (seconds >= secondsPerHour * 12){
                        diff.day += 1;
                    }
                }
                // else, we have already taken care of the case where there is no day unit requested
            }

            if (diff.minute > 0 && (units & JSCalendar.Unit.minute) === 0){
                if (units & (JSCalendar.Unit.second | JSCalendar.Unit.millisecond)){
                    // if we have something below, down-fill to minutes
                    diff.second += diff.minute * secondsPerMinute;
                }else if (units & JSCalendar.Unit.hour){
                    // If we can up-fill to hours, do a rounding approximation
                    seconds = diff.minute * secondsPerMinute + diff.second + diff.millisecond * millisecondsPerSecond;
                    if (seconds >= secondsPerHour / 2){
                        diff.hour += 1;
                    }
                }
                // else, we have already taken care of the case where there is no hour unit requested
            }

            if (diff.second > 0 && (units & JSCalendar.Unit.second) === 0){
                if (units & JSCalendar.Unit.millisecond){
                    // if we have something below, down-fill to milliseconds
                    diff.millisecond += diff.second * millisecondsPerSecond;
                }else if (units & JSCalendar.Unit.minute){
                    // If we can up-fill to minutes, do a rounding approximation
                    seconds = diff.second + diff.millisecond * millisecondsPerSecond;
                    if (seconds >= secondsPerMinute / 2){
                        diff.minute += 1;
                    }
                }
                // else, we have already taken care of the case where there is no minute unit requested
            }

            if (diff.millisecond > 0 && (units & JSCalendar.Unit.millisecond) === 0){
                if (units & JSCalendar.Unit.second){
                    // If we can up-fill to seconds, do a rounding approximation
                    if (diff.millisecond >= millisecondsPerSecond / 2){
                        diff.second += 1;
                    }
                }
                // else, we have already taken care of the case where there is no second unit requested
            }

        }

        
        // Remove components that weren't requested
        if ((units & JSCalendar.Unit.year) === 0){
            delete diff.year;
        }
        if ((units & JSCalendar.Unit.month) === 0){
            delete diff.month;
        }
        if ((units & JSCalendar.Unit.day) === 0){
            delete diff.day;
        }
        if ((units & JSCalendar.Unit.hour) === 0){
            delete diff.hour;
        }
        if ((units & JSCalendar.Unit.minute) === 0){
            delete diff.minute;
        }
        if ((units & JSCalendar.Unit.second) === 0){
            delete diff.second;
        }
        if ((units & JSCalendar.Unit.millisecond) === 0){
            delete diff.millisecond;
        }
        if ((units & JSCalendar.Unit.timezone) === 0){
            delete diff.timezone;
        }
        if ((units & JSCalendar.Unit.calendar) === 0){
            delete diff.calendar;
        }
        if (negative){
            for (var name in diff){
                if (diff[name] !== 0){
                    diff[name] = -diff[name];
                }
            }
        }
        return diff;
    },

    componentsFromISO8601String: function(string){
        if (string === null || string === undefined){
            return null;
        }
        var matches = string.match(/^(?<year>\d\d\d\d)-(?<month>\d\d)-(?<day>\d\d)T(?<hour>\d\d):(?<minute>\d\d):(?<second>\d\d)(\.(?<ms>\d\d\d))?(?<tz>.+)$/);
        if (!matches){
            return null;
        }
        var components = {
            year: parseInt(matches.groups.year),
            month: parseInt(matches.groups.month),
            day: parseInt(matches.groups.day),
            hour: parseInt(matches.groups.hour),
            minute: parseInt(matches.groups.minute),
            second: parseInt(matches.groups.second),
        };
        if (matches.groups.ms){
            components.millisecond = parseInt(matches.groups.ms);
        }
        var tz = matches.groups.tz;
        if (tz === "Z"){
            components.timezone = JSTimeZone.utc;
        }else{
            matches = tz.match(/^\+(\d\d)$/);
            if (matches !== null){
                components.timezone = JSTimeZone.initWithTimeIntervalFromUTC(JSTimeInterval.hours(matches[1]));
            }else{
                matches = tz.match(/^\-(\d\d)$/);
                if (matches !== null){
                    components.timezone = JSTimeZone.initWithTimeIntervalFromUTC(-JSTimeInterval.hours(matches[1]));
                }else{
                    matches = tz.match(/^\+(\d\d)\:?(\d\d)$/);
                    if (matches !== null){
                        components.timezone = JSTimeZone.initWithTimeIntervalFromUTC(JSTimeInterval.hours(matches[1]) + JSTimeInterval.minutes(matches[2]));
                    }else{
                        matches = tz.match(/^\-(\d\d)\:?(\d\d)$/);
                        if (matches !== null){
                            components.timezone = JSTimeZone.initWithTimeIntervalFromUTC(-JSTimeInterval.hours(matches[1]) - JSTimeInterval.minutes(matches[2]));
                        }else{
                            return null;
                        }
                    }
                }
            }
        }
        return components;
    },

    dateFromISO8601String: function(string){
        var components = this.componentsFromISO8601String(string);
        if (components === null){
            return null;
        }
        return this.dateFromComponents(components);
    }

});

JSGregorianCalendar.lastDayOfMonthInYear = function(month, year){
    switch (month){
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            return 31;
        case 4:
        case 6:
        case 9:
        case 11:
            return 30;
        case 2:
            return JSGregorianCalendar.isLeapYear(year) ? 29 : 28;
    }
};

JSGregorianCalendar.isLeapYear = function(year){
    // - Every year that is exactly divisible by four is a leap year
    // - except for years that are exactly divisible by 100
    // - but these centurial years are leap years if they are exactly divisible by 400.
    // - For example, the years 1700, 1800, and 1900 are not leap years, but the year 2000 is.
    return (year % 4) === 0 && ((year % 100) !== 0 || (year % 400) === 0);
};

Object.defineProperties(JSCalendar, {
    gregorian: {
        configurable: true,
        get: function JSCalendar_getGregorian(){
            return JSGregorianCalendar.init();
        }
    }
});

JSCalendar.Identifier = {
    gregorian: 'gregorian',
};

JSCalendar.Unit = {
    none:           0,
    calendar:       1 << 0,
    era:            1 << 1,
    year:           1 << 2,
    month:          1 << 3,
    day:            1 << 4,
    hour:           1 << 5,
    minute:         1 << 6,
    second:         1 << 7,
    millisecond:    1 << 8,
    weekday:        1 << 9,
    timezone:       1 << 10,
    all:            0xFFFFFFFF
};

JSCalendar.Unit.adjustable =
    JSCalendar.Unit.era |
    JSCalendar.Unit.year |
    JSCalendar.Unit.month |
    JSCalendar.Unit.day |
    JSCalendar.Unit.hour |
    JSCalendar.Unit.minute |
    JSCalendar.Unit.second |
    JSCalendar.Unit.millisecond;

JSCalendar.Unit.difference =
    JSCalendar.Unit.year |
    JSCalendar.Unit.month |
    JSCalendar.Unit.day |
    JSCalendar.Unit.hour |
    JSCalendar.Unit.minute |
    JSCalendar.Unit.second |
    JSCalendar.Unit.millisecond;


var monthsPerYear = 12;
var minutesPerHour = 60;
var hoursPerDay = 24;
var millisecondsPerSecond = 1000;
var secondsPerMillisecond = 1 / millisecondsPerSecond;
var secondsPerMinute = 60;
var secondsPerHour = secondsPerMinute * minutesPerHour;

})();