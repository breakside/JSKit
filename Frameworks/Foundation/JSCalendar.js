// #import "Foundation/JSObject.js"
// #import "Foundation/JSDate.js"
// #import "Foundation/JSTimeZone.js"
/* global JSClass, JSObject, JSCalendar, JSGregorianCalendar, JSReadOnlyProperty, JSDate, JSTimeZone */
'use strict';

(function(){

JSClass("JSCalendar", JSObject, {

    timezone: JSReadOnlyProperty('_timezone', null),

    getTimezone: function(){
        if (this._timezone !== null){
            return this._timezone;
        }
        return JSTimeZone.local;
    },

    componentsFromDate: function(units, date, timezone){
    },

    componentsBetweenDates: function(units, date1, date2){
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
        var adjustedInterval = date._timeIntervalSince1970 + offset;
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

    componentsBetweenDates: function(units, date1, date2, timezone){
        var negative = date1.compare(date2) > 0;
        if (negative){
            var temp = date1;
            date1 = date2;
            date2 = temp;
        }
        var components1 = this.componentsFromDate(JSCalendar.Unit.adjustable | JSCalendar.Unit.timezone, date1, timezone);
        var components2 = this.componentsFromDate(JSCalendar.Unit.adjustable | JSCalendar.Unit.timezone, date2, timezone);
        var diff = {
            year: 0,
            month: 0,
            day: 0,
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0,
            timezone: components1.timezone
        };
        // TODO: figure out diffs
        if (diff.year !== 0 && (units & JSCalendar.Unit.year) === 0){
            diff.month += monthsPerYear * diff.year;
            delete diff.year;
        }
        if (diff.month !== 0 && (units & JSCalendar.Unit.month) === 0){
            // FIXME: get real day count based on actual dates
            diff.day += 30 * diff.month;
            delete diff.month;
        }
        if (diff.day !== 0 && (units & JSCalendar.Unit.day) === 0){
            // FIXME: get real hour count after considering daylight savings
            diff.hour += hoursPerDay * diff.day;
            delete diff.day;
        }
        if (diff.hour !== 0 && (units & JSCalendar.Unit.hour) === 0){
            diff.minute += minutesPerHour * diff.hour;
            delete diff.hour;
        }
        if (diff.minute !== 0 && (units & JSCalendar.Unit.minute) === 0){
            diff.second += secondsPerMinute * diff.minute;
            delete diff.minute;
        }
        if (diff.second !== 0 && (units & JSCalendar.Unit.second) === 0){
            diff.millisecond += diff.second * 1000;
            delete diff.second;
        }
        if (diff.millisecond !== 0 && (units & JSCalendar.Unit.millisecond) === 0){
            delete diff.millisecond;
        }
        if (negative){
            for (var name in diff){
                diff[name] = -diff[name];
            }
        }
        return diff;
    },

    dateFromComponents: function(components){
        var era = components.era !== undefined ? components.era : 1;
        var year = components.year || 0;
        var month = components.month || 1;
        var day = components.day || 1;
        var hour = components.hour || 0;
        var minute = components.minute || 0;
        var second = components.second || 0;
        var millisecond = components.millisecond || 0;

        // Adjust year to astronomical year if needed for BC dates
        var astronomicalYear = year;
        if (components.era === 0){
            astronomicalYear = -year + 1;
        }

        // 1. First we'll create a UTC date, which gets us close, but not quite there if our
        //    timezone has an offset from UTC.
        var millisecondsSince1970 = Date.UTC(astronomicalYear, month, day, hour, minute, second, millisecond);
        var utcDate = JSDate.initWithTimeIntervalSince1970(millisecondsSince1970 / 1000);

        // 2. Next, we'll adjust the date according to our timezone offset.  But, the adjustment
        //    may cross a daylight savings transition, which means the offset wasn't quite correct.
        //    So we'll try again.

        var timezone = components.timezone || this.timezone;
        var offset = timezone.timeIntervalFromUTCForDate(utcDate);
        var date = utcDate;
        if (offset !== 0){
            // Lets say our components are for 3am PST on a "fall back" day and our UTC offset just
            // changed from -7h to -8h.  That means 3am should really be 11am UTC time.
            // We create date0 with the 3am component, but that's 3am in the UTC timezone, which in
            // actuality corresponds to 8pm PDT on the previous day (-7h).
            // So when we ask the timezone for its offset at that point in time, it tells us that
            // the offset is -7h.  We add 7h to date0 and now have 10am UTC, which isn't quite right.
            // But now if we ask for the offset again using the new date, we'll be told -8h.
            //
            // What about if we ask for 1am on a "fall back"?  There are actually two of those, so
            // which one will we get?
            // 1am UTC goes -7 to 6pm PDT on the previous day.  Offset then is -7h, so we add 7 in UTC
            // land and get 8am UTC.  Asking for the offset again at 8am UTC still tells us -7h, so
            // that's where we'll leave things, at 8am UTC, which is the first 1am (1am PDT rather than 1am PST)
            //
            // How about the other direction, on a "spring forward" day from PST to PDT?
            // Lets say our components are for 4am PDT.  date0 is 4am UTC, which translates
            // to 8pm PST.  We are told the offset is -8, so we add 8 hours to 4am UTC and
            // get 12pm UTC.  Asking again for the offset, we're now told -7h, so we add
            // 7 to 4am UTC and get 11am UTC, which corresponds with 4am PDT.
            //
            // What if we ask for 2am on a spring forward day?  It doesn't exist, so what do we
            // end up with?  2am UTC corresponds to 6pm PST the previous day.  We're told the offset
            // is -8h, so we add 8 to 2am UTC and get 10am UTC.  We ask for the offset there and are
            // told -7h, so we add 7 to 2am and get 9am UTC, which corresponds to 1am PST.  WRONG!
            // If we keep asking, we'll be told -7 and -8 alternating.  So if we see some ping
            // ponging of offsets, we'll pick the first one.
            date = utcDate.addingTimeInterval(-offset);
            var nextTransitionDate;
            if (offset < 0){
                nextTransitionDate = timezone.nextDaylightSavingsTransitionFromDate(utcDate);
                if (date.compare(nextTransitionDate) > 0){
                    offset = timezone.timeIntervalFromUTCForDate(nextTransitionDate);
                    date = utcDate.addingTimeInterval(-offset);
                }
            }else{
                nextTransitionDate = timezone.nextDaylightSavingsTransitionFromDate(date);
                if (utcDate.compare(nextTransitionDate) > 0){
                    offset = timezone.timeIntervalFromUTCForDate(nexttr)
                }
            }

            date = date0.addingTimeInterval(-offset1);
            var offset2 = timezone.timeIntervalFromUTCForDate(date);
            if (offset1 != offset2){
                date = date0.addingTimeInterval(-offset2);
                var offset3 = timezone.timeIntervalFromUTCForDate(date);
                if (offset3 != offset2){
                    date = date0.addingTimeInterval(-offset3);
                }
            }
        }
        return date;
    },

    dateByAddingComponents: function(addedComponents, toDate){
        var addedYears = addedComponents.year || 0;
        var addedMonths = addedComponents.month || 0;
        var addedDays = addedComponents.days || 0;

        var baseDate = toDate;
        if (addedYears !== 0 || addedMonths !== 0 || addedDays !== 0){
            // If we're adding years, months, or days, we need to work with the components in the
            // requested timezone because of special transformations done to the year and month components at edges.
            var components = this.componentsFromDate(JSCalendar.Unit.adjustable, toDate, addedComponents.timezone);

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
            components.month += addedMonths;
            var lastDayOfMonth = JSGregorianCalendar.lastDayOfMonthInYear(components.month, components.year);
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
            (addedComponents.millisecond || 0) + secondsPerMillisecond;
        return baseDate.addingTimeInterval(timezoneIndifferentTimeInterval);
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
    return (year % 4) === 0 && ((year % 100) !== 0 || (year % 1000) === 0);
};

Object.defineProperties(JSCalendar, {
    gregorian: {
        configurable: true,
        get: function JSCalendar_getGregorian(){
            var gregorian = JSGregorianCalendar.init();
            Object.defineProperty(JSCalendar, 'gregorian', {value: gregorian});
            return gregorian;
        }
    }
});

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
    all:            0xFF
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


var monthsPerYear = 12;
var minutesPerHour = 60;
var hoursPerDay = 24;
var secondsPerMillisecond = 1 / 1000;
var secondsPerMinute = 60;
var secondsPerHour = secondsPerMinute * minutesPerHour;

})();