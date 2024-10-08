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

JSClass("JSLocaleTests", TKTestSuite, {

    setup: function(){
        this.originalPreferredLanguages = JSLocale.preferredLanguages;
    },

    teardown: function(){
        JSLocale.preferredLanguages = this.originalPreferredLanguages;
        JSLocale.ClearCache();
    },

    testInitWithIdentifier: function(){
        // language only
        JSLocale.ClearCache();
        var locale = JSLocale.initWithIdentifier("en");
        TKAssertEquals(locale.identifier, "en");
        TKAssertEquals(locale.identifierWithoutExtensions, "en");
        TKAssertEquals(locale.languageCode, "en");
        TKAssertNull(locale.scriptCode);
        TKAssertNull(locale.regionCode);
        TKAssertEquals(locale.extensions.length, 0);

        // language + script
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("zn-Hans");
        TKAssertEquals(locale.identifier, "zn-Hans");
        TKAssertEquals(locale.identifierWithoutExtensions, "zn-Hans");
        TKAssertEquals(locale.languageCode, "zn");
        TKAssertEquals(locale.scriptCode, "Hans");
        TKAssertNull(locale.regionCode);
        TKAssertEquals(locale.extensions.length, 0);

        // language + region
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("de-DE");
        TKAssertEquals(locale.identifier, "de-DE");
        TKAssertEquals(locale.identifierWithoutExtensions, "de-DE");
        TKAssertEquals(locale.languageCode, "de");
        TKAssertNull(locale.scriptCode);
        TKAssertEquals(locale.regionCode, "DE");
        TKAssertEquals(locale.extensions.length, 0);

        // language + script + region
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("zn-Hans-CN");
        TKAssertEquals(locale.identifier, "zn-Hans-CN");
        TKAssertEquals(locale.identifierWithoutExtensions, "zn-Hans-CN");
        TKAssertEquals(locale.languageCode, "zn");
        TKAssertEquals(locale.scriptCode, "Hans");
        TKAssertEquals(locale.regionCode, "CN");
        TKAssertEquals(locale.extensions.length, 0);

        // language + extensions
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("en-u-test1-test2");
        TKAssertEquals(locale.identifier, "en-u-test1-test2");
        TKAssertEquals(locale.identifierWithoutExtensions, "en");
        TKAssertEquals(locale.languageCode, "en");
        TKAssertNull(locale.scriptCode);
        TKAssertNull(locale.regionCode);
        TKAssertEquals(locale.extensions.length, 2);
        TKAssertEquals(locale.extensions[0], "test1");
        TKAssertEquals(locale.extensions[1], "test2");

        // language + script + extension
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("zn-Hans-u-test1-test2");
        TKAssertEquals(locale.identifier, "zn-Hans-u-test1-test2");
        TKAssertEquals(locale.identifierWithoutExtensions, "zn-Hans");
        TKAssertEquals(locale.languageCode, "zn");
        TKAssertEquals(locale.scriptCode, "Hans");
        TKAssertNull(locale.regionCode);
        TKAssertEquals(locale.extensions.length, 2);
        TKAssertEquals(locale.extensions[0], "test1");
        TKAssertEquals(locale.extensions[1], "test2");

        // language + region + extensions
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("de-DE-u-test1-test2");
        TKAssertEquals(locale.identifier, "de-DE-u-test1-test2");
        TKAssertEquals(locale.identifierWithoutExtensions, "de-DE");
        TKAssertEquals(locale.languageCode, "de");
        TKAssertNull(locale.scriptCode);
        TKAssertEquals(locale.regionCode, "DE");
        TKAssertEquals(locale.extensions.length, 2);
        TKAssertEquals(locale.extensions[0], "test1");
        TKAssertEquals(locale.extensions[1], "test2");

        // language + script + region + extensions
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("zn-Hans-CN-u-test1-test2");
        TKAssertEquals(locale.identifier, "zn-Hans-CN-u-test1-test2");
        TKAssertEquals(locale.identifierWithoutExtensions, "zn-Hans-CN");
        TKAssertEquals(locale.languageCode, "zn");
        TKAssertEquals(locale.scriptCode, "Hans");
        TKAssertEquals(locale.regionCode, "CN");
        TKAssertEquals(locale.extensions.length, 2);
        TKAssertEquals(locale.extensions[0], "test1");
        TKAssertEquals(locale.extensions[1], "test2");

        // normalization
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("en_US");
        TKAssertEquals(locale.identifier, "en-US");
        locale = JSLocale.initWithIdentifier("EN_us");
        TKAssertEquals(locale.identifier, "en-US");
        locale = JSLocale.initWithIdentifier("zN-HANS_cn");
        TKAssertEquals(locale.identifier, "zn-Hans-CN");

        // bad language
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier(null);
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("");
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("abc");
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("abc-US");
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("-US");
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("abc-Hans-CN");
        TKAssertNull(locale);

        // bad region
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("en-USA");
        TKAssertNull(locale);
        locale = JSLocale.initWithIdentifier("en-Hans-USA");
        TKAssertNull(locale);

        // bad script
        JSLocale.ClearCache();
        locale = JSLocale.initWithIdentifier("zn-Testing-CN");
        TKAssertNull(locale);
    },

    testInitCache: function(){
        var locale1 = JSLocale.initWithIdentifier('en');
        var locale2 = JSLocale.initWithIdentifier('en-US');
        TKAssertNotExactEquals(locale1, locale2);

        locale2 = JSLocale.initWithIdentifier('en');
        TKAssertExactEquals(locale1, locale2);

        locale2 = JSLocale.initWithIdentifier('EN');
        TKAssertExactEquals(locale1, locale2);
    },

    testIsLessSpecificThan: function(){
        var locale1 = JSLocale.initWithIdentifier('en');
        var locale2 = JSLocale.initWithIdentifier('en-US');
        var locale3 = JSLocale.initWithIdentifier('en-GB');
        var locale4 = JSLocale.initWithIdentifier('en-Test-GB');
        var locale5 = JSLocale.initWithIdentifier('en-Scri-GB');

        TKAssert(!locale1.isLessSpecificThan(locale1));
        TKAssert(locale1.isLessSpecificThan(locale2));
        TKAssert(locale1.isLessSpecificThan(locale3));
        TKAssert(locale1.isLessSpecificThan(locale4));
        TKAssert(locale1.isLessSpecificThan(locale5));

        TKAssert(!locale2.isLessSpecificThan(locale2));
        TKAssert(!locale2.isLessSpecificThan(locale3));
        TKAssert(locale2.isLessSpecificThan(locale4));
        TKAssert(locale2.isLessSpecificThan(locale5));

        TKAssert(!locale4.isLessSpecificThan(locale4));
        TKAssert(!locale4.isLessSpecificThan(locale5));
    },

    testNumberFormattingOptionsNoData: function(){
        var locale = JSLocale.initWithIdentifier("en-US");
        TKAssertEquals(locale.decimalSeparator, ".");
        TKAssertEquals(locale.groupingSeparator, ",");
        TKAssertEquals(locale.decimalNumberFormat, "#,##0.###");
        TKAssertEquals(locale.percentNumberFormat, "#,##0%");
        TKAssertEquals(locale.currencyNumberFormat, "¤#,##0.00");
        TKAssertEquals(locale.accountingNumberFormat, "¤#,##0.00;(¤#,##0.00)");

        // Node built with small-icu doesn't have any locale but en-US
        if (JSGlobalObject.window === JSGlobalObject){
            locale = JSLocale.initWithIdentifier("de-DE");
            TKAssertEquals(locale.decimalSeparator, ",");
            TKAssertEquals(locale.groupingSeparator, ".");
            TKAssertEquals(locale.decimalNumberFormat, "#,##0.###");
            TKAssertEquals(locale.percentNumberFormat, "#,##0\u00a0%");
            TKAssertEquals(locale.currencyNumberFormat, "#,##0.00\u00a0¤");
            TKAssertEquals(locale.accountingNumberFormat, "#,##0.00\u00a0¤;-#,##0.00\u00a0¤");
        }
    },

    testDateFormattingOptionsNoData: function(){
        var locale = JSLocale.initWithIdentifier("en-US");
        TKAssertEquals(locale.shortDateFormat, "M/d/yy");
        TKAssertEquals(locale.mediumDateFormat, "MMM d, y");
        TKAssertEquals(locale.longDateFormat, "MMMM d, y");
        TKAssertEquals(locale.fullDateFormat, "EEEE, MMMM d, y");
        TKAssertEquals(locale.shortTimeFormat, "h:mm a");
        TKAssertEquals(locale.mediumTimeFormat, "h:mm:ss a");
        TKAssertEquals(locale.longTimeFormat, "h:mm:ss a z");
        TKAssertEquals(locale.fullTimeFormat, "h:mm:ss a zzzz");
        TKAssertEquals(locale.shortDateTimeFormat, "{1}, {0}");
        // inconsistent browser behavior with medium date+time format
        // TKAssertEquals(locale.mediumDateTimeFormat, "{1}, {0}");
        TKAssertEquals(locale.longDateTimeFormat, "{1} 'at' {0}");
        TKAssertEquals(locale.fullDateTimeFormat, "{1} 'at' {0}");
        TKAssertEquals(locale.dateFormatForTemplate("yMEd"), "EEE, M/d/y");
        TKAssertEquals(locale.dateFormatForTemplate("yyyyMd"), "M/d/y");
        TKAssertEquals(locale.dateFormatForTemplate("yMd"), "M/d/y");
        TKAssertEquals(locale.dateFormatForTemplate("yMMMd"), "MMM d, y");
        TKAssertEquals(locale.dateFormatForTemplate("yMMMMd"), "MMMM d, y");
        TKAssertEquals(locale.dateFormatForTemplate("yM"), "M/y");
        TKAssertEquals(locale.dateFormatForTemplate("yMMM"), "MMM y");
        TKAssertEquals(locale.dateFormatForTemplate("yMMMM"), "MMMM y");
        TKAssertEquals(locale.dateFormatForTemplate("Md"), "M/d");
        TKAssertEquals(locale.dateFormatForTemplate("MMMd"), "MMM d");
        TKAssertEquals(locale.dateFormatForTemplate("MMMMd"), "MMMM d");
        TKAssertEquals(locale.dateFormatForTemplate("hms"), "h:mm:ss a");
        TKAssertEquals(locale.dateFormatForTemplate("hm"), "h:mm a");
        TKAssertEquals(locale.dateFormatForTemplate("Hms"), "HH:mm:ss");
        TKAssertEquals(locale.dateFormatForTemplate("Hm"), "HH:mm");

        // Node built with small-icu doesn't have any locale but en-US
        if (JSGlobalObject.window === JSGlobalObject){
            locale = JSLocale.initWithIdentifier("de-DE");
            TKAssertEquals(locale.shortDateFormat, "dd.MM.yy");
            TKAssertEquals(locale.mediumDateFormat, "dd.MM.y");
            TKAssertEquals(locale.longDateFormat, "d. MMMM y");
            TKAssertEquals(locale.fullDateFormat, "EEEE, d. MMMM y");
            TKAssertEquals(locale.shortTimeFormat, "HH:mm");
            TKAssertEquals(locale.mediumTimeFormat, "HH:mm:ss");
            TKAssertEquals(locale.shortDateTimeFormat, "{1}, {0}");
            TKAssertEquals(locale.mediumDateTimeFormat, "{1}, {0}");
            TKAssertEquals(locale.longDateTimeFormat, "{1} 'um' {0}");
            TKAssertEquals(locale.fullDateTimeFormat, "{1} 'um' {0}");
            // browsers seem to use zzzz in the long format, but that doesn't
            // match unicode data....
            // TKAssertEquals(locale.longTimeFormat, "HH:mm:ss z");
            TKAssertEquals(locale.fullTimeFormat, "HH:mm:ss zzzz");
            // Inconsistent implementations across browsers
            // TKAssertEquals(locale.dateFormatForTemplate("yMEd"), "EEEE, d.M.y");
            TKAssertEquals(locale.dateFormatForTemplate("yyyyMd"), "d.M.y");
            TKAssertEquals(locale.dateFormatForTemplate("yMd"), "d.M.y");
            // Inconsistent implementations across browsers
            // TKAssertEquals(locale.dateFormatForTemplate("yMMMd"), "d. MMM y");
            TKAssertEquals(locale.dateFormatForTemplate("yMMMMd"), "d. MMMM y");
            // Inconsistent implementations across browsers
            // TKAssertEquals(locale.dateFormatForTemplate("yM"), "M.y");
            // Inconsistent implementations across browsers
            // TKAssertEquals(locale.dateFormatForTemplate("yMMM"), "MMM y");
            TKAssertEquals(locale.dateFormatForTemplate("yMMMM"), "MMMM y");
            TKAssertEquals(locale.dateFormatForTemplate("Md"), "d.M.");
            // Inconsistent implementations across browsers
            // TKAssertEquals(locale.dateFormatForTemplate("MMMd"), "d. MMM");
            TKAssertEquals(locale.dateFormatForTemplate("MMMMd"), "d. MMMM");
            TKAssertEquals(locale.dateFormatForTemplate("hms"), "HH:mm:ss");
            TKAssertEquals(locale.dateFormatForTemplate("hm"), "HH:mm");
            TKAssertEquals(locale.dateFormatForTemplate("Hms"), "HH:mm:ss");
            TKAssertEquals(locale.dateFormatForTemplate("Hm"), "HH:mm");
        }
    }

});