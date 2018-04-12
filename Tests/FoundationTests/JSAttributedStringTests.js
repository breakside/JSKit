// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSAttributedString, JSRange, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, TKAssertExactEquals, TKAssertThrows, TKAssertUndefined */
'use strict';

JSClass('JSAttributedStringTests', TKTestSuite, {

    testInit: function(){
        var string = JSAttributedString.init();
        TKAssertNotNull(string);
    },

    testCopyInit: function(){
        var string = JSAttributedString.initWithString("Hello, world!");
        TKAssertNotNull(string);
        string.addAttributeInRange("test", 123, JSRange(2, 4));

        var string2 = JSAttributedString.initWithAttributedString(string);
        TKAssertNotNull(string2);
        var attributes = string2.attributesAtIndex(3);
        TKAssertExactEquals(attributes.test, 123);
        attributes = string2.attributesAtIndex(0);
        TKAssertExactEquals(attributes.test, undefined);
    },

    testCopyInitWithDefaults: function(){
        var string = JSAttributedString.initWithString("Hello, world!");
        TKAssertNotNull(string);
        string.addAttributeInRange("test", 123, JSRange(2, 4));

        var string2 = JSAttributedString.initWithAttributedString(string, {test: 456});
        TKAssertNotNull(string2);
        var attributes = string2.attributesAtIndex(0);
        TKAssertExactEquals(attributes.test, 456);
        attributes = string2.attributesAtIndex(3);
        TKAssertExactEquals(attributes.test, 123);
    },

    testString: function(){
        var string = JSAttributedString.initWithString("Hello, world!");
        TKAssertNotNull(string);
        TKAssertEquals(string.string, "Hello, world!");
        TKAssertThrows(function(){
            string.string = "Hi!";
        });
        TKAssertEquals(string.string, "Hello, world!");
    },

    testAttributesAtIndex: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
    },

    testAttributeAtIndex: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var attribute = string.attributeAtIndex('bold', 0);
        TKAssertExactEquals(attribute, true);
        attribute = string.attributeAtIndex('bold', 5);
        TKAssertExactEquals(attribute, true);
        attribute = string.attributeAtIndex('bold', string.string.length);
        TKAssertExactEquals(attribute, true);
    },

    testRunIndexForStringIndex: function(){
        // _runIndexForStringIndex is a crucial private method
        // these tests modify private structures directly for ease of testing

        var string = JSAttributedString.init();
        var index;
        string._runs = [
            { range: JSRange(0, 5) }
        ];
        index = string._runIndexForStringIndex(0);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(2);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(4);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(5);
        TKAssertExactEquals(index, 0);

        string._runs = [
            { range: JSRange(0, 5) },
            { range: JSRange(5, 8) }
        ];
        index = string._runIndexForStringIndex(0);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(2);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(4);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(5);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(6);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(12);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(13);
        TKAssertExactEquals(index, 1);

        string._runs = [
            { range: JSRange(0, 5) },
            { range: JSRange(5, 8) },
            { range: JSRange(13, 1) }
        ];
        index = string._runIndexForStringIndex(0);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(2);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(4);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(5);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(6);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(12);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(13);
        TKAssertExactEquals(index, 2);
        index = string._runIndexForStringIndex(14);
        TKAssertExactEquals(index, 2);

        string._runs = [
            { range: JSRange(0, 5) },
            { range: JSRange(5, 8) },
            { range: JSRange(13, 1) },
            { range: JSRange(14, 10) }
        ];
        index = string._runIndexForStringIndex(0);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(2);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(4);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(5);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(6);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(12);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(13);
        TKAssertExactEquals(index, 2);
        index = string._runIndexForStringIndex(14);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(15);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(23);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(24);
        TKAssertExactEquals(index, 3);

        string._runs = [
            { range: JSRange(0, 5) },
            { range: JSRange(5, 8) },
            { range: JSRange(13, 1) },
            { range: JSRange(14, 10) },
            { range: JSRange(24, 3) }
        ];
        index = string._runIndexForStringIndex(0);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(2);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(4);
        TKAssertExactEquals(index, 0);
        index = string._runIndexForStringIndex(5);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(6);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(12);
        TKAssertExactEquals(index, 1);
        index = string._runIndexForStringIndex(13);
        TKAssertExactEquals(index, 2);
        index = string._runIndexForStringIndex(14);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(15);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(23);
        TKAssertExactEquals(index, 3);
        index = string._runIndexForStringIndex(24);
        TKAssertExactEquals(index, 4);
        index = string._runIndexForStringIndex(25);
        TKAssertExactEquals(index, 4);
        index = string._runIndexForStringIndex(26);
        TKAssertExactEquals(index, 4);
        index = string._runIndexForStringIndex(27);
        TKAssertExactEquals(index, 4);

    },

    testSetAttributes: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var range = JSRange(0, 5);
        string.setAttributesInRange({bold: true, italics: true}, range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
    },

    testAddAttributes: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var range = JSRange(0, 5);
        string.addAttributesInRange({italics: true}, range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
    },

    testAddAttribute: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var range = JSRange(0, 5);
        string.addAttributeInRange('italics', true, range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
    },

    testRemoveAttributes: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true, italics: true, underline: true});
        var range = JSRange(0, 5);
        string.removeAttributesInRange(['bold', 'italics'], range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
    },

    testRemoveAttribute: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true, italics: true, underline: true});
        var range = JSRange(0, 5);
        string.removeAttributeInRange('bold', range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
    },

    testRemoveAllAttributes: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true, italics: true, underline: true});
        var range = JSRange(0, 5);
        string.removeAllAttributesInRange(range);
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(2);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(string.string.length);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, true);
    },

    testAppendPlain: function(){
        var string = JSAttributedString.init();
        var attributes;
        string.appendString("Hello");
        TKAssertEquals(string.string, "Hello");
        this.assertRunIteratorIsConsistent(string);
        string.appendString(", world!");
        TKAssertEquals(string.string, "Hello, world!");
        this.assertRunIteratorIsConsistent(string);

        string = JSAttributedString.init();
        string.addAttributeInRange('bold', true, JSRange(0, 0));
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        string.appendString("Hello");
        TKAssertEquals(string.string, "Hello");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(4);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        string.appendString(", world!");
        TKAssertEquals(string.string, "Hello, world!");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(4);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(12);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(13);
        TKAssertExactEquals(attributes.bold, true);
    },

    testAppendAttributed: function(){
        var string = JSAttributedString.init();
        var attributes;
        var append = JSAttributedString.initWithString("Hello", {bold: true});
        string.appendAttributedString(append);
        TKAssertEquals(string.string, "Hello");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);

        append = JSAttributedString.initWithString(", world!", {italics: true});
        string.appendAttributedString(append);
        TKAssertEquals(string.string, "Hello, world!");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(0);
        TKAssertUndefined(attributes.italics);
        attributes = string.attributesAtIndex(8);
        TKAssertUndefined(attributes.bold);
        attributes = string.attributesAtIndex(8);
        TKAssertExactEquals(attributes.italics, true);
    },

    testInsertPlain: function(){
        var string;
        var attributes;
        string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        string.addAttributeInRange('italics', true, JSRange(5,8));
        string.insertString(" there", 5);
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(4);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(12);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(13);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(18);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(19);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
    },

    testInsertAttributed: function(){
        var string;
        var attributes;
        string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var attributed = JSAttributedString.initWithString(" there", {italics: true});
        string.insertAttributedString(attributed, 5);
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(4);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(12);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(13);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(18);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(19);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
    },

    testDelete: function(){
        var string = JSAttributedString.initWithString("Hello, world!");
        var range = JSRange(0, 13);
        var attributes = {bold: true};
        string.setAttributesInRange(attributes, range);
        range = JSRange(5, 8);
        string.deleteCharactersInRange(range);
        TKAssertExactEquals(string.string.length, 5);
        TKAssertEquals(string.string, "Hello");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(0);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(4);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);

        string = JSAttributedString.initWithString("abcd");
        range = JSRange(2, 1);
        string.deleteCharactersInRange(range);
        TKAssertExactEquals(string.string.length, 3);
        TKAssertEquals(string.string, "abd");
        this.assertRunIteratorIsConsistent(string);
    },

    testFixRuns: function(){
        var string = JSAttributedString.initWithString("abcd");
        var range = JSRange(2, 1);
        string.deleteCharactersInRange(range);
        TKAssertExactEquals(string.string.length, 3);
        TKAssertEquals(string.string, "abd");
        this.assertRunIteratorCount(string, 1);
    },

    testReplacePlain: function(){
        var string = JSAttributedString.initWithString("Hello, world!");
        var range = JSRange(0, 13);
        var attributes = {bold: true};
        string.setAttributesInRange(attributes, range);
        range = JSRange(7, 5);
        string.replaceCharactersInRangeWithString(range, "everyone");
        TKAssertEquals(string.string, "Hello, everyone!");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(8);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(15);
        TKAssertExactEquals(attributes.bold, true);
        attributes = string.attributesAtIndex(16);
        TKAssertExactEquals(attributes.bold, true);

        string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        string.addAttributeInRange('italics', true, JSRange(7, 6));
        range = JSRange(5, 7);
        string.replaceCharactersInRangeWithString(range, " there, everyone");
        TKAssertEquals(string.string, "Hello there, everyone!");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(8);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(20);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(21);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(22);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);

        string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        string.addAttributeInRange('italics', true, JSRange(7, 6));
        range = JSRange(7, 5);
        string.replaceCharactersInRangeWithString(range, "everyone");
        TKAssertEquals(string.string, "Hello, everyone!");
        this.assertRunIteratorIsConsistent(string);
        attributes = string.attributesAtIndex(5);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(6);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(8);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(14);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(15);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(16);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
    },

    testReplaceAttributed: function(){
        var string = JSAttributedString.initWithString("Hello, world!", {bold: true});
        var range = JSRange(0, 13);
        range = JSRange(7, 5);
        var attributed = JSAttributedString.initWithString("everyone", {italics: true});
        string.replaceCharactersInRangeWithAttributedString(range, attributed);
        TKAssertEquals(string.string, "Hello, everyone!");
        this.assertRunIteratorIsConsistent(string);
        var attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(7);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(8);
        TKAssertExactEquals(attributes.bold, undefined);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(15);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(16);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
    },

    assertRunIteratorIsConsistent: function(attributedString){
        var iterator = attributedString.runIterator();
        var expectedLocation = 0;
        while (iterator.range.length > 0){
            TKAssertEquals(iterator.range.location, expectedLocation);
            expectedLocation += iterator.range.length;
            iterator.increment();
        }
    },

    assertRunIteratorCount: function(attributedString, expectedCount){
        var iterator = attributedString.runIterator();
        var count = 0;
        while (iterator.range.length > 0){
            iterator.increment();
            count++;
        }
        TKAssertEquals(count, expectedCount);
    }

    
});