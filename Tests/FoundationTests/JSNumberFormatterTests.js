// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSNumberFormatter, JSLocale */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
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
        TKAssertEquals(formatter.format, "#;0;-#");

        var str = formatter.stringFromNumber(1);
        TKAssertEquals(str, "1");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "0");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "1");

        str = formatter.stringFromNumber(0.12);
        TKAssertEquals(str, "0");

        str = formatter.stringFromNumber(-1.23);
        TKAssertEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.56);
        TKAssertEquals(str, "2");

        str = formatter.stringFromNumber(0.76);
        TKAssertEquals(str, "1");

        str = formatter.stringFromNumber(-1.56);
        TKAssertEquals(str, "-2");

        str = formatter.stringFromNumber(123456);
        TKAssertEquals(str, "123456");
    },

    testDecimal: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.decimal;
        TKAssertEquals(formatter.format, "#,##0.###;0;-#,##0.###");

        var str = formatter.stringFromNumber(1);
        TKAssertEquals(str, "1");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "0");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "-1");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "1.23");

        str = formatter.stringFromNumber(0.1);
        TKAssertEquals(str, "0.1");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "-1.235");
        
        str = formatter.stringFromNumber(1.5);
        TKAssertEquals(str, "1.5");

        str = formatter.stringFromNumber(0.7632);
        TKAssertEquals(str, "0.763");

        str = formatter.stringFromNumber(-1.56);
        TKAssertEquals(str, "-1.56");

        str = formatter.stringFromNumber(1123456.89);
        TKAssertEquals(str, "1,123,456.89");

        str = formatter.stringFromNumber(-1123456.89);
        TKAssertEquals(str, "-1,123,456.89");
    },

    testPercent: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.percent;
        TKAssertEquals(formatter.format, "#,##0%;0%;-#,##0%");

        var str = formatter.stringFromNumber(0.5);
        TKAssertEquals(str, "50%");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "0%");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "-100%");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "123%");

        str = formatter.stringFromNumber(0.1);
        TKAssertEquals(str, "10%");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "-123%");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertEquals(str, "0%");

        str = formatter.stringFromNumber(0.767);
        TKAssertEquals(str, "77%");

        str = formatter.stringFromNumber(12345.67);
        TKAssertEquals(str, "1,234,567%");

        formatter.maximumFractionDigits = 1;
        TKAssertEquals(formatter.format, "#,##0.#%;0%;-#,##0.#%");

        str = formatter.stringFromNumber(0.5);
        TKAssertEquals(str, "50%");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "0%");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "-100%");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "123%");

        str = formatter.stringFromNumber(0.1);
        TKAssertEquals(str, "10%");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "-123.5%");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertEquals(str, "0%");

        str = formatter.stringFromNumber(0.767);
        TKAssertEquals(str, "76.7%");

        str = formatter.stringFromNumber(12345.6789);
        TKAssertEquals(str, "1,234,567.9%");
    },

    testCurrency: function(){
        var formatter = JSNumberFormatter.init();
        formatter.style = JSNumberFormatter.Style.currency;
        TKAssertEquals(formatter.format, "¤#,##0.00;$0.00;-¤#,##0.00");

        var str = formatter.stringFromNumber(0.5);
        TKAssertEquals(str, "$0.50");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "$0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "-$1.00");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "$1.23");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertEquals(str, "$1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertEquals(str, "-$1,234,567.89");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "-$1.23");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertEquals(str, "$0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertEquals(str, "$0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertEquals(str, "$12,345.67");

        formatter.style = JSNumberFormatter.Style.currencyISOCode;
        TKAssertEquals(formatter.format, "¤¤ #,##0.00;USD 0.00;¤¤ -#,##0.00");

        str = formatter.stringFromNumber(0.5);
        TKAssertEquals(str, "USD 0.50");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "USD 0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "USD -1.00");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "USD 1.23");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertEquals(str, "USD 1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertEquals(str, "USD -1,234,567.89");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "USD -1.23");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertEquals(str, "USD 0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertEquals(str, "USD 0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertEquals(str, "USD 12,345.67");

        formatter.style = JSNumberFormatter.Style.currencyAccounting;
        TKAssertEquals(formatter.format, "¤#,##0.00;$0.00;(¤#,##0.00)");

        str = formatter.stringFromNumber(0.5);
        TKAssertEquals(str, "$0.50");

        str = formatter.stringFromNumber(0);
        TKAssertEquals(str, "$0.00");

        str = formatter.stringFromNumber(-1);
        TKAssertEquals(str, "($1.00)");
        
        str = formatter.stringFromNumber(1.23);
        TKAssertEquals(str, "$1.23");

        str = formatter.stringFromNumber(1234567.89);
        TKAssertEquals(str, "$1,234,567.89");

        str = formatter.stringFromNumber(-1234567.89);
        TKAssertEquals(str, "($1,234,567.89)");

        str = formatter.stringFromNumber(-1.2346);
        TKAssertEquals(str, "($1.23)");
        
        str = formatter.stringFromNumber(0.0001);
        TKAssertEquals(str, "$0.00");

        str = formatter.stringFromNumber(0.767);
        TKAssertEquals(str, "$0.77");

        str = formatter.stringFromNumber(12345.67);
        TKAssertEquals(str, "$12,345.67");
    }
});

})();