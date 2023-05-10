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
// #import "JSCalendar.js"
/* global Intl */
'use strict';

(function(){

var logger = JSLog("foundation", "locale");

JSClass("JSLocale", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', null),
    identifierWithoutExtensions: JSReadOnlyProperty('_identifierWithoutExtension', null),
    languageCode: JSReadOnlyProperty('_languageCode', null),
    regionCode: JSReadOnlyProperty('_regionCode', null),
    scriptCode: JSReadOnlyProperty('_scriptCode', null),
    extensions: JSReadOnlyProperty('_extensions', null),
    _data: null,

    initWithIdentifier: function(identifier){
        if (identifier === null){
            return null;
        }
        if (identifier in JSLocale._localesByIdentifier){
            return JSLocale._localesByIdentifier[identifier];
        }
        identifier = identifier.replace(/_/g, '-');
        var parts = identifier.split('-');
        this._languageCode = parts[0].toLowerCase();
        this._extensions = [];

        var part = parts.shift();
        if (part.length != 2){
            return null;
        }
        this._languageCode = part.toLowerCase();

        var allowed = {
            script: true,
            region: true,
            extensions: true
        };

        while (parts.length > 0){
            part = parts.shift();
            if (part.length == 1 && allowed.extensions){
                if (part == 'u'){
                    this._extensions = parts;
                    parts = [];
                }else{
                    return null;
                }
                allowed.extensions = false;
                allowed.region = false;
                allowed.script = false;
            }else if (part.length == 2 && allowed.region){
                this._regionCode = part.toUpperCase();
                allowed.script = false;
                allowed.region = false;
            }else if (part.length == 4 && allowed.script){
                this._scriptCode = part.toLowerCase().capitalizedString();
                allowed.script = false;
            }else{
                return null;
            }
        }

        this._identifierWithoutExtension = this._languageCode;
        if (this.scriptCode !== null){
            this._identifierWithoutExtension += '-' + this.scriptCode;
        }
        if (this.regionCode !== null){
            this._identifierWithoutExtension += '-' + this.regionCode;
        }
        this._identifier = this._identifierWithoutExtension;
        if (this._extensions.length > 0){
            this._identifier += '-u-' + this._extensions.join('-');
        }
        if (this._identifier in JSLocale._localesByIdentifier){
            return JSLocale._localesByIdentifier[this._identifier];
        }
        var id = this._languageCode;
        if (id in JSLocale.data){
            this._data = {};
            overwrite(this._data, JSLocale.data[id]);
        }
        if (this.scriptCode !== null){
            id += "-" + this.scriptCode;
        }
        if (id in JSLocale.data){
            this._data = this._data || {};
            overwrite(this._data, JSLocale.data[id]);
        }
        if (this.regionCode !== null){
            id += "-" + this.regionCode;
        }
        if (id in JSLocale.data){
            this._data = this._data || {};
            overwrite(this._data, JSLocale.data[id]);
        }
        this._determineNumericFormattingOptions();
        this._determineDateFormattingOptions();
        JSLocale._localesByIdentifier[this._identifier] = this;
    },

    isLessSpecificThan: function(other){
        if (other.regionCode !== null && this.regionCode === null){
            return true;
        }
        if (other.scriptCode !== null && this.scriptCode === null){
            return true;
        }
        return false;
    },

    // ----------------------------------------------------------------------
    // MARK: - Number Formatting

    decimalSeparator: JSReadOnlyProperty('_decimalSeparator', '.'),
    groupingSeparator: JSReadOnlyProperty('_groupingSeparator', ','),
    percentSymbol: JSReadOnlyProperty("_percentSymbol", '%'),
    perMilleSymbol: JSReadOnlyProperty("_perMilleSymbol", '‰'),
    minusSign: JSReadOnlyProperty("_minusSign", '-'),
    plusSign: JSReadOnlyProperty("_plusSign", '+'),
    zeroSymbol: JSReadOnlyProperty("_zeroSymbol", null),
    notANumberSymbol: JSReadOnlyProperty("_notANumberSymbol", 'NaN'),
    nullSymbol: JSReadOnlyProperty("_nullSymbol", ''),
    positiveInfinitySymbol: JSReadOnlyProperty("_positiveInfinitySymbol", '+∞'),
    negativeInfinitySymbol: JSReadOnlyProperty("_negativeInfinitySymbol", '-∞'),

    decimalNumberFormat: JSReadOnlyProperty("_decimalNumberFormat", "#,##0.###"),
    percentNumberFormat: JSReadOnlyProperty("_percentNumberFormat", "#,##0%"),
    currencyNumberFormat: JSReadOnlyProperty("_currencyNumberFormat", "¤#,##0.00"),
    accountingNumberFormat: JSReadOnlyProperty("_accountingNumberFormat", "¤#,##0.00;(¤#,##0.00)"),

    _determineNumericFormattingOptions: function(){
        if (this._identifier === "en-US"){
            return;
        }
        if (this._determineNumericFormattingOptionsFromData()){
            return;
        }
        this._determineNumericFormattingOptionsFromIntl();
    },

    _determineNumericFormattingOptionsFromData: function(){
        if (this._data === null){
            return false;
        }
        var symbols = this._data.numbers.symbols;
        var formats = this._data.numbers.formats;
        if (symbols.decimal !== undefined){
            this._decimalSeparator = symbols.decimal;
        }
        if (symbols.group !== undefined){
            this._groupingSeparator = symbols.group;
        }
        if (symbols.percent !== undefined){
            this._percentSymbol = symbols.percent;
        }
        if (symbols.perMille !== undefined){
            this._perMilleSymbol = symbols.perMille;
        }
        if (symbols.plus !== undefined){
            this._plusSign = symbols.plus;
        }
        if (symbols.minus !== undefined){
            this._minusSign = symbols.minus;
        }
        if (symbols.nan !== undefined){
            this._notANumberSymbol = symbols.nan;
        }
        if (symbols.infinity !== undefined){
            this._positiveInfinitySymbol = this._plusSign + symbols.infinity;
            this._negativeInfinitySymbol = this._minusSign + symbols.infinity;
        }
        if (formats.decimal !== undefined){
            this._decimalNumberFormat = formats.decimal;
        }
        if (formats.percent !== undefined){
            this._percentNumberFormat = formats.percent;
        }
        if (formats.currency !== undefined){
            this._currencyNumberFormat = formats.currency;
        }
        if (formats.accounting !== undefined){
            this._accountingNumberFormat = formats.accounting;
        }
        return true;
    },

    _determineNumericFormattingOptionsFromIntl: function(){
        if (!JSGlobalObject.Intl){
            return false;
        }
        function repeat(c, n){
            var str = "";
            for (var i = 0; i < n; ++i){
                str += c;
            }
            return str;
        }
        try{
            // Decimal format
            var formatter = new Intl.NumberFormat(this._identifier, {
                signDisplay: "always"
            });
            this._decimalNumberFormat = formatter.unciodeFormatString;
            var parts = formatter.formatToParts(1234567890.1234567);
            var part;
            var i, l;
            this._usesGroupingSeparator = false;
            var groupSize = 0;
            var secondaryGroupSize = 0;
            var decimalFormat = "";
            var fractionSize = 0;
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type === "plusSign"){
                    this._plusSign = part.value;
                }else if (part.type === "group"){
                    this._usesGroupingSeparator = true;
                    this._groupingSeparator = part.value;
                }else if (part.type === "integer"){
                    if (this._usesGroupingSeparator){
                        if (part.value.length != groupSize){
                            secondaryGroupSize = groupSize;
                            groupSize = part.value.length;   
                        }
                    }
                }else if (part.type === "decimal"){
                    this._decimalSeparator = part.value;
                }else if (part.type === "fraction"){
                    fractionSize = part.value.length;
                }
            }
            var integerFormat = "";
            if (this._usesGroupingSeparator){
                if (secondaryGroupSize > 0){
                    integerFormat = repeat("#", secondaryGroupSize) + "," + repeat("#", groupSize - 1) + "0";
                }else{
                    integerFormat = "#," + repeat("#", groupSize - 1) + "0";
                }
            }else{
                integerFormat = "#0";
            }
            if (fractionSize > 0){
                this._decimalNumberFormat = integerFormat + "." + repeat("#", fractionSize);
            }else{
                this._decimalNumberFormat = integerFormat;
            }

            // Percent format
            formatter = new Intl.NumberFormat(this._identifier, {
                signDisplay: "always",
                style: "percent",
                useGrouping: false
            });
            parts = formatter.formatToParts(-1.1234567);
            this._percentNumberFormat = "";
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type == "minusSign"){
                    this._minusSign = part.value;
                }else if (part.type === "integer"){
                    this._percentNumberFormat += integerFormat;
                }else if (part.type === "literal"){
                    this._percentNumberFormat += part.value;
                }else if (part.type === "decimal"){
                    this._percentNumberFormat += ".";
                }else if (part.type === "fraction"){
                    this._percentNumberFormat += repeat("#", part.value.length);
                }else if (part.type === "percentSign"){
                    this._percentSymbol = part.value;
                    this._percentNumberFormat += "%";
                }
            }

            // currency format
            formatter = new Intl.NumberFormat(this._identifier, {
                style: "currency",
                currency: "USD",
                useGrouping: false
            });
            parts = formatter.formatToParts(1.1);
            this._currencyNumberFormat = "";
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type == "minusSign"){
                    this._minusSign = part.value;
                }else if (part.type === "integer"){
                    this._currencyNumberFormat += integerFormat;
                }else if (part.type === "literal"){
                    this._currencyNumberFormat += part.value;
                }else if (part.type === "decimal"){
                    this._currencyNumberFormat += ".";
                }else if (part.type === "fraction"){
                    this._currencyNumberFormat += repeat("0", part.value.length);
                }else if (part.type === "currency"){
                    this._percentSymbol = part.value;
                    this._currencyNumberFormat += "¤";
                }
            }

            // accounting format
            formatter = new Intl.NumberFormat(this._identifier, {
                style: "currency",
                currency: "USD",
                currencySign: "accounting",
                useGrouping: false
            });
            parts = formatter.formatToParts(1.1);
            this._accountingNumberFormat = "";
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type == "minusSign"){
                    this._accountingNumberFormat += "-";
                }else if (part.type === "integer"){
                    this._accountingNumberFormat += integerFormat;
                }else if (part.type === "literal"){
                    this._accountingNumberFormat += part.value;
                }else if (part.type === "decimal"){
                    this._accountingNumberFormat += ".";
                }else if (part.type === "fraction"){
                    this._accountingNumberFormat += repeat("0", part.value.length);
                }else if (part.type === "currency"){
                    this._percentSymbol = part.value;
                    this._accountingNumberFormat += "¤";
                }
            }
            parts = formatter.formatToParts(-1.1);
            this._accountingNumberFormat += ";";
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type == "minusSign"){
                    this._accountingNumberFormat += "-";
                }else if (part.type === "integer"){
                    this._accountingNumberFormat += integerFormat;
                }else if (part.type === "literal"){
                    this._accountingNumberFormat += part.value;
                }else if (part.type === "decimal"){
                    this._accountingNumberFormat += ".";
                }else if (part.type === "fraction"){
                    this._accountingNumberFormat += repeat("0", part.value.length);
                }else if (part.type === "currency"){
                    this._percentSymbol = part.value;
                    this._accountingNumberFormat += "¤";
                }
            }
            return true;
        }catch (e){
            return false;
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Date Formatting

    calendarIdentifier: JSReadOnlyProperty('_calendarIdentifier', JSCalendar.Identifier.gregorian),

    dateFormatForTemplate: function(template){
        return this._dateFormatsByTemplate[template] || null;
    },

    shortDateFormat: JSReadOnlyProperty("_shortDateFormat", "M/d/yy"),
    mediumDateFormat: JSReadOnlyProperty("_mediumDateFormat", "MMM d, y"),
    longDateFormat: JSReadOnlyProperty("_longDateFormat", "MMMM d, y"),
    fullDateFormat: JSReadOnlyProperty("_fullDateFormat", "EEEE, MMMM d, y"),

    shortTimeFormat: JSReadOnlyProperty("_shortTimeFormat", "h:mm a"),
    mediumTimeFormat: JSReadOnlyProperty("_mediumTimeFormat", "h:mm:ss a"),
    longTimeFormat: JSReadOnlyProperty("_longTimeFormat", "h:mm:ss a z"),
    fullTimeFormat: JSReadOnlyProperty("_fullTimeFormat", "h:mm:ss a zzzz"),

    shortDateTimeFormat: JSReadOnlyProperty("_shortDateTimeFormat", "{1}, {0}"),
    mediumDateTimeFormat: JSReadOnlyProperty("_mediumDateTimeFormat", "{1}, {0}"),
    longDateTimeFormat: JSReadOnlyProperty("_longDateTimeFormat", "{1} 'at' {0}"),
    fullDateTimeFormat: JSReadOnlyProperty("_fullDateTimeFormat", "{1} 'at' {0}"),

    _dateFormatsByTemplate: null,

    _determineDateFormattingOptions: function(){
        this._dateFormatsByTemplate = {};
        if (this._identifier === "en-US"){
            this._dateFormatsByTemplate.yMEd = "EEE, M/d/y";
            this._dateFormatsByTemplate.yyyyMd = "M/d/y";
            this._dateFormatsByTemplate.yMd = "M/d/y";
            this._dateFormatsByTemplate.yMMMd = "MMM d, y";
            this._dateFormatsByTemplate.yMMMMd = "MMMM d, y";
            this._dateFormatsByTemplate.yM = "M/y";
            this._dateFormatsByTemplate.yMMM = "MMM y";
            this._dateFormatsByTemplate.yMMMM = "MMMM y";
            this._dateFormatsByTemplate.Md = "M/d";
            this._dateFormatsByTemplate.MMMd = "MMM d";
            this._dateFormatsByTemplate.MMMMd = "MMMM d";
            this._dateFormatsByTemplate.hms = "h:mm:ss a";
            this._dateFormatsByTemplate.hm = "h:mm a";
            this._dateFormatsByTemplate.Hms = "HH:mm:ss";
            this._dateFormatsByTemplate.Hm = "HH:mm";
            return;
        }
        if (this._determineDateFormattingOptionsFromData()){
            return;
        }
        this._determineDateFormattingOptionsFromIntl();
    },

    _determineDateFormattingOptionsFromData: function(){
        if (this._data === null){
            return false;
        }
        var calendar = this._data.calendars.gregorian;
        if (!calendar){
            return false;
        }
        if (calendar.dateFormats.short !== undefined){
            this._shortDateFormat = calendar.dateFormats.short;
        }
        if (calendar.dateFormats.medium !== undefined){
            this._mediumDateFormat = calendar.dateFormats.medium;
        }
        if (calendar.dateFormats.long !== undefined){
            this._longDateFormat = calendar.dateFormats.long;
        }
        if (calendar.dateFormats.full !== undefined){
            this._fullDateFormat = calendar.dateFormats.full;
        }
        if (calendar.timeFormats.short !== undefined){
            this._shortTimeFormat = calendar.timeFormats.short;
        }
        if (calendar.timeFormats.medium !== undefined){
            this._mediumTimeFormat = calendar.timeFormats.medium;
        }
        if (calendar.timeFormats.long !== undefined){
            this._longTimeFormat = calendar.timeFormats.long;
        }
        if (calendar.timeFormats.full !== undefined){
            this._fullTimeFormat = calendar.timeFormats.full;
        }
        if (calendar.dateTimeFormats.short !== undefined){
            this._shortDateTimeFormat = calendar.dateTimeFormats.short;
        }
        if (calendar.dateTimeFormats.medium !== undefined){
            this._mediumDateTimeFormat = calendar.dateTimeFormats.medium;
        }
        if (calendar.dateTimeFormats.long !== undefined){
            this._longDateTimeFormat = calendar.dateTimeFormats.long;
        }
        if (calendar.dateTimeFormats.full !== undefined){
            this._fullDateTimeFormat = calendar.dateTimeFormats.full;
        }
        if (calendar.templates){
            this._dateFormatsByTemplate = calendar.templates;
        }
        return true;
    },

    _determineDateFormattingOptionsFromIntl: function(){
        if (!JSGlobalObject.Intl){
            return false;
        }
        var referenceDate = new Date(2021, 0, 2, 15, 45, 6);
        var shortMonthName = "";
        var narrowMonthName = "";
        var shortWeekdayName = "";
        var narrowWeekdayName = "";
        var locale = this._identifier;
        function escaped(literal){
            var escapedLiteral = "";
            var i, l, c;
            var quoting = false;
            for (i = 0, l = literal.length; i < l; ++i){
                c = literal[i];
                if (c === "'"){
                    escapedLiteral += "'";
                }else if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')){
                    if (!quoting){
                        quoting = true;
                        escapedLiteral += "'";
                    }
                }else{
                    if (quoting){
                        quoting = false;
                        escapedLiteral += "'";
                    }
                }
                escapedLiteral += c;
            }
            return escapedLiteral;
        }
        function unicodeFormatForOptions(options){
            options.calendar = "gregory";
            options.numberingSystem = "latn";
            var formatter = new Intl.DateTimeFormat(locale, options);
            var parts = formatter.formatToParts(referenceDate);
            var part;
            var i, l;
            var format = "";
            for (i = 0, l = parts.length; i < l; ++i){
                part = parts[i];
                if (part.type === "era"){
                }else if (part.type === "year"){
                    if (part.value.length == 2){
                        format += "yy";
                    }else{
                        format += "y";
                    }
                }else if (part.type === "yearName"){
                    format += "U";
                }else if (part.type === "month"){
                    if (part.value === "1"){
                        format += "M";
                    }else if (part.value == "01"){
                        format += "MM";
                    }else if (part.value === narrowMonthName){
                        format += "MMMMM";
                    }else if (part.value === shortMonthName){
                        format += "MMM";
                    }else{
                        format += "MMMM";
                    }
                }else if (part.type === "day"){
                    format += "d";
                    if (part.value.length > 1){
                        format += "d";
                    }
                }else if (part.type === "hour"){
                    if (part.value === "3"){
                        format += "h";
                    }else if (part.value === "03"){
                        format += "hh";
                    }else if (part.value == "15"){
                        format += "HH";
                    }
                }else if (part.type === "minute"){
                    format += "mm";
                }else if (part.type === "second"){
                    format += "ss";
                }else if (part.type === "fractionalSecond"){
                    format += "S";
                }else if (part.type === "dayPeriod"){
                    format += "a";
                }else if (part.type === "timeZoneName"){
                    if (part.value.length > 4){
                        format += "zzzz";
                    }else{
                        format += "z";
                    }
                }else if (part.type === "literal"){
                    format += escaped(part.value);
                }else if (part.type === "weekday"){
                    if (part.value === narrowWeekdayName){
                        format += "EEEEE";
                    }else if (part.value === shortWeekdayName){
                        format += "EEE";
                    }else{
                        format += "EEEE";
                    }
                }
            }
            return format;
        }
        try{
            shortMonthName = new Intl.DateTimeFormat(locale, {calendar: "gregory", month: "short"}).format(referenceDate);
            narrowMonthName = new Intl.DateTimeFormat(locale, {calendar: "gregory", month: "narrow"}).format(referenceDate);
            shortWeekdayName = new Intl.DateTimeFormat(locale, {calendar: "gregory", weekday: "short"}).format(referenceDate);
            narrowWeekdayName = new Intl.DateTimeFormat(locale, {calendar: "gregory", weekday: "narrow"}).format(referenceDate);
            this._shortDateFormat = unicodeFormatForOptions({dateStyle: "short"});
            this._mediumDateFormat = unicodeFormatForOptions({dateStyle: "medium"});
            this._longDateFormat = unicodeFormatForOptions({dateStyle: "long"});
            this._fullDateFormat = unicodeFormatForOptions({dateStyle: "full"});
            this._shortTimeFormat = unicodeFormatForOptions({timeStyle: "short"});
            this._mediumTimeFormat = unicodeFormatForOptions({timeStyle: "medium"});
            this._longTimeFormat = unicodeFormatForOptions({timeStyle: "long"});
            this._fullTimeFormat = unicodeFormatForOptions({timeStyle: "full"});
            this._shortDateTimeFormat = unicodeFormatForOptions({dateStyle: "short", timeStyle: "short"}).replace(this._shortDateFormat, "{1}").replace(this._shortTimeFormat, "{0}");
            this._mediumDateTimeFormat = unicodeFormatForOptions({dateStyle: "medium", timeStyle: "medium"}).replace(this._mediumDateFormat, "{1}").replace(this._mediumTimeFormat, "{0}");
            this._longDateTimeFormat = unicodeFormatForOptions({dateStyle: "long", timeStyle: "long"}).replace(this._longDateFormat, "{1}").replace(this._longTimeFormat, "{0}");
            this._fullDateTimeFormat = unicodeFormatForOptions({dateStyle: "full", timeStyle: "full"}).replace(this._fullDateFormat, "{1}").replace(this._fullTimeFormat, "{0}");
            this._dateFormatsByTemplate = {
                "yMEd": unicodeFormatForOptions({year: "numeric", month: "numeric", weekday: "short", day: "numeric"}),
                "yyyyMd": unicodeFormatForOptions({year: "numeric", month: "numeric", day: "numeric"}),
                "yMd": unicodeFormatForOptions({year: "numeric", month: "numeric", day: "numeric"}),
                "yMMMd": unicodeFormatForOptions({year: "numeric", month: "short", day: "numeric"}),
                "yMMMMd": unicodeFormatForOptions({year: "numeric", month: "long", day: "numeric"}),
                "yM": unicodeFormatForOptions({year: "numeric", month: "numeric"}),
                "yMMM": unicodeFormatForOptions({year: "numeric", month: "short"}),
                "yMMMM": unicodeFormatForOptions({year: "numeric", month: "long"}),
                "Md": unicodeFormatForOptions({month: "numeric", day: "numeric"}),
                "MMMd": unicodeFormatForOptions({month: "short", day: "numeric"}),
                "MMMMd": unicodeFormatForOptions({month: "long", day: "numeric"}),
                "hms": unicodeFormatForOptions({hour: "numeric", minute: "numeric", second: "numeric"}),
                "hm": unicodeFormatForOptions({hour: "numeric", minute: "numeric"}),
                "Hms": unicodeFormatForOptions({hour: "numeric", minute: "numeric", second: "numeric", hour12: false}),
                "Hm": unicodeFormatForOptions({hour: "numeric", minute: "numeric", hour12: false}),
            };
            return true;
        }catch (e){
            return false;
        }
    }

});

