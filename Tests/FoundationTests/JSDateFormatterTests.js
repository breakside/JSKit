// #import Foundation
// #import TestKit
'use strict';

(function(){

JSClass("JSDateFormatterTests", TKTestSuite, {

    setup: function(){
        this.originalPreferredLanguages = JSLocale.preferredLanguages;
        JSLocale.preferredLanguages = ['en-US'];
        JSTimeZone.importZoneInfo(zoneinfo);
        JSTimeZone.changeLocalTimeZone("America/Los_Angeles");
    },

    teardown: function(){
        JSTimeZone.clearZoneInfo();
        JSLocale.preferredLanguages = this.originalPreferredLanguages;
    },

    testInit: function(){
        var formatter = JSDateFormatter.init();
        TKAssertObjectEquals(formatter.locale, JSLocale.current);
    },

    testInitWithLocale: function(){
        var locale = JSLocale.initWithIdentifier('de-DE');
        var formatter = JSDateFormatter.initWithLocale(locale);
        TKAssertObjectEquals(formatter.locale, locale);
    },

    testEraSymbols: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        var date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        formatter.dateFormat = "G GG GGG GGGG GGGGG";
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "AD AD AD Anno Domini A");

        date = cal.dateFromComponents({era: 0, year: 350, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "BC BC BC Before Christ B");
    },

    testYear: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        var date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        formatter.dateFormat = "y yy yyy yyyy yyyyy yyyyyy";
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2018 18 2018 2018 02018 002018");

        date = cal.dateFromComponents({era: 0, year: 350, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "350 50 350 0350 00350 000350");

        date = cal.dateFromComponents({era: 1, year: 5, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "5 05 005 0005 00005 000005");
    },

    testMonth: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "M MM MMM MMMM MMMMM";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "1 01 Jan January J");

        date = cal.dateFromComponents({year: 2018, month: 2, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2 02 Feb February F");

        date = cal.dateFromComponents({year: 2018, month: 3, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03 Mar March M");

        date = cal.dateFromComponents({year: 2018, month: 4, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 04 Apr April A");

        date = cal.dateFromComponents({year: 2018, month: 5, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "5 05 May May M");

        date = cal.dateFromComponents({year: 2018, month: 6, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06 Jun June J");

        date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "7 07 Jul July J");

        date = cal.dateFromComponents({year: 2018, month: 8, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "8 08 Aug August A");

        date = cal.dateFromComponents({year: 2018, month: 9, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "9 09 Sep September S");

        date = cal.dateFromComponents({year: 2018, month: 10, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "10 10 Oct October O");

        date = cal.dateFromComponents({year: 2018, month: 11, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "11 11 Nov November N");

        date = cal.dateFromComponents({year: 2018, month: 12, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "12 12 Dec December D");
    },

    testStandaloneMonth: function(){
        var formatter = JSDateFormatter.init();
        formatter.narrowStandaloneMonthSymbols = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];
        formatter.abbreviatedStandaloneMonthSymbols = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        formatter.fullStandaloneMonthSymbols = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        var cal = formatter.calendar;
        formatter.dateFormat = "L LL LLL LLLL LLLLL";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "1 01 jan january j");

        date = cal.dateFromComponents({year: 2018, month: 2, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2 02 feb february f");

        date = cal.dateFromComponents({year: 2018, month: 3, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03 mar march m");

        date = cal.dateFromComponents({year: 2018, month: 4, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 04 apr april a");

        date = cal.dateFromComponents({year: 2018, month: 5, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "5 05 may may m");

        date = cal.dateFromComponents({year: 2018, month: 6, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06 jun june j");

        date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "7 07 jul july j");

        date = cal.dateFromComponents({year: 2018, month: 8, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "8 08 aug august a");

        date = cal.dateFromComponents({year: 2018, month: 9, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "9 09 sep september s");

        date = cal.dateFromComponents({year: 2018, month: 10, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "10 10 oct october o");

        date = cal.dateFromComponents({year: 2018, month: 11, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "11 11 nov november n");

        date = cal.dateFromComponents({year: 2018, month: 12, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "12 12 dec december d");
    },

    testDay: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "d dd ddd";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 8, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "8 08 08");
    },

    testWeekday: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "E EE EEE EEEE EEEEE EEEEEE";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Sun Sun Sun Sunday S Su");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 8, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Mon Mon Mon Monday M Mo");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 9, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Tues Tues Tues Tuesday T Tu");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 10, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Wed Wed Wed Wednesday W We");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 11, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Thur Thur Thur Thursday T Th");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 12, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Fri Fri Fri Friday F Fr");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 13, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "Sat Sat Sat Saturday S Sa");

        formatter.dateFormat = "e ee eee eeee eeeee eeeeee";
        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "1 01 Sun Sunday S Su");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 8, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2 02 Mon Monday M Mo");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 9, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03 Tues Tuesday T Tu");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 10, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 04 Wed Wednesday W We");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 11, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "5 05 Thur Thursday T Th");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 12, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06 Fri Friday F Fr");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 13, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "7 07 Sat Saturday S Sa");
    },

    testStandaloneWeekday: function(){
        var formatter = JSDateFormatter.init();
        formatter.narrowStandaloneWeekdaySymbols = ['s', 'm', 't', 'w', 't', 'f', 's'];
        formatter.shortStandaloneWeekdaySymbols = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
        formatter.abbreviatedStandaloneWeekdaySymbols = ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat'];
        formatter.fullStandaloneWeekdaySymbols = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        var cal = formatter.calendar;

        formatter.dateFormat = "c cc ccc cccc ccccc cccccc";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "1 01 sun sunday s su");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 8, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2 02 mon monday m mo");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 9, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03 tues tuesday t tu");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 10, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 04 wed wednesday w we");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 11, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "5 05 thur thursday t th");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 12, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06 fri friday f fr");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 13, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "7 07 sat saturday s sa");
    },

    testAMPM: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "a";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "AM");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "PM");
    },

    testHours1_12: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "h hh";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 15, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 0, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "12 12");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "12 12");
    },

    testHours0_23: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "H HH";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 15, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "15 15");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 0, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "0 00");
    },

    testHours0_11: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "K KK";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "6 06");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 15, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "3 03");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 0, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "0 00");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "0 00");
    },

    testHours1_24: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "k kk";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "7 07");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 15, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "16 16");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 0, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "1 01");

        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 12, minute: 30, second: 45, millisecond: 123});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "13 13");
    },

    testMinutes: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "m mm";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "9 09");
    },

    testSeconds: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "s ss";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 4, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 04");
    },

    testMilliseconds: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "S SS SSS SSSS SSSSS";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 4, millisecond: 452});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "4 45 452 4520 45200");
    },

    testTimezone: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "z zz zzz zzzz";
        var date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 4, millisecond: 452});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "PST PST PST GMT-8:00");

        formatter.dateFormat = "Z ZZ ZZZ ZZZZ ZZZZZ";
        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 4, millisecond: 452});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "-0800 -0800 -0800 GMT-8:00 -08:00");

        formatter.dateFormat = "O OO OOO OOOO";
        date = cal.dateFromComponents({year: 2018, month: 1, day: 7, hour: 6, minute: 9, second: 4, millisecond: 452});
        str = formatter.stringFromDate(date);
        TKAssertEquals(str, "GMT-8 GMT-8 GMT-8 GMT-8:00");
    },

    testUnquotedPunctuation: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "y-MM-dd,hh:mm:ss.SSS a";
        var date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "2018-07-18,12:30:45.123 PM");
    },

    testQuotes: function(){
        var formatter = JSDateFormatter.init();
        var cal = formatter.calendar;
        formatter.dateFormat = "'''Testin'' 'y-MM-dd,hh:mm:ss.SSS a' qu' 'otes'''";
        var date = cal.dateFromComponents({year: 2018, month: 7, day: 18, hour: 12, minute: 30, second: 45, millisecond: 123});
        var str = formatter.stringFromDate(date);
        TKAssertEquals(str, "'Testin' 2018-07-18,12:30:45.123 PM qu otes'");
    }
});


