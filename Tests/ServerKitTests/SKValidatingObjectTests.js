// #import ServerKit
// #import TestKit
'use strict';

JSClass("SKValidatingObjectTests", TKTestSuite, {

    testObjectStringForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.stringForKey("stringKey");
        TKAssertEquals(result, "testing");

        result = validator.stringForKey("missingKey", "test");
        TKAssertEquals(result, "test");

        result = validator.stringForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.stringForKey("missingKey"); });
        TKAssertThrows(function(){ validator.stringForKey("numberKey"); });
        TKAssertThrows(function(){ validator.stringForKey("boolKey"); });
        TKAssertThrows(function(){ validator.stringForKey("nullKey"); });
        TKAssertThrows(function(){ validator.stringForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.stringForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.stringForKey("objectKey"); });

        var customValidatorCalls = 0;
        result = validator.stringForKey("stringKey", null, function(value){
            ++customValidatorCalls;
            TKAssertEquals(value, "testing");
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.stringForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testObjectStringForKeyInLengthRange: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.stringForKeyInLengthRange("stringKey", 5, 10);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("stringKey", 5);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("stringKey", undefined, 10);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("missingKey", 5, 10, "test");
        TKAssertEquals(result, "test");

        result = validator.stringForKeyInLengthRange("missingKey", 5, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("missingKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("numberKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("boolKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("nullKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("undefinedKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("arrayKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("objectKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", 10); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", 0, 5); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", undefined, 5); });
    },

    testObjectEmailForKey: function(){
        var input = {email: "test@breakside.io"};
        var validator = SKValidatingObject.initWithObject(input);
        var result = validator.emailForKey("email");
        TKAssertEquals(result, "test@breakside.io");

        input = {email: "test@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("missing", "test");
        TKAssertEquals(result, "test");

        input = {email: "test@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("missing", null);
        TKAssertNull(result);

        input = {email: "test@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test@breakside");

        input = {email: "test+1@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test+1@breakside");

        input = {email: "test.1@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test.1@breakside");

        input = {email: "test-1@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test-1@breakside");

        input = {email: "123@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "123@breakside");

        input = {email: "123@456"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "123@456");

        input = {email: "test"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "test@"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "@breakside"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "test@breakside."};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "test@breakside.io."};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "te st@breakside.io."};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "test@break side.io"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: " test@breakside.io"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = {email: "test@breakside.io "};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });
    },

    testObjectPhoneForKey: function(){
        var input = {phone: "(234) 567-8901"};
        var validator = SKValidatingObject.initWithObject(input);
        var result = validator.phoneForKey("phone");
        TKAssertEquals(result, "(234) 567-8901");

        input = {phone: "234-567-8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234-567-8901");

        input = {phone: "234-567-8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("missing", "test");
        TKAssertEquals(result, "test");

        input = {phone: "234-567-8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("missing", null);
        TKAssertNull(result);

        input = {phone: "234 567 8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234 567 8901");

        input = {phone: "234.567.8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234.567.8901");

        input = {phone: "+1 234-567-8901"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "+1 234-567-8901");

        input = {phone: "2345678"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "2345678");

        input = {phone: "234567890123456"};
        validator = SKValidatingObject.initWithObject(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234567890123456");

        input = {phone: "2"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "23"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "234"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "2345"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "23456"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "234567"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "234+5678"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "2345678901234567"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = {phone: "a 234 567 8901"};
        validator = SKValidatingObject.initWithObject(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });
    },

    testObjectNumberForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.numberForKey("numberKey");
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKey("missingKey", 5);
        TKAssertEquals(result, 5);

        result = validator.numberForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.numberForKey("missingKey"); });
        TKAssertThrows(function(){ validator.numberForKey("stringKey"); });
        TKAssertThrows(function(){ validator.numberForKey("boolKey"); });
        TKAssertThrows(function(){ validator.numberForKey("nullKey"); });
        TKAssertThrows(function(){ validator.numberForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.numberForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.numberForKey("objectKey"); });

        var customValidatorCalls = 0;
        result = validator.numberForKey("numberKey", null, function(value){
            ++customValidatorCalls;
            TKAssertFloatEquals(value, 1.2);
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.numberForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testObjectNumberForKeyInRange: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.numberForKeyInRange("numberKey", 0, 10);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("numberKey", 0);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("numberKey", undefined, 10);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("missingKey", 0, 10, 15);
        TKAssertEquals(result, 15);

        result = validator.numberForKeyInRange("missingKey", 0, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.numberForKeyInRange("missingKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("stringKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("boolKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("nullKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("undefinedKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("arrayKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("objectKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", 2); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", 0, 1); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", undefined, 1); });
    },

    testObjectIntegerForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            integerKey: 12,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.integerForKey("integerKey");
        TKAssertEquals(result, 12);

        result = validator.integerForKey("missingKey", 5);
        TKAssertEquals(result, 5);

        result = validator.integerForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.integerForKey("missingKey"); });
        TKAssertThrows(function(){ validator.integerForKey("numberKey"); });
        TKAssertThrows(function(){ validator.integerForKey("stringKey"); });
        TKAssertThrows(function(){ validator.integerForKey("boolKey"); });
        TKAssertThrows(function(){ validator.integerForKey("nullKey"); });
        TKAssertThrows(function(){ validator.integerForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.integerForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.integerForKey("objectKey"); });

        var customValidatorCalls = 0;
        result = validator.integerForKey("integerKey", null, function(value){
            ++customValidatorCalls;
            TKAssertEquals(value, 12);
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.integerForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testObjectIntegerForKeyInRange: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            integerKey: 12,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.integerForKeyInRange("integerKey", 0, 20);
        TKAssertEquals(result, 12);

        result = validator.integerForKeyInRange("integerKey", 0);
        TKAssertEquals(result, 12);

        result = validator.integerForKeyInRange("integerKey", undefined, 20);
        TKAssertEquals(result, 12);

        result = validator.integerForKeyInRange("missingKey", 0, 10, 15);
        TKAssertEquals(result, 15);

        result = validator.integerForKeyInRange("missingKey", 0, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.integerForKeyInRange("missingKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("stringKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("numberKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("boolKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("nullKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("undefinedKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("arrayKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("objectKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", 20); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", 0, 10); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", undefined, 10); });
    },

    testObjectBooleanForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.booleanForKey("boolKey");
        TKAssertExactEquals(result, true);

        result = validator.booleanForKey("missingKey", false);
        TKAssertExactEquals(result, false);

        result = validator.booleanForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.booleanForKey("missingKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("stringKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("numberKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("nullKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("objectKey"); });
    },

    testObjectObjectForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.objectForKey("objectKey");
        TKAssert(result instanceof SKValidatingObject);
        var result2 = result.stringForKey("stringKey");
        TKAssertEquals(result2, "one");
        result2 = result.numberForKey("numberKey");
        TKAssertEquals(result2, 2);

        result = validator.objectForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.objectForKey("missingKey"); });
        TKAssertThrows(function(){ validator.objectForKey("stringKey"); });
        TKAssertThrows(function(){ validator.objectForKey("numberKey"); });
        TKAssertThrows(function(){ validator.objectForKey("nullKey"); });
        TKAssertThrows(function(){ validator.objectForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.objectForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.objectForKey("boolKey"); });
    },

    testObjectArrayForKey: function(){
        var input = {
            stringKey: "testing",
            numberKey: 1.2,
            boolKey: true,
            nullKey: null,
            undefinedKey: undefined,
            arrayKey: ["zero", 1, 2, 3],
            objectKey: {stringKey: "one", numberKey: 2}
        };

        var validator = SKValidatingObject.initWithObject(input);

        var result = validator.arrayForKey("arrayKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 4);
        var result2 = result.stringForKey(0);
        TKAssertEquals(result2, "zero");
        result2 = result.numberForKey(1);
        TKAssertEquals(result2, 1);

        result = validator.arrayForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.arrayForKey("missingKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("stringKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("numberKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("nullKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("undefinedKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("objectKey"); });
        TKAssertThrows(function(){ validator.arrayForKey("boolKey"); });
    },

    testFormStringForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.stringForKey("stringKey");
        TKAssertExactEquals(result, "testing");

        result = validator.stringForKey("missingKey", "test");
        TKAssertExactEquals(result, "test");

        result = validator.stringForKey("missingKey", null);
        TKAssertNull(result);

        result = validator.stringForKey("numberKey");
        TKAssertExactEquals(result, "1.2");

        result = validator.stringForKey("boolKey");
        TKAssertExactEquals(result, "true");

        TKAssertThrows(function(){ validator.stringForKey("missingKey"); });
        TKAssertThrows(function(){ validator.stringForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.stringForKey("nullKey"); });

        var customValidatorCalls = 0;
        result = validator.stringForKey("stringKey", null, function(value){
            ++customValidatorCalls;
            TKAssertEquals(value, "testing");
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.stringForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testFormStringForKeyInLengthRange: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.stringForKeyInLengthRange("stringKey", 5, 10);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("stringKey", 5);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("stringKey", undefined, 10);
        TKAssertEquals(result, "testing");

        result = validator.stringForKeyInLengthRange("missingKey", 5, 10, "test");
        TKAssertEquals(result, "test");

        result = validator.stringForKeyInLengthRange("missingKey", 5, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("missingKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("nullKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("arrayKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("objectKey"); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", 10); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", 0, 5); });
        TKAssertThrows(function(){ validator.stringForKeyInLengthRange("stringKey", undefined, 5); });
    },

    testFormEmailForKey: function(){
        var input = JSFormFieldMap();
        input.add("email", "test@breakside.io");
        var validator = SKValidatingObject.initWithForm(input);
        var result = validator.emailForKey("email");
        TKAssertEquals(result, "test@breakside.io");

        input = JSFormFieldMap();
        input.add("email", "test@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("missing", "test");
        TKAssertEquals(result, "test");

        input = JSFormFieldMap();
        input.add("email", "test@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("missing", null);
        TKAssertNull(result);

        input = JSFormFieldMap();
        input.add("email", "test@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test@breakside");

        input = JSFormFieldMap();
        input.add("email", "test+1@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test+1@breakside");

        input = JSFormFieldMap();
        input.add("email", "test.1@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test.1@breakside");

        input = JSFormFieldMap();
        input.add("email", "test-1@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "test-1@breakside");

        input = JSFormFieldMap();
        input.add("email", "123@breakside");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "123@breakside");

        input = JSFormFieldMap();
        input.add("email", "123@456");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.emailForKey("email");
        TKAssertEquals(result, "123@456");

        input = JSFormFieldMap();
        input.add("email", "test");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "test@");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "@breakside");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "test@breakside.");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "test@breakside.io.");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "te st@breakside.io.");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "test@break side.io");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", " test@breakside.io");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });

        input = JSFormFieldMap();
        input.add("email", "test@breakside.io ");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.emailForKey("email"); });
    },

    testFormPhoneForKey: function(){
        var input = JSFormFieldMap();
        input.add("phone", "(234) 567-8901");
        var validator = SKValidatingObject.initWithForm(input);
        var result = validator.phoneForKey("phone");
        TKAssertEquals(result, "(234) 567-8901");

        input = JSFormFieldMap();
        input.add("phone", "234-567-8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234-567-8901");

        input = JSFormFieldMap();
        input.add("phone", "234-567-8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("missing", "test");
        TKAssertEquals(result, "test");

        input = JSFormFieldMap();
        input.add("phone", "234-567-8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("missing", null);
        TKAssertNull(result);

        input = JSFormFieldMap();
        input.add("phone", "234 567 8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234 567 8901");

        input = JSFormFieldMap();
        input.add("phone", "234.567.8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234.567.8901");

        input = JSFormFieldMap();
        input.add("phone", "+1 234-567-8901");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "+1 234-567-8901");

        input = JSFormFieldMap();
        input.add("phone", "2345678");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "2345678");

        input = JSFormFieldMap();
        input.add("phone", "234567890123456");
        validator = SKValidatingObject.initWithForm(input);
        result = validator.phoneForKey("phone");
        TKAssertEquals(result, "234567890123456");

        input = JSFormFieldMap();
        input.add("phone", "2");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "23");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "234");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "2345");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "23456");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "234567");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "234+5678");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "2345678901234567");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });

        input = JSFormFieldMap();
        input.add("phone", "a 234 567 8901");
        validator = SKValidatingObject.initWithForm(input);
        TKAssertThrows(function(){ validator.phoneForKey("phone"); });
    },

    testFormNumberForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.numberForKey("numberKey");
        TKAssertType(result, "number");
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKey("missingKey", 5);
        TKAssertEquals(result, 5);

        result = validator.numberForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.numberForKey("missingKey"); });
        TKAssertThrows(function(){ validator.numberForKey("stringKey"); });
        TKAssertThrows(function(){ validator.numberForKey("boolKey"); });
        TKAssertThrows(function(){ validator.numberForKey("nullKey"); });
        TKAssertThrows(function(){ validator.numberForKey("arrayKey"); });

        var customValidatorCalls = 0;
        result = validator.numberForKey("numberKey", null, function(value){
            ++customValidatorCalls;
            TKAssertType(value, "number");
            TKAssertFloatEquals(value, 1.2);
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.numberForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testFormNumberForKeyInRange: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.numberForKeyInRange("numberKey", 0, 10);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("numberKey", 0);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("numberKey", undefined, 10);
        TKAssertFloatEquals(result, 1.2);

        result = validator.numberForKeyInRange("missingKey", 0, 10, 15);
        TKAssertEquals(result, 15);

        result = validator.numberForKeyInRange("missingKey", 0, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.numberForKeyInRange("missingKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("stringKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("boolKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("nullKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("arrayKey"); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", 2); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", 0, 1); });
        TKAssertThrows(function(){ validator.numberForKeyInRange("numberKey", undefined, 1); });
    },

    testFormIntegerForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.integerForKey("integerKey");
        TKAssertExactEquals(result, 12);

        result = validator.integerForKey("missingKey", 5);
        TKAssertEquals(result, 5);

        result = validator.integerForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.integerForKey("missingKey"); });
        TKAssertThrows(function(){ validator.integerForKey("numberKey"); });
        TKAssertThrows(function(){ validator.integerForKey("stringKey"); });
        TKAssertThrows(function(){ validator.integerForKey("boolKey"); });
        TKAssertThrows(function(){ validator.integerForKey("nullKey"); });
        TKAssertThrows(function(){ validator.integerForKey("arrayKey"); });

        var customValidatorCalls = 0;
        result = validator.integerForKey("integerKey", null, function(value){
            ++customValidatorCalls;
            TKAssertEquals(value, 12);
        });
        TKAssertEquals(customValidatorCalls, 1);

        customValidatorCalls = 0;
        result = validator.integerForKey("missingKey", null, function(value){
            ++customValidatorCalls;
        });
        TKAssertEquals(customValidatorCalls, 0);
    },

    testFormIntegerForKeyInRange: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.integerForKeyInRange("integerKey", 0, 20);
        TKAssertExactEquals(result, 12);

        result = validator.integerForKeyInRange("integerKey", 0);
        TKAssertEquals(result, 12);

        result = validator.integerForKeyInRange("integerKey", undefined, 20);
        TKAssertEquals(result, 12);

        result = validator.integerForKeyInRange("missingKey", 0, 10, 15);
        TKAssertEquals(result, 15);

        result = validator.integerForKeyInRange("missingKey", 0, 10, null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.integerForKeyInRange("missingKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("stringKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("numberKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("boolKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("nullKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("arrayKey"); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", 20); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", 0, 10); });
        TKAssertThrows(function(){ validator.integerForKeyInRange("integerKey", undefined, 10); });
    },

    testFormBooleanForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("boolKey2", "off");
        input.add("boolKey3", "yes");
        input.add("boolKey4", "0");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.booleanForKey("boolKey");
        TKAssertExactEquals(result, true);

        result = validator.booleanForKey("boolKey2");
        TKAssertExactEquals(result, false);

        result = validator.booleanForKey("boolKey3");
        TKAssertExactEquals(result, true);

        result = validator.booleanForKey("boolKey4");
        TKAssertExactEquals(result, false);

        result = validator.booleanForKey("missingKey", false);
        TKAssertExactEquals(result, false);

        result = validator.booleanForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.booleanForKey("missingKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("stringKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("numberKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("nullKey"); });
        TKAssertThrows(function(){ validator.booleanForKey("arrayKey"); });
    },

    testFormObjectForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.objectForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.objectForKey("missingKey"); });
        TKAssertThrows(function(){ validator.objectForKey("stringKey"); });
        TKAssertThrows(function(){ validator.objectForKey("numberKey"); });
        TKAssertThrows(function(){ validator.objectForKey("nullKey"); });
        TKAssertThrows(function(){ validator.objectForKey("arrayKey"); });
        TKAssertThrows(function(){ validator.objectForKey("boolKey"); });
    },

    testFormArrayForKey: function(){
        var input = JSFormFieldMap();
        input.add("stringKey", "testing");
        input.add("numberKey", "1.2");
        input.add("integerKey", "12");
        input.add("boolKey", "true");
        input.add("nullKey", null);
        input.add("arrayKey", "zero");
        input.add("arrayKey", "1");
        input.add("arrayKey", "2");
        input.add("arrayKey", "3");

        var validator = SKValidatingObject.initWithForm(input);

        var result = validator.arrayForKey("arrayKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 4);
        var result2 = result.stringForKey(0);
        TKAssertEquals(result2, "zero");
        result2 = result.numberForKey(1);
        TKAssertEquals(result2, 1);

        result = validator.arrayForKey("stringKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 1);
        result2 = result.stringForKey(0);
        TKAssertEquals(result2, "testing");

        result = validator.arrayForKey("numberKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 1);
        result2 = result.stringForKey(0);
        TKAssertExactEquals(result2, "1.2");
        result2 = result.numberForKey(0);
        TKAssertType(result2, "number");
        TKAssertEquals(result2, 1.2);

        result = validator.arrayForKey("nullKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 1);
        TKAssertThrows(function(){ result.stringForKey(0); });
        TKAssertThrows(function(){ result.numberForKey(0); });

        result = validator.arrayForKey("boolKey");
        TKAssert(result instanceof SKValidatingObject);
        TKAssertEquals(result.length, 1);
        result2 = result.stringForKey(0);
        TKAssertExactEquals(result2, "true");
        result2 = result.booleanForKey(0);
        TKAssertExactEquals(result2, true);

        result = validator.arrayForKey("missingKey", null);
        TKAssertNull(result);

        TKAssertThrows(function(){ validator.arrayForKey("missingKey"); });
    },

});