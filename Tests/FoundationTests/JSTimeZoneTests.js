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

// #import Foundation
// #import TestKit
'use strict';

(function(){

// TODO: Tests on Antarctica/Troll, with a 2hr daylight savings time jump
// TODO: Tests on Australia/Lord_Howe, with a 1/2 hour daylight savings time jump

JSClass("JSTimeZoneTests", TKTestSuite, {

    setup: function(){
        JSTimeZone.importZoneInfo(zoneinfo);
    },

    teardown: function(){
        JSTimeZone.clearZoneInfo();
    },

    testInitWithIdentifier: function(){
        var zone = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        TKAssertNotNull(zone);
        TKAssertExactEquals(zone.identifier, "America/Los_Angeles");
        zone = JSTimeZone.initWithIdentifier("NotValid");
        TKAssertNull(zone);
        zone = JSTimeZone.initWithIdentifier(null);
        TKAssertNull(zone);
        zone = JSTimeZone.initWithIdentifier(undefined);
        TKAssertNull(zone);
    },

    testInitWithTimeInterval: function(){
        var zone = JSTimeZone.initWithTimeIntervalFromUTC(3600);
        TKAssertNotNull(zone);
        TKAssertExactEquals(zone.identifier, null);
    },

    testUTC: function(){
        var zone = JSTimeZone.utc;
        TKAssertNotNull(zone);
    },

    testKnownIdentifiers: function(){
        var identifiers = JSTimeZone.knownTimeZoneIdentifiers;
        TKAssertEquals(identifiers.length, 3);
        TKAssertEquals(identifiers[0], 'America/Los_Angeles');
        TKAssertEquals(identifiers[1], 'Australia/Sydney');
        TKAssertEquals(identifiers[2], 'GMT');
    },

    testTimeIntervalFromUTCForDate: function(){
        // ----
        // UTC
        var zone = JSTimeZone.utc;
        // distant past
        var offset = zone.timeIntervalFromUTCForDate(JSDate.distantPast);
        TKAssertExactEquals(offset, 0);
        // Jul 4 1776 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertExactEquals(offset, 0);
        // Jan 1 1970 00:00:00 UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertExactEquals(offset, 0);
        // Jan 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertExactEquals(offset, 0);
        // Jul 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertExactEquals(offset, 0);
        // Dec 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertExactEquals(offset, 0);
        // Jan 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertExactEquals(offset, 0);
        // Jul 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertExactEquals(offset, 0);
        // now
        offset = zone.timeIntervalFromUTCForDate(JSDate.now);
        TKAssertExactEquals(offset, 0);
        // distant future
        offset = zone.timeIntervalFromUTCForDate(JSDate.distantFuture);
        TKAssertExactEquals(offset, 0);

        // ----
        // GMT
        zone = JSTimeZone.initWithIdentifier('GMT');
        // distant past
        offset = zone.timeIntervalFromUTCForDate(JSDate.distantPast);
        TKAssertExactEquals(offset, 0);
        // Jul 4 1776 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertExactEquals(offset, 0);
        // Jan 1 1970 00:00:00 UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertExactEquals(offset, 0);
        // Jan 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertExactEquals(offset, 0);
        // Jul 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertExactEquals(offset, 0);
        // Dec 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertExactEquals(offset, 0);
        // Jan 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertExactEquals(offset, 0);
        // Jul 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertExactEquals(offset, 0);
        // now
        offset = zone.timeIntervalFromUTCForDate(JSDate.now);
        TKAssertExactEquals(offset, 0);
        // distant future
        offset = zone.timeIntervalFromUTCForDate(JSDate.distantFuture);
        TKAssertExactEquals(offset, 0);

        // ----
        // America/Los_Angeles
        zone = JSTimeZone.initWithIdentifier('America/Los_Angeles');
        // distant past
        offset = zone.timeIntervalFromUTCForDate(JSDate.distantPast);
        TKAssertEquals(offset, -28378);
        // Jul 4 1776 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(offset, -28378);
        // Jan 1 1970 00:00:00 UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(offset, -28800);
        // Jan 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(offset, -28800);
        // Mar 11 2018 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1520762340));
        TKAssertEquals(offset, -28800);
        // Mar 11 2018 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1520762400));
        TKAssertEquals(offset, -25200);
        // Jul 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(offset, -25200);
        // Nov 4 2018 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1541321940));
        TKAssertEquals(offset, -25200);
        // Nov 4 2018 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1541322000));
        TKAssertEquals(offset, -28800);
        // Dec 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(offset, -28800);
        // Jan 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(offset, -28800);
        // Mar 12 2045 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2372925540));
        TKAssertEquals(offset, -28800);
        // Mar 12 2045 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2372925600));
        TKAssertEquals(offset, -25200);
        // Jul 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(offset, -25200);
        // Nov 5 2045 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2393485140));
        TKAssertEquals(offset, -25200);
        // Nov 5 2045 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2393485200));
        TKAssertEquals(offset, -28800);

        // ----
        // Australia/Sydney
        zone = JSTimeZone.initWithIdentifier('Australia/Sydney');
        // distant past
        offset = zone.timeIntervalFromUTCForDate(JSDate.distantPast);
        TKAssertEquals(offset, 36292);
        // Jul 4 1776 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(offset, 36292);
        // Jan 1 1970 00:00:00 UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(offset, 36000);
        // Jan 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(offset, 39600);
        // April 1 2018 2:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1522511940));
        TKAssertEquals(offset, 39600);
        // April 1 2018 3:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1522512000));
        TKAssertEquals(offset, 36000);
        // Jul 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(offset, 36000);
        // Oct 7 2018 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1538841540));
        TKAssertEquals(offset, 36000);
        // Oct 7 2018 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1538841600));
        TKAssertEquals(offset, 39600);
        // Dec 15 2018 noon UTC
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(offset, 39600);
        // Jan 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(offset, 39600);
        // April 2 2045 2:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2374675140));
        TKAssertEquals(offset, 39600);
        // April 2 2045 3:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2374675200));
        TKAssertEquals(offset, 36000);
        // Jul 15 2045 noon UTC 
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(offset, 36000);
        // Oct 1 2045 1:59am  (just before change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2390399940));
        TKAssertEquals(offset, 36000);
        // Oct 1 2045 2:00am  (moment of change)
        offset = zone.timeIntervalFromUTCForDate(JSDate.initWithTimeIntervalSince1970(2390400000));
        TKAssertEquals(offset, 39600);
    },

    testAbbreviationForDate: function(){
        // ----
        // UTC
        var zone = JSTimeZone.utc;
        // distant past
        var abbr = zone.abbreviationForDate(JSDate.distantPast);
        TKAssertEquals(abbr, "UTC");
        // Jul 4 1776 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(abbr, "UTC");
        // Jan 1 1970 00:00:00 UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(abbr, "UTC");
        // Jan 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(abbr, "UTC");
        // Jul 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(abbr, "UTC");
        // Dec 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(abbr, "UTC");
        // Jan 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(abbr, "UTC");
        // Jul 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(abbr, "UTC");
        // now
        abbr = zone.abbreviationForDate(JSDate.now);
        TKAssertEquals(abbr, "UTC");
        // distant future
        abbr = zone.abbreviationForDate(JSDate.distantFuture);
        TKAssertEquals(abbr, "UTC");

        // ----
        // GMT
        zone = JSTimeZone.initWithIdentifier('GMT');
        // distant past
        abbr = zone.abbreviationForDate(JSDate.distantPast);
        TKAssertEquals(abbr, "GMT");
        // Jul 4 1776 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(abbr, "GMT");
        // Jan 1 1970 00:00:00 UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(abbr, "GMT");
        // Jan 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(abbr, "GMT");
        // Jul 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(abbr, "GMT");
        // Dec 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(abbr, "GMT");
        // Jan 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(abbr, "GMT");
        // Jul 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(abbr, "GMT");
        // now
        abbr = zone.abbreviationForDate(JSDate.now);
        TKAssertEquals(abbr, "GMT");
        // distant future
        abbr = zone.abbreviationForDate(JSDate.distantFuture);
        TKAssertEquals(abbr, "GMT");

        // ----
        // America/Los_Angeles
        zone = JSTimeZone.initWithIdentifier('America/Los_Angeles');
        // distant past
        abbr = zone.abbreviationForDate(JSDate.distantPast);
        TKAssertEquals(abbr, "LMT");
        // Jul 4 1776 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(abbr, "LMT");
        // Jan 1 1970 00:00:00 UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(abbr, "PST");
        // Jan 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(abbr, "PST");
        // Mar 11 2018 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1520762340));
        TKAssertEquals(abbr, "PST");
        // Mar 11 2018 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1520762400));
        TKAssertEquals(abbr, "PDT");
        // Jul 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(abbr, "PDT");
        // Nov 4 2018 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1541321940));
        TKAssertEquals(abbr, "PDT");
        // Nov 4 2018 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1541322000));
        TKAssertEquals(abbr, "PST");
        // Dec 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(abbr, "PST");
        // Jan 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(abbr, "PST");
        // Mar 12 2045 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2372925540));
        TKAssertEquals(abbr, "PST");
        // Mar 12 2045 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2372925600));
        TKAssertEquals(abbr, "PDT");
        // Jul 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(abbr, "PDT");
        // Nov 5 2045 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2393485140));
        TKAssertEquals(abbr, "PDT");
        // Nov 5 2045 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2393485200));
        TKAssertEquals(abbr, "PST");

        // ----
        // Australia/Sydney
        zone = JSTimeZone.initWithIdentifier('Australia/Sydney');
        // distant past
        abbr = zone.abbreviationForDate(JSDate.distantPast);
        TKAssertEquals(abbr, "LMT");
        // Jul 4 1776 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(abbr, "LMT");
        // Jan 1 1970 00:00:00 UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(abbr, "AEST");
        // Jan 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(abbr, "AEDT");
        // April 1 2018 2:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1522511940));
        TKAssertEquals(abbr, "AEDT");
        // April 1 2018 3:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1522512000));
        TKAssertEquals(abbr, "AEST");
        // Jul 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(abbr, "AEST");
        // Oct 7 2018 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1538841540));
        TKAssertEquals(abbr, "AEST");
        // Oct 7 2018 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1538841600));
        TKAssertEquals(abbr, "AEDT");
        // Dec 15 2018 noon UTC
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(abbr, "AEDT");
        // Jan 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(abbr, "AEDT");
        // April 2 2045 2:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2374675140));
        TKAssertEquals(abbr, "AEDT");
        // April 2 2045 3:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2374675200));
        TKAssertEquals(abbr, "AEST");
        // Jul 15 2045 noon UTC 
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(abbr, "AEST");
        // Oct 1 2045 1:59am  (just before change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2390399940));
        TKAssertEquals(abbr, "AEST");
        // Oct 1 2045 2:00am  (moment of change)
        abbr = zone.abbreviationForDate(JSDate.initWithTimeIntervalSince1970(2390400000));
        TKAssertEquals(abbr, "AEDT");
    },

    testIsDaylightSavingsTimeForDate: function(){
        // ----
        // UTC
        var zone = JSTimeZone.utc;
        // distant past
        var dst = zone.isDaylightSavingsTimeForDate(JSDate.distantPast);
        TKAssertEquals(dst, false);
        // Jul 4 1776 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(dst, false);
        // Jan 1 1970 00:00:00 UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(dst, false);
        // Jan 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(dst, false);
        // Jul 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(dst, false);
        // Dec 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(dst, false);
        // Jan 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(dst, false);
        // Jul 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(dst, false);
        // now
        dst = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(dst, false);
        // distant future
        dst = zone.isDaylightSavingsTimeForDate(JSDate.distantFuture);
        TKAssertEquals(dst, false);

        // ----
        // GMT
        zone = JSTimeZone.initWithIdentifier('GMT');
        // distant past
        dst = zone.isDaylightSavingsTimeForDate(JSDate.distantPast);
        TKAssertEquals(dst, false);
        // Jul 4 1776 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(dst, false);
        // Jan 1 1970 00:00:00 UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(dst, false);
        // Jan 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(dst, false);
        // Jul 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(dst, false);
        // Dec 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(dst, false);
        // Jan 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(dst, false);
        // Jul 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(dst, false);
        // now
        dst = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(dst, false);
        // distant future
        dst = zone.isDaylightSavingsTimeForDate(JSDate.distantFuture);
        TKAssertEquals(dst, false);

        // ----
        // America/Los_Angeles
        zone = JSTimeZone.initWithIdentifier('America/Los_Angeles');
        // distant past
        dst = zone.isDaylightSavingsTimeForDate(JSDate.distantPast);
        TKAssertEquals(dst, false);
        // Jul 4 1776 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(dst, false);
        // Jan 1 1970 00:00:00 UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(dst, false);
        // Jan 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(dst, false);
        // Mar 11 2018 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1520762340));
        TKAssertEquals(dst, false);
        // Mar 11 2018 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1520762400));
        TKAssertEquals(dst, true);
        // Jul 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(dst, true);
        // Nov 4 2018 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1541321940));
        TKAssertEquals(dst, true);
        // Nov 4 2018 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1541322000));
        TKAssertEquals(dst, false);
        // Dec 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(dst, false);
        // Jan 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(dst, false);
        // Mar 12 2045 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2372925540));
        TKAssertEquals(dst, false);
        // Mar 12 2045 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2372925600));
        TKAssertEquals(dst, true);
        // Jul 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(dst, true);
        // Nov 5 2045 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2393485140));
        TKAssertEquals(dst, true);
        // Nov 5 2045 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2393485200));
        TKAssertEquals(dst, false);

        // ----
        // Australia/Sydney
        zone = JSTimeZone.initWithIdentifier('Australia/Sydney');
        // distant past
        dst = zone.isDaylightSavingsTimeForDate(JSDate.distantPast);
        TKAssertEquals(dst, false);
        // Jul 4 1776 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(dst, false);
        // Jan 1 1970 00:00:00 UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(dst, false);
        // Jan 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(dst, true);
        // April 1 2018 2:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1522511940));
        TKAssertEquals(dst, true);
        // April 1 2018 3:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1522512000));
        TKAssertEquals(dst, false);
        // Jul 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(dst, false);
        // Oct 7 2018 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1538841540));
        TKAssertEquals(dst, false);
        // Oct 7 2018 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1538841600));
        TKAssertEquals(dst, true);
        // Dec 15 2018 noon UTC
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(dst, true);
        // Jan 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(dst, true);
        // April 2 2045 2:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2374675140));
        TKAssertEquals(dst, true);
        // April 2 2045 3:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2374675200));
        TKAssertEquals(dst, false);
        // Jul 15 2045 noon UTC 
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(dst, false);
        // Oct 1 2045 1:59am  (just before change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2390399940));
        TKAssertEquals(dst, false);
        // Oct 1 2045 2:00am  (moment of change)
        dst = zone.isDaylightSavingsTimeForDate(JSDate.initWithTimeIntervalSince1970(2390400000));
        TKAssertEquals(dst, true);
    },

    testNextDaylightSavingsTransitionAfterDate: function(){
        // ----
        // UTC
        var zone = JSTimeZone.utc;
        // distant past
        var date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantPast);
        TKAssertNull(date);
        // Jul 4 1776 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertNull(date);
        // Jan 1 1970 00:00:00 UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertNull(date);
        // Jan 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertNull(date);
        // Jul 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertNull(date);
        // Dec 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertNull(date);
        // Jan 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertNull(date);
        // Jul 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertNull(date);
        // now
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.now);
        TKAssertNull(date);
        // distant future
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantFuture);
        TKAssertNull(date);

        // ----
        // GMT
        zone = JSTimeZone.initWithIdentifier('GMT');
        // distant past
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantPast);
        TKAssertNull(date);
        // Jul 4 1776 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertNull(date);
        // Jan 1 1970 00:00:00 UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertNull(date);
        // Jan 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertNull(date);
        // Jul 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertNull(date);
        // Dec 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertNull(date);
        // Jan 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertNull(date);
        // Jul 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertNull(date);
        // now
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.now);
        TKAssertNull(date);
        // distant future
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantFuture);
        TKAssertNull(date);

        // ----
        // America/Los_Angeles
        zone = JSTimeZone.initWithIdentifier('America/Los_Angeles');
        // distant past
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantPast);
        TKAssertEquals(date.timeIntervalSince1970, -2717640000);
        // Jul 4 1776 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(date.timeIntervalSince1970, -2717640000);
        // Jan 1 1970 00:00:00 UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(date.timeIntervalSince1970, 9972000);
        // Jan 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(date.timeIntervalSince1970, 1520762400);
        // Mar 11 2018 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1520762340));
        TKAssertEquals(date.timeIntervalSince1970, 1520762400);
        // Mar 11 2018 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1520762400));
        TKAssertEquals(date.timeIntervalSince1970, 1541322000);
        // Jul 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(date.timeIntervalSince1970, 1541322000);
        // Nov 4 2018 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1541321940));
        TKAssertEquals(date.timeIntervalSince1970, 1541322000);
        // Nov 4 2018 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1541322000));
        TKAssertEquals(date.timeIntervalSince1970, 1552212000);
        // Dec 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(date.timeIntervalSince1970, 1552212000);
        // Jan 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(date.timeIntervalSince1970, 2372925600);
        // Mar 12 2045 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2372925540));
        TKAssertEquals(date.timeIntervalSince1970, 2372925600);
        // Mar 12 2045 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2372925600));
        TKAssertEquals(date.timeIntervalSince1970, 2393485200);
        // Jul 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(date.timeIntervalSince1970, 2393485200);
        // Nov 5 2045 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2393485140));
        TKAssertEquals(date.timeIntervalSince1970, 2393485200);
        // Nov 5 2045 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2393485200));
        TKAssertEquals(date.timeIntervalSince1970, 2404375200);

        // ----
        // Australia/Sydney
        zone = JSTimeZone.initWithIdentifier('Australia/Sydney');
        // distant past
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.distantPast);
        TKAssertEquals(date.timeIntervalSince1970, -2364113092);
        // Jul 4 1776 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(-6106017600));
        TKAssertEquals(date.timeIntervalSince1970, -2364113092);
        // Jan 1 1970 00:00:00 UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(0));
        TKAssertEquals(date.timeIntervalSince1970, 57686400);
        // Jan 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1516017600));
        TKAssertEquals(date.timeIntervalSince1970, 1522512000);
        // April 1 2018 2:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1522511940));
        TKAssertEquals(date.timeIntervalSince1970, 1522512000);
        // April 1 2018 3:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1522512000));
        TKAssertEquals(date.timeIntervalSince1970, 1538841600);
        // Jul 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1531656000));
        TKAssertEquals(date.timeIntervalSince1970, 1538841600);
        // Oct 7 2018 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1538841540));
        TKAssertEquals(date.timeIntervalSince1970, 1538841600);
        // Oct 7 2018 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1538841600));
        TKAssertEquals(date.timeIntervalSince1970, 1554566400);
        // Dec 15 2018 noon UTC
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(1544875200));
        TKAssertEquals(date.timeIntervalSince1970, 1554566400);
        // Jan 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2368094400));
        TKAssertEquals(date.timeIntervalSince1970, 2374675200);
        // April 2 2045 2:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2374675140));
        TKAssertEquals(date.timeIntervalSince1970, 2374675200);
        // April 2 2045 3:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2374675200));
        TKAssertEquals(date.timeIntervalSince1970, 2390400000);
        // Jul 15 2045 noon UTC 
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2383732800));
        TKAssertEquals(date.timeIntervalSince1970, 2390400000);
        // Oct 1 2045 1:59am  (just before change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2390399940));
        TKAssertEquals(date.timeIntervalSince1970, 2390400000);
        // Oct 1 2045 2:00am  (moment of change)
        date = zone.nextDaylightSavingsTransitionAfterDate(JSDate.initWithTimeIntervalSince1970(2390400000));
        TKAssertEquals(date.timeIntervalSince1970, 2406124800);
    },

    testTimeIntervalFromUTC: function(){
        var zone = JSTimeZone.utc;
        TKAssertExactEquals(zone.timeIntervalFromUTC, 0);

        zone = JSTimeZone.initWithIdentifier('GMT');
        TKAssertExactEquals(zone.timeIntervalFromUTC, 0);

        zone = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        var hours = zone.isDaylightSavingsTime ? -7 : -8;
        TKAssertEquals(zone.timeIntervalFromUTC, hours * 3600);

        zone = JSTimeZone.initWithIdentifier("Australia/Sydney");
        hours = zone.isDaylightSavingsTime ? 11 : 10;
        TKAssertEquals(zone.timeIntervalFromUTC, hours * 3600);
    },

    testAbbreviation: function(){
        var zone = JSTimeZone.utc;
        TKAssertExactEquals(zone.abbreviation, "UTC");

        zone = JSTimeZone.initWithIdentifier('GMT');
        TKAssertExactEquals(zone.abbreviation, "GMT");

        zone = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        var abbr = zone.isDaylightSavingsTime ? "PDT" : "PST";
        TKAssertEquals(zone.abbreviation, abbr);

        zone = JSTimeZone.initWithIdentifier("Australia/Sydney");
        abbr = zone.isDaylightSavingsTime ? "AEDT" : "AEST";
        TKAssertEquals(zone.abbreviation, abbr);
    },

    testIsDaylightSavingsTime: function(){
        var zone = JSTimeZone.utc;
        var nowDST = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(zone.isDaylightSavingsTime, nowDST);

        zone = JSTimeZone.initWithIdentifier('GMT');
        nowDST = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(zone.isDaylightSavingsTime, nowDST);

        zone = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        nowDST = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(zone.isDaylightSavingsTime, nowDST);

        zone = JSTimeZone.initWithIdentifier("Australia/Sydney");
        nowDST = zone.isDaylightSavingsTimeForDate(JSDate.now);
        TKAssertEquals(zone.isDaylightSavingsTime, nowDST);
    },

    testNextDaylightSavingsTransition: function(){
        var zone = JSTimeZone.utc;
        TKAssertNull(zone.nextDaylightSavingsTransition);

        zone = JSTimeZone.initWithIdentifier('GMT');
        TKAssertNull(zone.nextDaylightSavingsTransition);

        zone = JSTimeZone.initWithIdentifier("America/Los_Angeles");
        var nowDate = zone.nextDaylightSavingsTransitionAfterDate(JSDate.now);
        TKAssertObjectEquals(zone.nextDaylightSavingsTransition, nowDate);

        zone = JSTimeZone.initWithIdentifier("Australia/Sydney");
        nowDate = zone.nextDaylightSavingsTransitionAfterDate(JSDate.now);
        TKAssertObjectEquals(zone.nextDaylightSavingsTransition, nowDate);
    },

    testRulesFromPOSIXString: function(){
        var str = "";
        var rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = null;
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = undefined;
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC-";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC+";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC-a";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC,";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC:";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNull(rules);
        str = "ABC-2";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "ABC");
        TKAssertExactEquals(rules.standard.off, 7200);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "ABC2";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "ABC");
        TKAssertExactEquals(rules.standard.off, -7200);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "ABC+2";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "ABC");
        TKAssertExactEquals(rules.standard.off, -7200);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "ABC2:30";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "ABC");
        TKAssertExactEquals(rules.standard.off, -9000);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "ABC2:30:15";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "ABC");
        TKAssertExactEquals(rules.standard.off, -9015);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "<any+char>+2";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "any+char");
        TKAssertExactEquals(rules.standard.off, -7200);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertUndefined(rules.daylight);
        TKAssertUndefined(rules.fromStandard);
        TKAssertUndefined(rules.toStandard);
        str = "EST+5EDT,M3.2.0/2,M11.1.0/2";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "EST");
        TKAssertExactEquals(rules.standard.off, -5 * 3600);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertExactEquals(rules.daylight.abbr, "EDT");
        TKAssertExactEquals(rules.daylight.off, -4 * 3600);
        TKAssertExactEquals(rules.daylight.dst, true);
        TKAssertExactEquals(rules.fromStandard.month, 3);
        TKAssertExactEquals(rules.fromStandard.week, 2);
        TKAssertExactEquals(rules.fromStandard.dow, 0);
        TKAssertExactEquals(rules.fromStandard.time, 7200);
        TKAssertExactEquals(rules.toStandard.month, 11);
        TKAssertExactEquals(rules.toStandard.week, 1);
        TKAssertExactEquals(rules.toStandard.dow, 0);
        TKAssertExactEquals(rules.toStandard.time, 7200);
        str = "IST-2IDT,M3.4.4/26,M10.5.0";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "IST");
        TKAssertExactEquals(rules.standard.off, 2 * 3600);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertExactEquals(rules.daylight.abbr, "IDT");
        TKAssertExactEquals(rules.daylight.off, 3 * 3600);
        TKAssertExactEquals(rules.daylight.dst, true);
        TKAssertExactEquals(rules.fromStandard.month, 3);
        TKAssertExactEquals(rules.fromStandard.week, 4);
        TKAssertExactEquals(rules.fromStandard.dow, 4);
        TKAssertExactEquals(rules.fromStandard.time, 26 * 3600);
        TKAssertExactEquals(rules.toStandard.month, 10);
        TKAssertExactEquals(rules.toStandard.week, 5);
        TKAssertExactEquals(rules.toStandard.dow, 0);
        TKAssertExactEquals(rules.toStandard.time, 7200);
        str = "WART4WARST,J1/0,J365/25";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "WART");
        TKAssertExactEquals(rules.standard.off, -4 * 3600);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertExactEquals(rules.daylight.abbr, "WARST");
        TKAssertExactEquals(rules.daylight.off, -3 * 3600);
        TKAssertExactEquals(rules.daylight.dst, true);
        TKAssertExactEquals(rules.fromStandard.day1, 1);
        TKAssertExactEquals(rules.fromStandard.time, 0);
        TKAssertExactEquals(rules.toStandard.day1, 365);
        TKAssertExactEquals(rules.toStandard.time, 25 * 3600);
        str = "WGT3WGST,M3.5.0/-2,M10.5.0/-1";
        rules = JSTimeZone.rulesFromPOSIXString(str);
        TKAssertNotNull(rules);
        TKAssertExactEquals(rules.standard.abbr, "WGT");
        TKAssertExactEquals(rules.standard.off, -3 * 3600);
        TKAssertExactEquals(rules.standard.dst, false);
        TKAssertExactEquals(rules.daylight.abbr, "WGST");
        TKAssertExactEquals(rules.daylight.off, -2 * 3600);
        TKAssertExactEquals(rules.daylight.dst, true);
        TKAssertExactEquals(rules.fromStandard.month, 3);
        TKAssertExactEquals(rules.fromStandard.week, 5);
        TKAssertExactEquals(rules.fromStandard.dow, 0);
        TKAssertExactEquals(rules.fromStandard.time, -7200);
        TKAssertExactEquals(rules.toStandard.month, 10);
        TKAssertExactEquals(rules.toStandard.week, 5);
        TKAssertExactEquals(rules.toStandard.dow, 0);
        TKAssertExactEquals(rules.toStandard.time, -3600);
    },

    testDataViewGetInt64: function(){
        var data = JSData.initWithArray([0xFF, 0xFF, 0xFF, 0xFF, 0x5E, 0x04, 0x1A, 0xC0]);
        var dataView = data.dataView();
        var n = dataView.jskitGetInt64(0);
        TKAssertEquals(n, -2717640000);

        data = JSData.initWithArray([0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00]);
        dataView = data.dataView();
        n = dataView.jskitGetInt64(0);
        TKAssertEquals(n, -0x100000000);
    },

    testInitWithData: function(){
        var tzif = "VFppZjIAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAC5AAAABAAAABCepkign7sVkKCGKqChmveQy4kaoNIj9HDSYSYQ1v50XNiArZDa/sOQ28CQENzepZDdqayQ3r6HkN+JjpDgnmmQ4WlwkOJ+S5DjSVKQ5F4tkOUpNJDmR0oQ5xJREOgnLBDo8jMQ6gcOEOrSFRDr5vAQ7LH3EO3G0hDukdkQ76/ukPBxuxDxj9CQ8n/BkPNvspD0X6OQ9U+UkPY/hZD3L3aQ+CiiEPkPWJD6CIQQ+viDIPvoZhD82GUg/chIEP64RyD/qCoQAJgpIAGIDBACeAsgA3EokARhJ6AFUQqQBkEJoAcw7JAHjUOgCRDOkAmtvyAK8LCQC+CvoAzZzRANwJGgDrmvEA+priAQmZEQEYmQIBJ5cxATaXIgFFlVEBVJVCAWOTcQFyk2IBgiU5AZCRggGgI1kBryNKAb4heQHNIWoB3B+ZAesfigH6HbkCB2KyAhgb2QIlYNICNq2hAkNe8gJUq8ECYV0SAnKp4QJ/7toCkKgBAp3s+gKupiECu+saAs036QLZ6ToC6zYJAvfnWgMJNCkDFnkiAycySQM0d0IDRTBpA1J1YgNjLokDcHOCA4HAUQOOcaIDn75xA6xvwgO9vJEDywGKA9u6sQPo/6oD+bjRBAb9ygQYSpkEJPvqBDZIuQRC+goEVEbZBF89MgRy2KEEfTtSBJDWwQSbOXIErtThBLnLOgTNZqkE18laBOtkyQT1x3oFCWLpBRPFmgUnYQkFMcO6BUVfKQVPwdoFY11JBW5TogWB7xEFjFHCBZ/tMQWqT+IFvetRBchOAgXb6XEF5kwiBfnnkQYE3eoGGHlZBiLcCgY2d3kGQNoqBlR1mQZe2EoGcnO5BnzWagaQcdkGmtSKBq5v+Qa5ZlIGzQHBBtdkcgbq/+EG9WKSBwj+AQcTYLIHJvwhBzFe0gdE+kEHT/CaB2OMCQdt7roHgYopB4vs2gefiEkHqer6B72GaQfH6RoH24SJB+XnOgf5gqkAABAAECAwEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAB//+dkAEA//+PgAAE//+dkAEI//+dkAEMUERUAFBTVABQV1QAUFBUAAAAAAEAAAABVFppZjIAAAAAAAAAAAAAAAAAAAAAAAAFAAAABQAAAAAAAAC6AAAABQAAABT/////XgQawP////+epkig/////5+7FZD/////oIYqoP////+hmveQ/////8uJGqD/////0iP0cP/////SYSYQ/////9b+dFz/////2ICtkP/////a/sOQ/////9vAkBD/////3N6lkP/////dqayQ/////96+h5D/////34mOkP/////gnmmQ/////+FpcJD/////4n5LkP/////jSVKQ/////+ReLZD/////5Sk0kP/////mR0oQ/////+cSURD/////6CcsEP/////o8jMQ/////+oHDhD/////6tIVEP/////r5vAQ/////+yx9xD/////7cbSEP/////ukdkQ/////++v7pD/////8HG7EP/////xj9CQ//////J/wZD/////82+ykP/////0X6OQ//////VPlJD/////9j+FkP/////3L3aQ//////goohD/////+Q9YkP/////6CIQQ//////r4gyD/////++hmEP/////82GUg//////3ISBD//////rhHIP//////qCoQAAAAAACYKSAAAAAAAYgMEAAAAAACeAsgAAAAAANxKJAAAAAABGEnoAAAAAAFUQqQAAAAAAZBCaAAAAAABzDskAAAAAAHjUOgAAAAAAkQzpAAAAAACa2/IAAAAAAK8LCQAAAAAAvgr6AAAAAADNnNEAAAAAANwJGgAAAAAA65rxAAAAAAD6muIAAAAAAQmZEQAAAAABGJkCAAAAAAEnlzEAAAAAATaXIgAAAAABRZVRAAAAAAFUlUIAAAAAAWOTcQAAAAABcpNiAAAAAAGCJTkAAAAAAZCRggAAAAABoCNZAAAAAAGvI0oAAAAAAb4heQAAAAABzSFqAAAAAAHcH5kAAAAAAesfigAAAAAB+h25AAAAAAIHYrIAAAAAAhgb2QAAAAACJWDSAAAAAAI2raEAAAAAAkNe8gAAAAACVKvBAAAAAAJhXRIAAAAAAnKp4QAAAAACf+7aAAAAAAKQqAEAAAAAAp3s+gAAAAACrqYhAAAAAAK76xoAAAAAAs036QAAAAAC2ek6AAAAAALrNgkAAAAAAvfnWgAAAAADCTQpAAAAAAMWeSIAAAAAAycySQAAAAADNHdCAAAAAANFMGkAAAAAA1J1YgAAAAADYy6JAAAAAANwc4IAAAAAA4HAUQAAAAADjnGiAAAAAAOfvnEAAAAAA6xvwgAAAAADvbyRAAAAAAPLAYoAAAAAA9u6sQAAAAAD6P+qAAAAAAP5uNEAAAAABAb9ygAAAAAEGEqZAAAAAAQk++oAAAAABDZIuQAAAAAEQvoKAAAAAARURtkAAAAABF89MgAAAAAEctihAAAAAAR9O1IAAAAABJDWwQAAAAAEmzlyAAAAAASu1OEAAAAABLnLOgAAAAAEzWapAAAAAATXyVoAAAAABOtkyQAAAAAE9cd6AAAAAAUJYukAAAAABRPFmgAAAAAFJ2EJAAAAAAUxw7oAAAAABUVfKQAAAAAFT8HaAAAAAAVjXUkAAAAABW5TogAAAAAFge8RAAAAAAWMUcIAAAAABZ/tMQAAAAAFqk/iAAAAAAW961EAAAAABchOAgAAAAAF2+lxAAAAAAXmTCIAAAAABfnnkQAAAAAGBN3qAAAAAAYYeVkAAAAABiLcCgAAAAAGNnd5AAAAAAZA2ioAAAAABlR1mQAAAAAGXthKAAAAAAZyc7kAAAAABnzWagAAAAAGkHHZAAAAAAaa1IoAAAAABq5v+QAAAAAGuWZSAAAAAAbNAcEAAAAABtdkcgAAAAAG6v/hAAAAAAb1YpIAAAAABwj+AQAAAAAHE2CyAAAAAAcm/CEAAAAABzFe0gAAAAAHRPpBAAAAAAdP8JoAAAAAB2OMCQAAAAAHbe66AAAAAAeBiikAAAAAB4vs2gAAAAAHn4hJAAAAAAep6voAAAAAB72GaQAAAAAHx+kaAAAAAAfbhIkAAAAAB+XnOgAAAAAH+YKpACAQIBAgMEAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQL//5EmAAD//52QAQT//4+AAAj//52QAQz//52QARBMTVQAUERUAFBTVABQV1QAUFBUAAAAAAABAAAAAAEKUFNUOFBEVCxNMy4yLjAsTTExLjEuMAo=";
        var zone = JSTimeZone.initWithData(tzif.dataByDecodingBase64(), "America/Los_Angeles");
        TKAssertNotNull(zone);
        TKAssertExactEquals(zone.identifier, "America/Los_Angeles");
        TKAssertExactEquals(zone._transitionTimes.length, 186);
        TKAssertExactEquals(zone._transitionTimes[0], -2717640000);
        TKAssertExactEquals(zone._transitionTimes[1], -1633269600);
        TKAssertExactEquals(zone._transitionTimes[185], 2140678800);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes.length, 186);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[0], 2);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[1], 1);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[185], 2);
        TKAssertExactEquals(zone._localTimeTypes.length, 5);
        TKAssertExactEquals(zone._localTimeTypes[0].dst, false);
        TKAssertExactEquals(zone._localTimeTypes[0].off, -28378);
        TKAssertExactEquals(zone._localTimeTypes[0].abbr, "LMT");
        TKAssertExactEquals(zone._localTimeTypes[1].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[1].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[1].abbr, "PDT");
        TKAssertExactEquals(zone._localTimeTypes[2].dst, false);
        TKAssertExactEquals(zone._localTimeTypes[2].off, -28800);
        TKAssertExactEquals(zone._localTimeTypes[2].abbr, "PST");
        TKAssertExactEquals(zone._localTimeTypes[3].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[3].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[3].abbr, "PWT");
        TKAssertExactEquals(zone._localTimeTypes[4].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[4].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[4].abbr, "PPT");
        TKAssertExactEquals(zone._futureRules.standard.dst, false);
        TKAssertExactEquals(zone._futureRules.standard.off, -28800);
        TKAssertExactEquals(zone._futureRules.standard.abbr, "PST");
        TKAssertExactEquals(zone._futureRules.daylight.dst, true);
        TKAssertExactEquals(zone._futureRules.daylight.off, -25200);
        TKAssertExactEquals(zone._futureRules.daylight.abbr, "PDT");
        TKAssertExactEquals(zone._futureRules.fromStandard.month, 3);
        TKAssertExactEquals(zone._futureRules.fromStandard.week, 2);
        TKAssertExactEquals(zone._futureRules.fromStandard.dow, 0);
        TKAssertExactEquals(zone._futureRules.fromStandard.time, 7200);
        TKAssertExactEquals(zone._futureRules.toStandard.month, 11);
        TKAssertExactEquals(zone._futureRules.toStandard.week, 1);
        TKAssertExactEquals(zone._futureRules.toStandard.dow, 0);
        TKAssertExactEquals(zone._futureRules.toStandard.time, 7200);

        // shortened jskit format (doesn't include v1 header+data)
        tzif = "VFppZmoAAAAAAAAAAAAAAAAAAAAAAAAFAAAABQAAAAAAAAC6AAAABQAAABT/////XgQawP////+epkig/////5+7FZD/////oIYqoP////+hmveQ/////8uJGqD/////0iP0cP/////SYSYQ/////9b+dFz/////2ICtkP/////a/sOQ/////9vAkBD/////3N6lkP/////dqayQ/////96+h5D/////34mOkP/////gnmmQ/////+FpcJD/////4n5LkP/////jSVKQ/////+ReLZD/////5Sk0kP/////mR0oQ/////+cSURD/////6CcsEP/////o8jMQ/////+oHDhD/////6tIVEP/////r5vAQ/////+yx9xD/////7cbSEP/////ukdkQ/////++v7pD/////8HG7EP/////xj9CQ//////J/wZD/////82+ykP/////0X6OQ//////VPlJD/////9j+FkP/////3L3aQ//////goohD/////+Q9YkP/////6CIQQ//////r4gyD/////++hmEP/////82GUg//////3ISBD//////rhHIP//////qCoQAAAAAACYKSAAAAAAAYgMEAAAAAACeAsgAAAAAANxKJAAAAAABGEnoAAAAAAFUQqQAAAAAAZBCaAAAAAABzDskAAAAAAHjUOgAAAAAAkQzpAAAAAACa2/IAAAAAAK8LCQAAAAAAvgr6AAAAAADNnNEAAAAAANwJGgAAAAAA65rxAAAAAAD6muIAAAAAAQmZEQAAAAABGJkCAAAAAAEnlzEAAAAAATaXIgAAAAABRZVRAAAAAAFUlUIAAAAAAWOTcQAAAAABcpNiAAAAAAGCJTkAAAAAAZCRggAAAAABoCNZAAAAAAGvI0oAAAAAAb4heQAAAAABzSFqAAAAAAHcH5kAAAAAAesfigAAAAAB+h25AAAAAAIHYrIAAAAAAhgb2QAAAAACJWDSAAAAAAI2raEAAAAAAkNe8gAAAAACVKvBAAAAAAJhXRIAAAAAAnKp4QAAAAACf+7aAAAAAAKQqAEAAAAAAp3s+gAAAAACrqYhAAAAAAK76xoAAAAAAs036QAAAAAC2ek6AAAAAALrNgkAAAAAAvfnWgAAAAADCTQpAAAAAAMWeSIAAAAAAycySQAAAAADNHdCAAAAAANFMGkAAAAAA1J1YgAAAAADYy6JAAAAAANwc4IAAAAAA4HAUQAAAAADjnGiAAAAAAOfvnEAAAAAA6xvwgAAAAADvbyRAAAAAAPLAYoAAAAAA9u6sQAAAAAD6P+qAAAAAAP5uNEAAAAABAb9ygAAAAAEGEqZAAAAAAQk++oAAAAABDZIuQAAAAAEQvoKAAAAAARURtkAAAAABF89MgAAAAAEctihAAAAAAR9O1IAAAAABJDWwQAAAAAEmzlyAAAAAASu1OEAAAAABLnLOgAAAAAEzWapAAAAAATXyVoAAAAABOtkyQAAAAAE9cd6AAAAAAUJYukAAAAABRPFmgAAAAAFJ2EJAAAAAAUxw7oAAAAABUVfKQAAAAAFT8HaAAAAAAVjXUkAAAAABW5TogAAAAAFge8RAAAAAAWMUcIAAAAABZ/tMQAAAAAFqk/iAAAAAAW961EAAAAABchOAgAAAAAF2+lxAAAAAAXmTCIAAAAABfnnkQAAAAAGBN3qAAAAAAYYeVkAAAAABiLcCgAAAAAGNnd5AAAAAAZA2ioAAAAABlR1mQAAAAAGXthKAAAAAAZyc7kAAAAABnzWagAAAAAGkHHZAAAAAAaa1IoAAAAABq5v+QAAAAAGuWZSAAAAAAbNAcEAAAAABtdkcgAAAAAG6v/hAAAAAAb1YpIAAAAABwj+AQAAAAAHE2CyAAAAAAcm/CEAAAAABzFe0gAAAAAHRPpBAAAAAAdP8JoAAAAAB2OMCQAAAAAHbe66AAAAAAeBiikAAAAAB4vs2gAAAAAHn4hJAAAAAAep6voAAAAAB72GaQAAAAAHx+kaAAAAAAfbhIkAAAAAB+XnOgAAAAAH+YKpACAQIBAgMEAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQIBAgECAQL//5EmAAD//52QAQT//4+AAAj//52QAQz//52QARBMTVQAUERUAFBTVABQV1QAUFBUAAAAAAABAAAAAAEKUFNUOFBEVCxNMy4yLjAsTTExLjEuMAo=";
        zone = JSTimeZone.initWithData(tzif.dataByDecodingBase64(), "America/Los_Angeles");
        TKAssertNotNull(zone);
        TKAssertExactEquals(zone.identifier, "America/Los_Angeles");
        TKAssertExactEquals(zone._transitionTimes.length, 186);
        TKAssertExactEquals(zone._transitionTimes[0], -2717640000);
        TKAssertExactEquals(zone._transitionTimes[1], -1633269600);
        TKAssertExactEquals(zone._transitionTimes[185], 2140678800);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes.length, 186);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[0], 2);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[1], 1);
        TKAssertExactEquals(zone._transitionTimesToLocalTimeTypes[185], 2);
        TKAssertExactEquals(zone._localTimeTypes.length, 5);
        TKAssertExactEquals(zone._localTimeTypes[0].dst, false);
        TKAssertExactEquals(zone._localTimeTypes[0].off, -28378);
        TKAssertExactEquals(zone._localTimeTypes[0].abbr, "LMT");
        TKAssertExactEquals(zone._localTimeTypes[1].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[1].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[1].abbr, "PDT");
        TKAssertExactEquals(zone._localTimeTypes[2].dst, false);
        TKAssertExactEquals(zone._localTimeTypes[2].off, -28800);
        TKAssertExactEquals(zone._localTimeTypes[2].abbr, "PST");
        TKAssertExactEquals(zone._localTimeTypes[3].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[3].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[3].abbr, "PWT");
        TKAssertExactEquals(zone._localTimeTypes[4].dst, true);
        TKAssertExactEquals(zone._localTimeTypes[4].off, -25200);
        TKAssertExactEquals(zone._localTimeTypes[4].abbr, "PPT");
        TKAssertExactEquals(zone._futureRules.standard.dst, false);
        TKAssertExactEquals(zone._futureRules.standard.off, -28800);
        TKAssertExactEquals(zone._futureRules.standard.abbr, "PST");
        TKAssertExactEquals(zone._futureRules.daylight.dst, true);
        TKAssertExactEquals(zone._futureRules.daylight.off, -25200);
        TKAssertExactEquals(zone._futureRules.daylight.abbr, "PDT");
        TKAssertExactEquals(zone._futureRules.fromStandard.month, 3);
        TKAssertExactEquals(zone._futureRules.fromStandard.week, 2);
        TKAssertExactEquals(zone._futureRules.fromStandard.dow, 0);
        TKAssertExactEquals(zone._futureRules.fromStandard.time, 7200);
        TKAssertExactEquals(zone._futureRules.toStandard.month, 11);
        TKAssertExactEquals(zone._futureRules.toStandard.week, 1);
        TKAssertExactEquals(zone._futureRules.toStandard.dow, 0);
        TKAssertExactEquals(zone._futureRules.toStandard.time, 7200);
    },

    testNotifications: function(){
        var notificationCenter = JSNotificationCenter.init();
        var changes = [];
        notificationCenter.addObserver("JSLocalTimeZoneChanged", null, function(){
            changes.push(JSTimeZone.local.identifier);
        });
        JSTimeZone.changeLocalTimeZone("America/Los_Angeles");
        JSTimeZone.changeLocalTimeZone("UTC");
        TKAssertExactEquals(changes.length, 0);
        JSTimeZone.startSendingNotifications(notificationCenter);
        TKAssertExactEquals(changes.length, 0);
        JSTimeZone.changeLocalTimeZone("UTC");
        TKAssertExactEquals(changes.length, 0);
        JSTimeZone.changeLocalTimeZone("America/Los_Angeles");
        TKAssertExactEquals(changes.length, 1);
        TKAssertExactEquals(changes[0], "America/Los_Angeles");
        JSTimeZone.changeLocalTimeZone("UTC");
        TKAssertExactEquals(changes.length, 2);
        TKAssertExactEquals(changes[1], "UTC");
        JSTimeZone.stopSendingNotifications(notificationCenter);
        JSTimeZone.changeLocalTimeZone("America/Los_Angeles");
        TKAssertExactEquals(changes.length, 2);
    },

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