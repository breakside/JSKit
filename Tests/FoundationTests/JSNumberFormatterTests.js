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

JSClass("JSNumberFormatterTests", TKTestSuite, {

    setup: function(){
        this.originalPreferredLanguages = JSLocale.preferredLanguages;
        JSLocale.preferredLanguages = ['en-US'];
    },

    teardown: function(){
        JSLocale.preferredLanguages = this.originalPreferredLanguages;
    },

    testInit: function(){
        var formatter = JSNumberFormatter.init();
        TKAssertObjectEquals(formatter.locale, JSLocale.current);
    },

    testInitWithLocale: function(){
        var locale = JSLocale.initWithIdentifier('de-DE');
        var formatter = JSNumberFormatter.initWithLocale(locale);
        TKAssertObjectEquals(formatter.locale, locale);
    },

    testBasic: function(){
        var formatter = JSNumberFormatter.init();
        TKAssertExactEquals(formatter.format, "#;0;-#");

        var str = formatter.stringFromNumber(1);
        TKAssertExactEquals(str, "1");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "1");

        str = formatter.stringFromNumber(0.12);
        TKAssertExactEquals(str, "0");

        str = formatter.stringFromNumber(-1.23);
        TKAssertExactEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.56);
        TKAssertExactEquals(str, "2");

        str = formatter.stringFromNumber(0.76);
        TKAssertExactEquals(str, "1");

        str = formatter.stringFromNumber(-1.56);
        TKAssertExactEquals(str, "-2");

        str = formatter.stringFromNumber(123456);
        TKAssertExactEquals(str, "123456");
    },

    testDecimal: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.decimal;
        TKAssertExactEquals(formatter.format, "#,##0.###;0;-#,##0.###");

        var str = formatter.stringFromNumber(1);
        TKAssertExactEquals(str, "1");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "1.23");

        str = formatter.stringFromNumber(2.01);
        TKAssertExactEquals(str, "2.01");

        str = formatter.stringFromNumber(2.001);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0009);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0005);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0004);
        TKAssertExactEquals(str, "2");

        str = formatter.stringFromNumber(2.101);
        TKAssertExactEquals(str, "2.101");

        str = formatter.stringFromNumber(2.1);
        TKAssertExactEquals(str, "2.1");

        str = formatter.stringFromNumber(0.1);
        TKAssertExactEquals(str, "0.1");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-1.235");
        
        str = formatter.stringFromNumber(1.5);
        TKAssertExactEquals(str, "1.5");

        str = formatter.stringFromNumber(0.7632);
        TKAssertExactEquals(str, "0.763");

        str = formatter.stringFromNumber(-1.56);
        TKAssertExactEquals(str, "-1.56");

        str = formatter.stringFromNumber(1123456.89);
        TKAssertExactEquals(str, "1,123,456.89");

        str = formatter.stringFromNumber(-1123456.89);
        TKAssertExactEquals(str, "-1,123,456.89");

        formatter.format = "#.000";
        str = formatter.stringFromNumber(1);
        TKAssertExactEquals(str, "1.000");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0.000");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-1.000");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "1.230");

        str = formatter.stringFromNumber(2.01);
        TKAssertExactEquals(str, "2.010");

        str = formatter.stringFromNumber(2.001);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0009);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0005);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0004);
        TKAssertExactEquals(str, "2.000");

        str = formatter.stringFromNumber(2.101);
        TKAssertExactEquals(str, "2.101");

        str = formatter.stringFromNumber(2.1);
        TKAssertExactEquals(str, "2.100");

        str = formatter.stringFromNumber(0.1);
        TKAssertExactEquals(str, "0.100");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-1.235");
        
        str = formatter.stringFromNumber(1.5);
        TKAssertExactEquals(str, "1.500");

        str = formatter.stringFromNumber(0.7632);
        TKAssertExactEquals(str, "0.763");

        str = formatter.stringFromNumber(-1.56);
        TKAssertExactEquals(str, "-1.560");

        formatter.format = "#.0##";
        str = formatter.stringFromNumber(1);
        TKAssertExactEquals(str, "1.0");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0.0");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-1.0");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "1.23");

        str = formatter.stringFromNumber(2.01);
        TKAssertExactEquals(str, "2.01");

        str = formatter.stringFromNumber(2.001);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0009);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0005);
        TKAssertExactEquals(str, "2.001");

        str = formatter.stringFromNumber(2.0004);
        TKAssertExactEquals(str, "2.0");

        str = formatter.stringFromNumber(2.101);
        TKAssertExactEquals(str, "2.101");

        str = formatter.stringFromNumber(2.1);
        TKAssertExactEquals(str, "2.1");

        str = formatter.stringFromNumber(0.1);
        TKAssertExactEquals(str, "0.1");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-1.235");
        
        str = formatter.stringFromNumber(1.5);
        TKAssertExactEquals(str, "1.5");

        str = formatter.stringFromNumber(0.7632);
        TKAssertExactEquals(str, "0.763");

        str = formatter.stringFromNumber(-1.56);
        TKAssertExactEquals(str, "-1.56");
    },

    testPercent: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.percent;
        TKAssertExactEquals(formatter.format, "#,##0%;0%;-#,##0%");

        var str = formatter.stringFromNumber(0.5);
        TKAssertExactEquals(str, "50%");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0%");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-100%");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "123%");

        str = formatter.stringFromNumber(0.1);
        TKAssertExactEquals(str, "10%");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-123%");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertExactEquals(str, "0%");

        str = formatter.stringFromNumber(0.767);
        TKAssertExactEquals(str, "77%");

        str = formatter.stringFromNumber(12345.67);
        TKAssertExactEquals(str, "1,234,567%");

        formatter.maximumFractionDigits = 1;
        TKAssertExactEquals(formatter.format, "#,##0.#%;0%;-#,##0.#%");

        str = formatter.stringFromNumber(0.5);
        TKAssertExactEquals(str, "50%");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "0%");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-100%");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "123%");

        str = formatter.stringFromNumber(0.1);
        TKAssertExactEquals(str, "10%");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-123.5%");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertExactEquals(str, "0%");

        str = formatter.stringFromNumber(0.767);
        TKAssertExactEquals(str, "76.7%");

        str = formatter.stringFromNumber(12345.6789);
        TKAssertExactEquals(str, "1,234,567.9%");
    },

    testCurrency: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.currency;
        TKAssertExactEquals(formatter.format, "¤#,##0.00;$0.00;-¤#,##0.00");

        var str = formatter.stringFromNumber(0.5);
        TKAssertExactEquals(str, "$0.50");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "$0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "-$1.00");

        str = formatter.stringFromNumber(2.01);
        TKAssertExactEquals(str, "$2.01");
        
        str = formatter.stringFromNumber(2.006);
        TKAssertExactEquals(str, "$2.01");
        
        str = formatter.stringFromNumber(2.004);
        TKAssertExactEquals(str, "$2.00");
        
        str = formatter.stringFromNumber(2.1);
        TKAssertExactEquals(str, "$2.10");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "$1.23");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertExactEquals(str, "$1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertExactEquals(str, "-$1,234,567.89");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "-$1.23");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertExactEquals(str, "$0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertExactEquals(str, "$0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertExactEquals(str, "$12,345.67");

        formatter.style = JSNumberFormatter.Style.currencyISOCode;
        TKAssertExactEquals(formatter.format, "¤¤ #,##0.00;USD 0.00;¤¤ -#,##0.00");

        str = formatter.stringFromNumber(0.5);
        TKAssertExactEquals(str, "USD 0.50");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "USD 0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "USD -1.00");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "USD 1.23");
        
        str = formatter.stringFromNumber(2.01);
        TKAssertExactEquals(str, "USD 2.01");
        
        str = formatter.stringFromNumber(2.006);
        TKAssertExactEquals(str, "USD 2.01");
        
        str = formatter.stringFromNumber(2.004);
        TKAssertExactEquals(str, "USD 2.00");
        
        str = formatter.stringFromNumber(2.1);
        TKAssertExactEquals(str, "USD 2.10");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertExactEquals(str, "USD 1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertExactEquals(str, "USD -1,234,567.89");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "USD -1.23");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertExactEquals(str, "USD 0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertExactEquals(str, "USD 0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertExactEquals(str, "USD 12,345.67");

        formatter.style = JSNumberFormatter.Style.currencyAccounting;
        TKAssertExactEquals(formatter.format, "¤#,##0.00;$0.00;(¤#,##0.00)");

        str = formatter.stringFromNumber(0.5);
        TKAssertExactEquals(str, "$0.50");

        str = formatter.stringFromNumber(0);
        TKAssertExactEquals(str, "$0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertExactEquals(str, "($1.00)");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertExactEquals(str, "$1.23");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertExactEquals(str, "$1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertExactEquals(str, "($1,234,567.89)");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertExactEquals(str, "($1.23)");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertExactEquals(str, "$0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertExactEquals(str, "$0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertExactEquals(str, "$12,345.67");
    },

    testNumberFromString: function(){
        var formatter = JSNumberFormatter.init();
        TKAssertExactEquals(formatter.format, "#;0;-#");
        var n = formatter.numberFromString("1");
        TKAssertExactEquals(n, 1);
        n = formatter.numberFromString("0");
        TKAssertExactEquals(n, 0);
        n = formatter.numberFromString("-1");
        TKAssertExactEquals(n, -1);
        n = formatter.numberFromString("1.23");
        TKAssertExactEquals(n, 1.23);
        n = formatter.numberFromString("0.12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("0.12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("-1.23");
        TKAssertExactEquals(n, -1.23);
        n = formatter.numberFromString("1.56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("0.76");
        TKAssertExactEquals(n, 0.76);
        n = formatter.numberFromString("-1.56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+1.56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("- 1.56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+ 1.56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("123456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("123,456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12,3,456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12,3,456.78");
        TKAssertExactEquals(n, 123456.78);

        formatter.multiplier = 100;
        n = formatter.numberFromString("1%");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("0%");
        TKAssertExactEquals(n, 0);
        n = formatter.numberFromString("-1%");
        TKAssertExactEquals(n, -0.01);
        n = formatter.numberFromString("+1%");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("- 1%");
        TKAssertExactEquals(n, -0.01);
        n = formatter.numberFromString("+ 1%");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("1.23%");
        TKAssertExactEquals(n, 0.0123);
        n = formatter.numberFromString("123%");
        TKAssertExactEquals(n, 1.23);
        n = formatter.numberFromString("42");
        TKAssertExactEquals(n, 0.42);
        n = formatter.numberFromString("1,234%");
        TKAssertExactEquals(n, 12.34);
        n = formatter.numberFromString("1,2,34");
        TKAssertExactEquals(n, 12.34);

        formatter.percentSymbol = "😀";
        n = formatter.numberFromString("1😀");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("0😀");
        TKAssertExactEquals(n, 0);
        n = formatter.numberFromString("-1😀");
        TKAssertExactEquals(n, -0.01);
        n = formatter.numberFromString("+1😀");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("- 1😀");
        TKAssertExactEquals(n, -0.01);
        n = formatter.numberFromString("+ 1😀");
        TKAssertExactEquals(n, 0.01);
        n = formatter.numberFromString("1.23😀");
        TKAssertExactEquals(n, 0.0123);
        n = formatter.numberFromString("123😀");
        TKAssertExactEquals(n, 1.23);
        n = formatter.numberFromString("42");
        TKAssertExactEquals(n, 0.42);
        n = formatter.numberFromString("1,234😀");
        TKAssertExactEquals(n, 12.34);
        n = formatter.numberFromString("1,2,34");
        TKAssertExactEquals(n, 12.34);
        formatter.percentSymbol = "%";

        formatter.multiplier = 1000;
        n = formatter.numberFromString("1‰");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("0‰");
        TKAssertExactEquals(n, 0);
        n = formatter.numberFromString("-1‰");
        TKAssertExactEquals(n, -0.001);
        n = formatter.numberFromString("+1‰");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("- 1‰");
        TKAssertExactEquals(n, -0.001);
        n = formatter.numberFromString("+ 1‰");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("1.23‰");
        TKAssertExactEquals(n, 0.00123);
        n = formatter.numberFromString("123‰");
        TKAssertExactEquals(n, 0.123);
        n = formatter.numberFromString("42");
        TKAssertExactEquals(n, 0.042);
        n = formatter.numberFromString("1,234‰");
        TKAssertExactEquals(n, 1.234);
        n = formatter.numberFromString("1,2,34");
        TKAssertExactEquals(n, 1.234);

        formatter.perMilleSymbol = "😀";
        n = formatter.numberFromString("1😀");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("0😀");
        TKAssertExactEquals(n, 0);
        n = formatter.numberFromString("-1😀");
        TKAssertExactEquals(n, -0.001);
        n = formatter.numberFromString("+1😀");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("- 1😀");
        TKAssertExactEquals(n, -0.001);
        n = formatter.numberFromString("+ 1😀");
        TKAssertExactEquals(n, 0.001);
        n = formatter.numberFromString("1.23😀");
        TKAssertExactEquals(n, 0.00123);
        n = formatter.numberFromString("123😀");
        TKAssertExactEquals(n, 0.123);
        n = formatter.numberFromString("42");
        TKAssertExactEquals(n, 0.042);
        n = formatter.numberFromString("1,234😀");
        TKAssertExactEquals(n, 1.234);
        n = formatter.numberFromString("1,2,34");
        TKAssertExactEquals(n, 1.234);
        formatter.perMilleSymbol = "‰";

        formatter.multiplier = 0.01;
        n = formatter.numberFromString("$1");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("$1.2");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("$1.23");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-$1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- $1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- $ 1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("$-1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("$ -1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("$ - 1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("$123.456");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("$123,456");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("$123,45,6");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("$ 1");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("$ 1.2");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("$ 1.23");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("$ 123.456");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("$ 123,456");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("$ 123,45,6");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("1$");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("1.2$");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("1.23$");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-1.23$");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- 1.23$");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("123.456$");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("123,456$");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("123,45,6$");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("1 $");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("1.2 $");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("1.23 $");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-1.23 $");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- 1.23 $");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("123.456 $");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("123,456 $");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("123,45,6 $");
        TKAssertExactEquals(n, 12345600);

        formatter.currencySymbol = "£";
        n = formatter.numberFromString("£1");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("£1.2");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("£1.23");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-£1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- £1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- £ 1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("£-1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("£ -1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("£ - 1.23");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("£123.456");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("£123,456");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("£123,45,6");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("£ 1");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("£ 1.2");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("£ 1.23");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("£ 123.456");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("£ 123,456");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("£ 123,45,6");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("1£");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("1.2£");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("1.23£");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-1.23£");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- 1.23£");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("123.456£");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("123,456£");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("123,45,6£");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("1 £");
        TKAssertExactEquals(n, 100);
        n = formatter.numberFromString("1.2 £");
        TKAssertExactEquals(n, 120);
        n = formatter.numberFromString("1.23 £");
        TKAssertExactEquals(n, 123);
        n = formatter.numberFromString("-1.23 £");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("- 1.23 £");
        TKAssertExactEquals(n, -123);
        n = formatter.numberFromString("123.456 £");
        TKAssertExactEquals(n, 12345.6);
        n = formatter.numberFromString("123,456 £");
        TKAssertExactEquals(n, 12345600);
        n = formatter.numberFromString("123,45,6 £");
        TKAssertExactEquals(n, 12345600);
        formatter.currencySymbol = "$";

        formatter.multiplier = 1;
        TKAssertNull(formatter.numberFromString(""));
        TKAssertNull(formatter.numberFromString("abc"));
        TKAssertNull(formatter.numberFromString("123abc"));
        TKAssertNull(formatter.numberFromString("123 abc"));
        TKAssertNull(formatter.numberFromString("$123$"));
        TKAssertNull(formatter.numberFromString("1$23"));
        TKAssertNull(formatter.numberFromString("1..23"));
        TKAssertNull(formatter.numberFromString("1%23"));
        TKAssertNull(formatter.numberFromString("%123%"));
        TKAssertNull(formatter.numberFromString("‰123‰"));
        TKAssertNull(formatter.numberFromString("1.23,4"));
        TKAssertNull(formatter.numberFromString("1.23,4"));
        TKAssertNull(formatter.numberFromString("1.23£"));
        TKAssertNull(formatter.numberFromString("123+"));
        TKAssertNull(formatter.numberFromString("123-"));
        TKAssertNull(formatter.numberFromString("+123-"));
        TKAssertNull(formatter.numberFromString("+-123"));
        TKAssertNull(formatter.numberFromString("-+123"));

        formatter.groupingSeparator = ".";
        formatter.decimalSeparator = ",";
        n = formatter.numberFromString("1,23");
        TKAssertExactEquals(n, 1.23);
        n = formatter.numberFromString("0,12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("0,12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("-1,23");
        TKAssertExactEquals(n, -1.23);
        n = formatter.numberFromString("1,56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("0,76");
        TKAssertExactEquals(n, 0.76);
        n = formatter.numberFromString("-1,56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+1,56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("- 1,56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+ 1,56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("123456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("123.456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12.3.456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12.3.456,78");
        TKAssertExactEquals(n, 123456.78);

        formatter.groupingSeparator = "🙂";
        formatter.decimalSeparator = "🙃";
        n = formatter.numberFromString("1🙃23");
        TKAssertExactEquals(n, 1.23);
        n = formatter.numberFromString("0🙃12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("0🙃12");
        TKAssertExactEquals(n, 0.12);
        n = formatter.numberFromString("-1🙃23");
        TKAssertExactEquals(n, -1.23);
        n = formatter.numberFromString("1🙃56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("0🙃76");
        TKAssertExactEquals(n, 0.76);
        n = formatter.numberFromString("-1🙃56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+1🙃56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("- 1🙃56");
        TKAssertExactEquals(n, -1.56);
        n = formatter.numberFromString("+ 1🙃56");
        TKAssertExactEquals(n, 1.56);
        n = formatter.numberFromString("123456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("123🙂456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12🙂3🙂456");
        TKAssertExactEquals(n, 123456);
        n = formatter.numberFromString("12🙂3🙂456🙃78");
        TKAssertExactEquals(n, 123456.78);
    }
});

})();