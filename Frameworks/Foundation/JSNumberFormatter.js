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
// #import "JSLocale.js"
// #import "JSBundle.js"
'use strict';

// http://www.unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns
// Currently partially implemented:
// - Missing support for scientific/exponental representations
// - Missing support for padding
// - Missing support for significant digits

(function(){

JSClass("JSNumberFormatter", JSObject, {

    init: function(){
        this.initWithLocale(JSLocale.current);
    },

    initWithLocale: function(locale){
        this.locale = locale;
        this.positiveFormat = '#';
        this._negativePrefix = '\uFFFC-';
    },

    locale: JSDynamicProperty('_locale', null),

    setLocale: function(locale){
        this._locale = locale;
        this.groupingSeparator = locale.groupingSeparator;
        this.decimalSeparator = locale.decimalSeparator;
    },

    format: JSDynamicProperty(),

    setFormat: function(format){
        var parts = format.split(';');
        if (parts.length > 3){
            return;
        }
        this.positiveFormat = parts[0];
        this.zeroSymbol = null;
        this._negativePrefix = '\uFFFC-' + this._positivePrefix;
        this._negativeSuffix = this._positiveSuffix;
        if (parts.length === 3){
            this.zeroSymbol = parts[1];
            this.negativeFormat = parts[2];
        }else if (parts.length === 2){
            this.negativeFormat = parts[1];
        }
        this._style = JSNumberFormatter.Style.none;
    },

    getFormat: function(){
        return "%s;%s;%s".sprintf(this.positiveFormat, this.stringFromNumber(0), this.negativeFormat);
    },

    style: JSDynamicProperty('_style', 0),

    setStyle: function(style){
        if (style == this._style){
            return;
        }
        switch (style){
            case JSNumberFormatter.Style.none:
                this.format = "#";
                break;
            case JSNumberFormatter.Style.decimal:
                this.format = "#,##0.###";
                break;
            case JSNumberFormatter.Style.percent:
                this.format = "#,##0%";
                break;
            case JSNumberFormatter.Style.ordinal:
                // TODO:
                break;
            case JSNumberFormatter.Style.currency:
                this.format = "¤#,##0.00";
                break;
            case JSNumberFormatter.Style.currencyAccounting:
                this.format = "¤#,##0.00;(¤#)";
                break;
            case JSNumberFormatter.Style.currencyISOCode:
                this.format = "¤¤ #,##0.00;¤¤ -#";
                break;
        }
        this._style = style;
    },

    positiveFormat: JSDynamicProperty(),
    negativeFormat: JSDynamicProperty(),

    setPositiveFormat: function(format){
        var info = this._parseFormat(format);
        if (info.percent && info.perMilleSymbol){
            throw new Error("Invalid format, cannot be both percent and perMille");
        }
        if (info.percent && info.currency){
            throw new Error("Invalid format, cannot be both percent and currency");
        }
        if (info.perMille && info.currency){
            throw new Error("Invalid format, cannot be both perMille and currency");
        }
        this._style = info.style;
        this._positivePrefix = info.prefix;
        this._positiveSuffix = info.suffix;
        this._minimumIntegerDigits = info.mininumIntegerDigits;
        this._minimumFractionDigits = info.minimumFractionDigits;
        this._maximumFractionDigits = info.maximumFractionDigits;
        this._groupingSize = info.groupingSize;
        this._secondaryGroupingSize = info.secondaryGroupingSize;
        this._usesGroupingSeparator = info.groupingSize > 0;
        if (info.percent){
            this.multiplier = 100;
        }else if (info.perMille){
            this.multiplier = 1000;
        }
    },

    getPositiveFormat: function(){
        var prefix = this._positivePrefix.replace(/\uFFFC/g, "");
        var base = this._getBaseFormat();
        var suffix = this._positiveSuffix.replace(/\uFFFC/g, "");
        return prefix + base + suffix;
    },

    setNegativeFormat: function(format){
        // The negative format can't override the details of the number formatting,
        // but it can set a specific prefix and suffix for negative numbers
        var info = this._parseFormat(format);
        this._negativePrefix = info.prefix;
        this._negativeSuffix = info.suffix;
    },

    getNegativeFormat: function(){
        var prefix = this._negativePrefix.replace(/\uFFFC/g, "");
        var base = this._getBaseFormat();
        var suffix = this._negativeSuffix.replace(/\uFFFC/g, "");
        return prefix + base + suffix;
    },

    _getBaseFormat: function(){
        var format = "";
        var n = Math.max(this._minimumIntegerDigits, this._groupingSize + this._secondaryGroupingSize + 1);
        var i;
        for (i = 0; i < n - this._minimumIntegerDigits; ++i){
            format += "#";
        }
        for (i = 0; i < this._minimumIntegerDigits; ++i){
            format += "0";
        }
        if (this._usesGroupingSeparator){
            i = format.length - this._groupingSize;
            var parts = format.splitAtIndex(i);
            format = parts[0] + ',' + parts[1];
            var groupSize = this._secondaryGroupingSize > 0 ? this._secondaryGroupingSize : this._groupingSize;
            for (i = i - groupSize; i > 0; i -= groupSize){
                parts = format.splitAtIndex(i);
                format = parts[0] + ',' + parts[1];
            }
        }
        if (this._maximumFractionDigits > 0){
            format += ".";
            for (i = 0; i < this._minimumFractionDigits; ++i){
                format += "0";
            }
            for (; i < this._maximumFractionDigits; ++i){
                format += "#";
            }
        }
        return format;
    },

    _parseFormat: function(format){
        var i = 0;
        var l = format.length;
        var info = {
            percent: false,
            perMille: false,
            currency: false,
            currencyISO: false,
            prefix: '',
            suffix: '',
            mininumIntegerDigits: 0,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            groupingSize: 0,
            secondaryGroupingSize: 0
        };
        var state = 0;
        var numberRange = JSRange(0, 0);
        var symbol;
        var prefixSuffix;
        while (i < l){
            prefixSuffix = '';
            switch (format[i]){
                case '0':
                case '#':
                    if (state === 0){
                        state = 1;
                        numberRange.location = i;
                    }
                    // intentional fall-through
                case ',':
                case '.':
                    if (state != 1){
                        throw new Error("Invalid format, number found after suffix started");
                    }
                    numberRange.length += 1;
                    i += 1;
                    break;
                case '-':
                case '+':
                    prefixSuffix = "\uFFFC" + format[i];
                    i += 1;
                    break;
                case '%':
                    info.percent = true;
                    prefixSuffix = "\uFFFC" + format[i];
                    i += 1;
                    break;
                case '‰':
                    info.perMille = true;
                    prefixSuffix = "\uFFFC" + format[i];
                    i += 1;
                    break;
                case '¤':
                    info.currency = true;
                    if (i < l - 1 && format[i + 1] == '¤'){
                        ++i;
                        info.currencyISO = true;
                        prefixSuffix = "\uFFFC¤¤";
                    }else{
                        prefixSuffix = "\uFFFC¤";
                    }
                    i += 1;
                    break;
                case "'":
                    ++i;
                    if (i < l && format[i] == "'"){
                        prefixSuffix += "'";
                        ++i;
                    }else{
                        while (i < l){
                            while (i < l && format[i] != "'"){
                                prefixSuffix += format[i];
                                ++i;
                            }
                            ++i;
                            if (i < l && format[i] == "'"){
                                prefixSuffix += "'";
                                ++i;   
                            }else{
                                break;
                            }
                        }
                    }
                    break;
                default:
                    prefixSuffix = format[i];
                    i += 1;
                    break;
            }
            if (prefixSuffix.length > 0){
                if (state == 1){
                    state = 2;
                }
                if (state === 0){
                    info.prefix += prefixSuffix;
                }else{
                    info.suffix += prefixSuffix;
                }
            }
        }
        if (numberRange.length === 0){
            throw new Error("Invalid format, no number specified");
        }
        var number = format.substringInRange(numberRange);
        var parts = number.split('.');
        if (parts.length > 2){
            throw new Error("Invalid format, multiple decimals specified");
        }
        if (parts.length > 1){
            var fraction = parts[1];
            info.maximumFractionDigits = fraction.length;
            i = 0;
            l = fraction.length;
            while (i < l && fraction[i] == '0'){
                info.minimumFractionDigits += 1;
                ++i;
            }
        }
        var integer = parts[0];
        var groups = integer.split(',');
        if (groups.length > 1){
            if (groups.length > 2){
                info.secondaryGroupingSize = groups[groups.length - 2].length;
            }
            info.groupingSize = groups[groups.length - 1].length;
        }
        i = integer.length - 1;
        while (i >= 0 && integer[i] == '0'){
            info.mininumIntegerDigits += 1;
            ++i;
        }
        return info;
    },

    mininumIntegerDigits: JSDynamicProperty('_minimumIntegerDigits', 0),
    minimumFractionDigits: JSDynamicProperty('_minimumFractionDigits', 0),
    maximumFractionDigits: JSDynamicProperty('_maximumFractionDigits', 0),

    setMinimumFractionDigits: function(digits){
        this._minimumFractionDigits = digits;
        if (digits > this._maximumFractionDigits){
            this._maximumFractionDigits = digits;
        }
    },

    setMaximumFractionDigits: function(digits){
        this._maximumFractionDigits = digits;
        if (digits < this._minimumFractionDigits){
            this._minimumFractionDigits = digits;
        }
    },

    positivePrefix: JSDynamicProperty('_positivePrefix', ''),
    positiveSuffix: JSDynamicProperty('_positiveSuffix', ''),
    negativePrefix: JSDynamicProperty('_negativePrefix', '-'),
    negativeSuffix: JSDynamicProperty('_negativeSuffix', ''),

    getPositivePrefix: function(){
        return this._replacePrefixSuffix(this._positivePrefix);
    },

    getPositiveSuffix: function(){
        return this._replacePrefixSuffix(this._positiveSuffix);
    },

    getNegativePrefix: function(){
        return this._replacePrefixSuffix(this._negativePrefix);
    },

    getNegativeSuffix: function(){
        return this._replacePrefixSuffix(this._negativeSuffix);
    },

    _replacePrefixSuffix: function(prefixSuffix){
        if (prefixSuffix.length === 0){
            return prefixSuffix;
        }
        var replaced = "";
        var offset = 0;
        var i = prefixSuffix.indexOf("\uFFFC", offset);
        while (i >= 0){
            if (i > 0){
                replaced += prefixSuffix.substr(offset, i - offset);
            }
            offset = i + 1;
            switch (prefixSuffix[offset]){
                case '+':
                    replaced += this.plusSign;
                    break;
                case '-':
                    replaced += this.minusSign;
                    break;
                case '%':
                    replaced += this.percentSymbol;
                    break;
                case '‰':
                    replaced += this.perMilleSymbol;
                    break;
                case '¤':
                    ++offset;
                    // TODO: might need spacing
                    if (offset < prefixSuffix.length && prefixSuffix[offset] == '¤'){
                        replaced += this.currencyCode;
                    }else{
                        // TODO: internationalCurrencySymbol when appropriate (how is it triggered?)
                        replaced += this.currencySymbol;
                    }
                    break;
            }
            ++offset;
            i = prefixSuffix.indexOf("\uFFFC", offset);
        }
        if (offset < prefixSuffix.length){
            replaced += prefixSuffix.substr(offset);
        }
        return replaced;
    },

    usesGroupingSeparator: JSDynamicProperty('_usesGroupingSeparator', false),
    groupingSize: JSDynamicProperty('_groupingSize', 0),
    secondaryGroupingSize: JSDynamicProperty('_secondaryGroupingSize', 0),

    setUsesGroupingSeparator: function(uses){
        this._usesGroupingSeparator = uses;
        if (uses && this._groupingSize === 0){
            this._groupingSize = 3;
        }
    },

    setGroupingSize: function(size){
        this._groupingSize = size;
        if (this._groupingSize === 0){
            this._usesGroupingSeparator = false;
        }
    },

    multiplier: 1,
    percentSymbol: '%',
    perMilleSymbol: '‰',
    minusSign: '-',
    plusSign: '+',
    zeroSymbol: null,
    notANumberSymbol: 'NaN',
    nullSymbol: '',
    positiveInfinitySymbol: '+∞',
    negativeInfinitySymbol: '-∞',

    groupingSeparator: ',',
    decimalSeparator: '.',

    currencySymbol: '$',
    internationalCurrencySymbol: '$',
    currencyCode: 'USD',
    // FIXME: figure out how these come into play and where they come from
    currencyGroupingSeparator: ',',
    currencyDecimalSeparator: '.',

    stringFromNumber: function(n){
        if (n === null || n === undefined){
            return this.nullSymbol;
        }
        if (isNaN(n)){
            return this.notANumberSymbol;
        }
        if (!isFinite(n)){
            if (n < 0){
                return this.negativeInfinitySymbol;
            }
            return this.positiveInfinitySymbol;
        }
        if (n === 0){
            if (this.zeroSymbol !== null){
                return this.zeroSymbol;
            }
        }

        // Prefix & Suffix
        var negative = n < 0;
        var prefix, suffix;
        if (negative){
            n = -n;
            prefix = this.negativePrefix;
            suffix = this.negativeSuffix;
        }else{
            prefix = this.positivePrefix;
            suffix = this.positiveSuffix;
        }

        n *= this.multiplier;

        // Integer
        var integer = Math.floor(n);
        var fraction = n - integer;
        if (fraction >= 0.5 && this._maximumFractionDigits === 0){
            integer += 1;
        }
        var str = integer.toString();
        var zeroFillCount = this._minimumIntegerDigits - str.length;
        var i, l;
        if (zeroFillCount > 0){
            var fill = "";
            for (i = 0; i < zeroFillCount; ++i){
                fill += "0";
            }
            str = fill + str;
        }

        // Grouping
        if (this._usesGroupingSeparator){
            i = str.length - this._groupingSize;
            if (i > 0){
                var parts = str.splitAtIndex(i);
                str = parts[0] + ',' + parts[1];
                var groupSize = this._secondaryGroupingSize > 0 ? this._secondaryGroupingSize : this._groupingSize;
                for (i = i - groupSize; i > 0; i -= groupSize){
                    parts = str.splitAtIndex(i);
                    str = parts[0] + ',' + parts[1];
                }
            }
        }

        // Decimal
        if (this._maximumFractionDigits > 0){
            if (this._minimumFractionDigits > 0 || fraction !== 0){
                fraction *= Math.pow(10, this._maximumFractionDigits);
                fraction = Math.round(fraction);
                var extras = this._maximumFractionDigits - this._minimumFractionDigits;
                while (extras > 0 && ((fraction % 10) === 0)){
                    fraction /= 10;
                    --extras;
                }
                if (this._minimumFractionDigits > 0 || fraction !== 0){
                    str += ".";
                    var fractionString = fraction.toString();
                    while (fractionString.length < this._minimumFractionDigits){
                        fractionString += "0";
                    }
                    str += fractionString;
                }
            }
        }
        return prefix + str + suffix;
    }

});

JSNumberFormatter.Style = {
    none: 0,
    decimal: 1,
    percent: 2,
    ordinal: 3,
    currency: 4,
    currencyAccounting: 5,
    currencyISOCode: 6,
    custom: 0xFF
};

})();