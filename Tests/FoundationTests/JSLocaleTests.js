// #import Foundation
// #import Testkit
/* global JSClass, TKTestSuite, JSLocale */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
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
    }

});