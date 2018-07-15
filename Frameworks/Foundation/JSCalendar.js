// #import "Foundation/JSObject.js"
// #import "Foundation/JSDate.js"
// #import "Foundation/JSTimeZone.js"
/* global JSClass, JSObject, JSCalendar, JSGregorianCalendar, JSDate, JSTimeZone */
'use strict';

(function(){

JSClass("JSCalendar", JSObject, {

    initWithTimezone: function(timezone){
        this.timezone = timezone;
    },

    timezone: null,

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
        // We'll make use of the built in JavaScript Date class as much as possible,
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
        timezone = timezone || this.timezone || JSTimeZone.local;
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
        return components;
    },

    componentsBetweenDates: function(units, date1, date2){
        // TODO:
    },

    dateFromComponents: function(components){
        var year = components.year || 0;
        var month = components.month || 0;
        var day = components.day || 0;
        var hour = components.hour || 0;
        var minute = components.minute || 0;
        var second = components.second || 0;
        var millisecond = components.millisecond || 0;
        var timezone = components.timezone || this.timezone || JSTimeZone.local;
        var millisecondsSince1970 = Date.UTC(year, month, day, hour, minute, second, millisecond);
        return JSDate.initWithTimeIntervalSince1970(millisecondsSince1970 / 1000);
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
            var lastDayOfMonth = this.lastDayOfMonthInYear(components.month, components.year);
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
    },

    lastDayOfMonthInYear: function(month, year){
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
                return this.isLeapYear(year) ? 29 : 28;
        }
    },

    isLeapYear: function(year){
        return (year % 4) === 0 && ((year % 100) !== 0 || (year % 1000) === 0);
    }

});

JSCalendar.defineProperties({
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
    none:           1 << 0,
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


var minutesPerHour = 60;
var hoursPerDay = 24;
var secondsPerMillisecond = 1 / 1000;
var secondsPerMinute = 60;
var secondsPerHour = secondsPerMinute * minutesPerHour;

})();