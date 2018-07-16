// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSCalendar, JSGregorianCalendar, JSTimeZone, JSDate */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

(function(){

JSClass("JSCalendarTests", TKTestSuite, {

    setup: function(){
        JSTimeZone.importZoneInfo(zoneinfo);
        JSTimeZone.local = JSTimeZone.initWithIdentifier("America/Los_Angeles");
    },

    teardown: function(){
        JSTimeZone.clearZoneInfo();
        JSTimeZone.local = null;
    },

    testGregorian: function(){
        var cal = JSCalendar.gregorian;
        TKAssertNotNull(cal);
        TKAssertObjectEquals(cal.timezone, JSTimeZone.local);
    },

    testComponentsFromDate: function(){
        var cal = JSCalendar.gregorian;

        // Jan 1 1970 in UTC
        var date = JSDate.initWithIntervalSince1970(0);

        // Check timezone fallback to local if none specified
        var components = cal.componentsFromDate(JSCalendar.Unit.all, date);
        TKAssertObjectEquals(components.timezone, JSTimeZone.local);

        // Check fallback to timezone member
        var tz = JSTimeZone.initWithIntervalFromUTC(3600);
        cal = JSGregorianCalendar.init();
        cal.timezone = tz;
        components = cal.componentsFromDate(JSCalendar.Unit.all, date);
        TKAssertObjectEquals(components.timezone, tz);

        // Check UTC timezone
        cal = JSCalendar.gregorian;
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, JSTimeZone.utc);
        TKAssertObjectEquals(components.timezone, JSTimeZone.utc);
        TKAssertObjectEquals(components.calendar, cal);
        TKAssertEquals(components.era, 1);
        TKAssertEquals(components.year, 1970);
        TKAssertEquals(components.month, 1);
        TKAssertEquals(components.day, 1);
        TKAssertExactEquals(components.hour, 0);
        TKAssertExactEquals(components.minute, 0);
        TKAssertExactEquals(components.second, 0);
        TKAssertExactEquals(components.millisecond, 0);
        TKAssertExactEquals(components.weekday, 5);

        // Check custom tz
        tz = JSTimeZone.initWithIntervalFromUTC(3600);
        cal = JSGregorianCalendar.init();
        cal.timezone = tz;
        var units = JSCalendar.Unit.all & ~JSCalendar.Unit.calendar;
        components = cal.componentsFromDate(JSCalendar.Unit.all, date);
        TKAssertObjectEquals(components.timezone, tz);
        TKAssertUndefined(components.calendar);
        TKAssertEquals(components.era, 1);
        TKAssertEquals(components.year, 1970);
        TKAssertEquals(components.month, 1);
        TKAssertEquals(components.day, 1);
        TKAssertExactEquals(components.hour, 1);
        TKAssertExactEquals(components.minute, 0);
        TKAssertExactEquals(components.second, 0);
        TKAssertExactEquals(components.millisecond, 0);
        TKAssertExactEquals(components.weekday, 5);

        // Check custom tz (negative)
        tz = JSTimeZone.initWithIntervalFromUTC(-3600);
        cal = JSGregorianCalendar.init();
        cal.timezone = tz;
        units = JSCalendar.Unit.all & ~(JSCalendar.Unit.calendar & JSCalendar.Unit.timezone);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date);
        TKAssertUndefined(components.timezone);
        TKAssertUndefined(components.calendar);
        TKAssertEquals(components.era, 1);
        TKAssertEquals(components.year, 1969);
        TKAssertEquals(components.month, 12);
        TKAssertEquals(components.day, 31);
        TKAssertExactEquals(components.hour, 23);
        TKAssertExactEquals(components.minute, 0);
        TKAssertExactEquals(components.second, 0);
        TKAssertExactEquals(components.millisecond, 0);
        TKAssertExactEquals(components.weekday, 4);

        // each unit on/off
        cal = JSCalendar.gregorian;
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.era);
        TKAssertNotUndefined(components.era);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.era);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.year);
        TKAssertNotUndefined(components.year);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.year);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.month);
        TKAssertNotUndefined(components.month);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.month);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.day);
        TKAssertNotUndefined(components.day);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.day);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.hour);
        TKAssertNotUndefined(components.hour);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.hour);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.minute);
        TKAssertNotUndefined(components.minute);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.minute);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.second);
        TKAssertNotUndefined(components.second);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.second);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.millisecond);
        TKAssertNotUndefined(components.millisecond);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.millisecond);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar | JSCalendar.unit.weekday);
        TKAssertNotUndefined(components.weekday);
        components = cal.componentsFromDate(JSCalendar.Unit.calendar);
        TKAssertUndefined(components.weekday);

        // BC vs CE
        // Jan 1 500 BC 12:30 PM UTC
        date = JSDate.initWithIntervalSince1970(-77914092600);
        cal = JSCalendar.gregorian;
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, JSTimeZone.utc);
        TKAssertEquals(components.era, 0);
        TKAssertEquals(components.year, 500);
        TKAssertEquals(components.month, 1);
        TKAssertEquals(components.day, 1);
        TKAssertEquals(components.hour, 12);
        TKAssertEquals(components.minute, 30);

        // Daylight savings edges
        tz = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        // March 11 2018 1am PST (1 hr before switch to PDT)
        date = JSDate.initWithIntervalSince1970(1520758800);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, tz);
        TKAssertEquals(components.year, 2018);
        TKAssertEquals(components.month, 3);
        TKAssertEquals(components.day, 11);
        TKAssertEquals(components.hour, 1);
        TKAssertEquals(components.minute, 0);
        // + 1hr (moment of switch, should be 3am PDT)
        date = date.addingTimeInterval(3600);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, tz);
        TKAssertEquals(components.year, 2018);
        TKAssertEquals(components.month, 3);
        TKAssertEquals(components.day, 11);
        TKAssertEquals(components.hour, 3);
        TKAssertEquals(components.minute, 0);

        // Nov 4 2018 1am PDT (1 hr before switch to PST)
        date = JSDate.initWithIntervalSince1970(1541318400);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, tz);
        TKAssertEquals(components.year, 2018);
        TKAssertEquals(components.month, 11);
        TKAssertEquals(components.day, 4);
        TKAssertEquals(components.hour, 1);
        TKAssertEquals(components.minute, 0);
        // + 1hr (moment of switch, should be 1am PDT)
        date = date.addingTimeInterval(3600);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, tz);
        TKAssertEquals(components.year, 2018);
        TKAssertEquals(components.month, 11);
        TKAssertEquals(components.day, 4);
        TKAssertEquals(components.hour, 1);
        TKAssertEquals(components.minute, 0);
        // + 1hr (moment of switch, should be 2am PDT)
        date = date.addingTimeInterval(3600);
        components = cal.componentsFromDate(JSCalendar.Unit.all, date, tz);
        TKAssertEquals(components.year, 2018);
        TKAssertEquals(components.month, 11);
        TKAssertEquals(components.day, 4);
        TKAssertEquals(components.hour, 2);
        TKAssertEquals(components.minute, 0);
    },

    testDateFromComponents: function(){
        // UTC date
        var cal = JSCalendar.gregorian;
        var components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            second: 30,
            millisecond: 123,
            timezone: JSTimeZone.utc
        };
        var date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531674450.123);

        // component defaults
        components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            timezone: JSTimeZone.utc
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531674420);

        components = {
            year: 2018,
            month: 7,
            timezone: JSTimeZone.utc
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1530403200);

        components = {
            year: 2018,
            timezone: JSTimeZone.utc
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1514764800);

        components = {
            timezone: JSTimeZone.utc
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, -62135596800);

        // Fixed timezone
        components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            second: 30,
            timezone: JSTimeZone.initWithIntervalFromUTC(3600)
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531674450 - 3600);

        // Fixed timezone (negative offset)
        components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            second: 30,
            timezone: JSTimeZone.initWithIntervalFromUTC(-3600)
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531674450 + 3600);

        // Timezone fallback
        var tz = JSTimeZone.initWithIntervalFromUTC(3600);
        cal = JSGregorianCalendar.init();
        cal.timezone = tz;
        components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            second: 30
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531674450 - 3600);

        // Timezone fallback all the way to local
        cal = JSCalendar.gregorian;
        components = {
            year: 2018,
            month: 7,
            day: 15,
            hour: 17,
            minute: 7,
            second: 30
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1531699650);

        // BC vs CE
        // Jan 1 500 BC 12:30 PM UTC
        components = {
            era: 0,
            year: 500,
            month: 1,
            day: 1,
            hour: 12,
            minute: 30,
            timezone: JSTimeZone.utc
        };
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, -77914092600);

        // Daylight Saving edges
        // 1 am PST, an hour before switch to PDT
        tz = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        components = {year: 2018, month: 3, day: 11, hour: 1, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1520758800);

        // 2am, doesn't exist, should match 3am timestamp
        components = {year: 2018, month: 3, day: 11, hour: 2, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1520758800 + 3600);

        // 3am, one hour ahead of 1am
        components = {year: 2018, month: 3, day: 11, hour: 3, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1520758800 + 3600);

        // 4am, two hours ahead of 1am
        components = {year: 2018, month: 3, day: 11, hour: 4, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1520758800 + 3600 + 3600);

        // 1 am PDT, an hour before switch to PST
        // NOTE: 1am is ambigious because there are two of them on this date
        // in the Los Angeles timezone.  JSCalendar will always return the first one
        components = {year: 2018, month: 11, day: 4, hour: 1, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1541318400);

        // 1 am PST, requires a special timezone to create
        components = {year: 2018, month: 11, day: 4, hour: 1, timezone: JSTimeZone.initWithIntervalFromUTC(-8 * 3600)};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1541318400 + 3600);

        // 2 am PST, after switch to PST and really 2 hours after 1 am PDT
        components = {year: 2018, month: 3, day: 11, hour: 2, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1541318400 + 3600 + 3600);

        // Timezone with positive offset and daylight savings
        tz = JSTimeZone.initWithIdentifier("Australia/Sydney");

        // 1 am AEST, an hour before switch to AEDT
        components = {year: 2018, month: 10, day: 7, hour: 1, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1538838000);

        // 2am, doesn't exist, should match 3am timestamp
        components = {year: 2018, month: 10, day: 7, hour: 2, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1538838000 + 3600);

        // 3am, one hour ahead of 1am
        components = {year: 2018, month: 10, day: 7, hour: 3, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1538838000 + 3600);

        // 4am, two hours ahead of 1am
        components = {year: 2018, month: 10, day: 7, hour: 4, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1538838000 + 3600 + 3600);

        // 2 am AEDT, an hour before switch to AEST
        // NOTE: 2am is ambigious because there are two of them on this date
        // in the Sydney timezone.  JSCalendar will always return the first one
        components = {year: 2018, month: 4, day: 1, hour: 2, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1522508400);

        // 1 am AEST, requires a special timezone to create
        components = {year: 2018, month: 4, day: 1, hour: 2, timezone: JSTimeZone.initWithIntervalFromUTC(10 * 3600)};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1522504800 + 3600);

        // 3 am AEST, after switch to AEST and really 2 hours after 2 am AEDT
        components = {year: 2018, month: 4, day: 1, hour: 3, timezone: tz};
        date = cal.dateFromComponents(components);
        TKAssertEquals(date.timeIntervalSince1970, 1522508400 + 3600 + 3600);
    },

    testDateByAddingComponents: function(){
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
  }
 ], 
 "map": {
  "America/Los_Angeles": {
   "index": 0
  }, 
  "Australia/Sydney": {
   "index": 1
  }
 }
};

})();