var zoneinfo = {
 "zones": [
  {
   "map": [
    2, 
    1, 
    2, 
    1, 
    2, 
    3, 
    4, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2
   ], 
   "transitions": [
    -2717640000, 
    -1633269600, 
    -1615129200, 
    -1601820000, 
    -1583679600, 
    -880207200, 
    -769395600, 
    -765385200, 
    -687967140, 
    -662655600, 
    -620838000, 
    -608137200, 
    -589388400, 
    -576082800, 
    -557938800, 
    -544633200, 
    -526489200, 
    -513183600, 
    -495039600, 
    -481734000, 
    -463590000, 
    -450284400, 
    -431535600, 
    -418230000, 
    -400086000, 
    -386780400, 
    -368636400, 
    -355330800, 
    -337186800, 
    -323881200, 
    -305737200, 
    -292431600, 
    -273682800, 
    -260982000, 
    -242233200, 
    -226508400, 
    -210783600, 
    -195058800, 
    -179334000, 
    -163609200, 
    -147884400, 
    -131554800, 
    -116434800, 
    -100105200, 
    -84376800, 
    -68655600, 
    -52927200, 
    -37206000, 
    -21477600, 
    -5756400, 
    9972000, 
    25693200, 
    41421600, 
    57747600, 
    73476000, 
    89197200, 
    104925600, 
    120646800, 
    126698400, 
    152096400, 
    162381600, 
    183546000, 
    199274400, 
    215600400, 
    230724000, 
    247050000, 
    262778400, 
    278499600, 
    294228000, 
    309949200, 
    325677600, 
    341398800, 
    357127200, 
    372848400, 
    388576800, 
    404902800, 
    420026400, 
    436352400, 
    452080800, 
    467802000, 
    483530400, 
    499251600, 
    514980000, 
    530701200, 
    544615200, 
    562150800, 
    576064800, 
    594205200, 
    607514400, 
    625654800, 
    638964000, 
    657104400, 
    671018400, 
    688554000, 
    702468000, 
    720003600, 
    733917600, 
    752058000, 
    765367200, 
    783507600, 
    796816800, 
    814957200, 
    828871200, 
    846406800, 
    860320800, 
    877856400, 
    891770400, 
    909306000, 
    923220000, 
    941360400, 
    954669600, 
    972810000, 
    986119200, 
    1004259600, 
    1018173600, 
    1035709200, 
    1049623200, 
    1067158800, 
    1081072800, 
    1099213200, 
    1112522400, 
    1130662800, 
    1143972000, 
    1162112400, 
    1173607200, 
    1194166800, 
    1205056800, 
    1225616400, 
    1236506400, 
    1257066000, 
    1268560800, 
    1289120400, 
    1300010400, 
    1320570000, 
    1331460000, 
    1352019600, 
    1362909600, 
    1383469200, 
    1394359200, 
    1414918800, 
    1425808800, 
    1446368400, 
    1457863200, 
    1478422800, 
    1489312800, 
    1509872400, 
    1520762400, 
    1541322000, 
    1552212000, 
    1572771600, 
    1583661600, 
    1604221200, 
    1615716000, 
    1636275600, 
    1647165600, 
    1667725200, 
    1678615200, 
    1699174800, 
    1710064800, 
    1730624400, 
    1741514400, 
    1762074000, 
    1772964000, 
    1793523600, 
    1805018400, 
    1825578000, 
    1836468000, 
    1857027600, 
    1867917600, 
    1888477200, 
    1899367200, 
    1919926800, 
    1930816800, 
    1951376400, 
    1962871200, 
    1983430800, 
    1994320800, 
    2014880400, 
    2025770400, 
    2046330000, 
    2057220000, 
    2077779600, 
    2088669600, 
    2109229200, 
    2120119200, 
    2140678800
   ], 
   "tz": "PST8PDT,M3.2.0,M11.1.0", 
   "rule": {
    "daylight": {
     "dst": true, 
     "off": -25200, 
     "abbr": "PDT"
    }, 
    "fromStandard": {
     "week": 2, 
     "time": 7200, 
     "dow": 0, 
     "month": 3
    }, 
    "toStandard": {
     "week": 1, 
     "time": 7200, 
     "dow": 0, 
     "month": 11
    }, 
    "standard": {
     "dst": false, 
     "off": -28800, 
     "abbr": "PST"
    }
   }, 
   "types": [
    {
     "dst": false, 
     "off": -28378, 
     "abbr": "LMT"
    }, 
    {
     "dst": true, 
     "off": -25200, 
     "abbr": "PDT"
    }, 
    {
     "dst": false, 
     "off": -28800, 
     "abbr": "PST"
    }, 
    {
     "dst": true, 
     "off": -25200, 
     "abbr": "PWT"
    }, 
    {
     "dst": true, 
     "off": -25200, 
     "abbr": "PPT"
    }
   ]
  }, 
  {
   "map": [
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    1, 
    2, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3, 
    4, 
    3
   ], 
   "transitions": [
    -2364113092, 
    -1672567140, 
    -1665392400, 
    -883641600, 
    -876128400, 
    -860400000, 
    -844678800, 
    -828345600, 
    -813229200, 
    57686400, 
    67968000, 
    89136000, 
    100022400, 
    120585600, 
    131472000, 
    152035200, 
    162921600, 
    183484800, 
    194976000, 
    215539200, 
    226425600, 
    246988800, 
    257875200, 
    278438400, 
    289324800, 
    309888000, 
    320774400, 
    341337600, 
    352224000, 
    372787200, 
    386697600, 
    404841600, 
    415728000, 
    436291200, 
    447177600, 
    467740800, 
    478627200, 
    499190400, 
    511286400, 
    530035200, 
    542736000, 
    562089600, 
    574790400, 
    594144000, 
    606240000, 
    625593600, 
    636480000, 
    657043200, 
    667929600, 
    688492800, 
    699379200, 
    719942400, 
    731433600, 
    751996800, 
    762883200, 
    783446400, 
    794332800, 
    814896000, 
    828201600, 
    846345600, 
    859651200, 
    877795200, 
    891100800, 
    909244800, 
    922550400, 
    941299200, 
    954000000, 
    967305600, 
    985449600, 
    1004198400, 
    1017504000, 
    1035648000, 
    1048953600, 
    1067097600, 
    1080403200, 
    1099152000, 
    1111852800, 
    1130601600, 
    1143907200, 
    1162051200, 
    1174752000, 
    1193500800, 
    1207411200, 
    1223136000, 
    1238860800, 
    1254585600, 
    1270310400, 
    1286035200, 
    1301760000, 
    1317484800, 
    1333209600, 
    1349539200, 
    1365264000, 
    1380988800, 
    1396713600, 
    1412438400, 
    1428163200, 
    1443888000, 
    1459612800, 
    1475337600, 
    1491062400, 
    1506787200, 
    1522512000, 
    1538841600, 
    1554566400, 
    1570291200, 
    1586016000, 
    1601740800, 
    1617465600, 
    1633190400, 
    1648915200, 
    1664640000, 
    1680364800, 
    1696089600, 
    1712419200, 
    1728144000, 
    1743868800, 
    1759593600, 
    1775318400, 
    1791043200, 
    1806768000, 
    1822492800, 
    1838217600, 
    1853942400, 
    1869667200, 
    1885996800, 
    1901721600, 
    1917446400, 
    1933171200, 
    1948896000, 
    1964620800, 
    1980345600, 
    1996070400, 
    2011795200, 
    2027520000, 
    2043244800, 
    2058969600, 
    2075299200, 
    2091024000, 
    2106748800, 
    2122473600, 
    2138198400
   ], 
   "tz": "AEST-10AEDT,M10.1.0,M4.1.0/3", 
   "rule": {
    "daylight": {
     "dst": true, 
     "off": 39600, 
     "abbr": "AEDT"
    }, 
    "fromStandard": {
     "week": 1, 
     "time": 7200, 
     "dow": 0, 
     "month": 10
    }, 
    "toStandard": {
     "week": 1, 
     "time": 10800, 
     "dow": 0, 
     "month": 4
    }, 
    "standard": {
     "dst": false, 
     "off": 36000, 
     "abbr": "AEST"
    }
   }, 
   "types": [
    {
     "dst": false, 
     "off": 36292, 
     "abbr": "LMT"
    }, 
    {
     "dst": true, 
     "off": 39600, 
     "abbr": "AEDT"
    }, 
    {
     "dst": false, 
     "off": 36000, 
     "abbr": "AEST"
    }, 
    {
     "dst": true, 
     "off": 39600, 
     "abbr": "AEDT"
    }, 
    {
     "dst": false, 
     "off": 36000, 
     "abbr": "AEST"
    }
   ]
  }, 
  {
   "map": [], 
   "transitions": [], 
   "tz": "GMT0", 
   "rule": {
    "standard": {
     "dst": false, 
     "off": 0, 
     "abbr": "GMT"
    }
   }, 
   "types": [
    {
     "dst": false, 
     "off": 0, 
     "abbr": "GMT"
    }
   ]
  }
 ], 
 "map": {
  "America/Los_Angeles": {
   "index": 0
  }, 
  "Australia/Sydney": {
   "index": 1
  }, 
  "GMT": {
   "index": 2
  }
 }
};

})();