JSLocale._localesByIdentifier = {};

JSLocale.ClearCache = function(){
    JSLocale._localesByIdentifier = {};
};

JSLocale._preferredLanguages = [];
JSLocale.preferredLanguagesVersion = 1;

JSLocale.data = {};

var warnedIdentifiers = {};

Object.defineProperties(JSLocale, {

    preferredLanguages: {
        get: function JSLocale_getPreferredLanguages(){
            return JSLocale._preferredLanguages;
        },
        set: function JSLocale_setPreferredLanguages(preferredLanguages){
            JSLocale._preferredLanguages = preferredLanguages;
            ++JSLocale.preferredLanguagesVersion;
        }
    },

    current: {
        configurable: true,
        get: function JSLocale_getCurrent(){
            var preferredIdentifier = JSLocale._preferredLanguages[0];
            var locale = JSLocale.initWithIdentifier(preferredIdentifier);
            if (locale === null){
                if (!(preferredIdentifier in warnedIdentifiers)){
                    warnedIdentifiers[preferredIdentifier] = true;
                    logger.warn("Unable to create locale from identifier '%{public}'", preferredIdentifier);
                }
                locale = JSLocale.initWithIdentifier(JSBundle.mainBundle.info.JSDevelopmentLanguage);
            }
            return locale;
        }
    }

});

var overwrite = function(base, updates){
    var k, v;
    for (k in updates){
        v = updates[k];
        if (typeof(v) === "object"){
            if (!(k in base)){
                if (v instanceof Array){
                    base[k] = [];
                }else{
                    base[k] = {};   
                }
            }
            overwrite(base[k], v);
        }else{
            base[k] = v;
        }
    }
};

})();