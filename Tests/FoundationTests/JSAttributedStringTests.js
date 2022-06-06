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

JSClass('JSAttributedStringTests', TKTestSuite, {

    bundle: null,
    fontDescriptors: null,

    setup: function(){
        this.bundle = JSBundle.initWithDictionary({
            Info: {},
            Resources: [
                JSAttributedStringMockFontDescriptor.Resources.normal,
                JSAttributedStringMockFontDescriptor.Resources.bold,
                JSAttributedStringMockFontDescriptor.Resources.boldItalic,
            ],
            ResourceLookup:{
                global: {
                    "Dummy-Regular": [0],
                    "Dummy-Regular.otf": [0],
                    "Dummy-Bold": [1],
                    "Dummy-Bold.otf": [1],
                    "Dummy-BoldItalic": [2],
                    "Dummy-BoldItalic.otf": [2],
                }
            },
            Fonts: [
                 0,
                 1,
                 2
            ]
        });
        this.fontDescriptors = JSFont.registerBundleFonts(this.bundle);
    },

    teardown: function(){
        JSFont.unregisterAllFonts();
    },

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
        var range = JSRange(0, 2);
        string.setAttributesInRange({bold: true, italics: true}, range);
        range = JSRange(2, 3);
        string.setAttributesInRange({bold: true, italics: true}, range);
        range = string.rangeOfRunAtIndex(1);
        TKAssertExactEquals(range.location, 0);
        TKAssertExactEquals(range.length, 5);
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

        // Setup for deleting last char...deleting next to last should preserve attributes
        string = JSAttributedString.initWithString("ab", {bold: true});
        string.deleteCharactersInRange(JSRange(1,1));
        TKAssertEquals(string.string.length, 1);
        TKAssertEquals(string.string, "a");
        attributes = string.attributesAtIndex(0);
        TKAssert(attributes.bold);
        this.assertRunIteratorIsConsistent(string);

        // Deleting last character should preserve attributes
        string.deleteCharactersInRange(JSRange(0,1));
        TKAssertEquals(string.string.length, 0);
        attributes = string.attributesAtIndex(0);
        TKAssert(attributes.bold);
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

    testReplaceFormat: function(){
        var string = JSAttributedString.initWithString("This is a %s", {bold: true});
        string.replaceFormat("test");
        TKAssertEquals(string.string, "This is a test");
        var attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(14);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);


        string = JSAttributedString.initWithString("This is a %s", {bold: true});
        string.replaceFormat("test", {italics: true});
        TKAssertEquals(string.string, "This is a test");
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        attributes = string.attributesAtIndex(14);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);


        string = JSAttributedString.initWithString("This is a %s of %s placeholders", {bold: true});
        string.replaceFormat("test", {italics: true}, "replacing", {underline: true});
        TKAssertEquals(string.string, "This is a test of replacing placeholders");
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, true);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(14);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(15);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(17);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(18);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(19);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(26);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, true);
        attributes = string.attributesAtIndex(27);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);
        attributes = string.attributesAtIndex(40);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        TKAssertExactEquals(attributes.underline, undefined);

        string = JSAttributedString.initWithString("This %%s a %s", {bold: true});
        string.replaceFormat("test");
        TKAssertEquals(string.string, "This %s a test");
        attributes = string.attributesAtIndex(1);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(10);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(11);
        TKAssertExactEquals(attributes.bold, true);
        TKAssertExactEquals(attributes.italics, undefined);
        attributes = string.attributesAtIndex(14);
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
    },

    testLongestRangeOfAttributeAtIndex: function(){
        var str = JSAttributedString.init();
        str.appendAttributedString(JSAttributedString.initWithString("one ", {bold: true, link: JSURL.initWithString("https://test.jskit.dev")}));
        str.appendAttributedString(JSAttributedString.initWithString("two ", {link: JSURL.initWithString("https://test.jskit.dev")}));
        str.appendAttributedString(JSAttributedString.initWithString("three ", {textColor: JSColor.blue, link: JSURL.initWithString("https://test.jskit.dev")}));
        str.appendAttributedString(JSAttributedString.initWithString("four ", {textColor: JSColor.blue}));
        str.appendAttributedString(JSAttributedString.initWithString("five ", {bold: false, link: JSURL.initWithString("https://test.jskit.dev")}));
        var range = str.longestRangeOfAttributeAtIndex("link", 0);
        TKAssertExactEquals(range.location, 0);
        TKAssertExactEquals(range.length, 14);
        range = str.longestRangeOfAttributeAtIndex("bold", 0);
        TKAssertExactEquals(range.location, 0);
        TKAssertExactEquals(range.length, 4);
        range = str.longestRangeOfAttributeAtIndex("bold", 5);
        TKAssertExactEquals(range.location, 4);
        TKAssertExactEquals(range.length, 20);
        range = str.longestRangeOfAttributeAtIndex("textColor", 5);
        TKAssertExactEquals(range.location, 0);
        TKAssertExactEquals(range.length, 8);
        range = str.longestRangeOfAttributeAtIndex("textColor", 8);
        TKAssertExactEquals(range.location, 8);
        TKAssertExactEquals(range.length, 11);
    },

    testDictionaryRepresentation: function(){
        var string = JSAttributedString.initWithString("test", {bold: true});
        var dictionary = string.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.string, "test");
        TKAssertExactEquals(dictionary.runs.length, 1);
        TKAssertExactEquals(dictionary.runs[0].length, 4);
        TKAssertExactEquals(dictionary.runs[0].attributes.bold, true);

        string.setAttributesInRange({textColor: JSColor.initWithRGBA(0, 0.5, 1)}, JSRange(1, 2));
        dictionary = string.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.string, "test");
        TKAssertExactEquals(dictionary.runs.length, 3);
        TKAssertExactEquals(dictionary.runs[0].length, 1);
        TKAssertExactEquals(dictionary.runs[0].attributes.bold, true);
        TKAssertExactEquals(dictionary.runs[0].attributes.textColor, undefined);
        TKAssertExactEquals(dictionary.runs[1].length, 2);
        TKAssertExactEquals(dictionary.runs[1].attributes.bold, undefined);
        TKAssertExactEquals(dictionary.runs[1].attributes.textColor.space, "rgb");
        TKAssertExactEquals(dictionary.runs[1].attributes.textColor.components.length, 4);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[0], 0);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[1], 0.5);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[2], 1);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[3], 1);
        TKAssertExactEquals(dictionary.runs[2].length, 1);
        TKAssertExactEquals(dictionary.runs[2].attributes.bold, true);
        TKAssertExactEquals(dictionary.runs[2].attributes.textColor, undefined);

        var font = JSFont.initWithDescriptor(this.fontDescriptors[0], 20);
        string.addAttributesInRange({font: font}, JSRange(0, 4));
        dictionary = string.dictionaryRepresentation();
        TKAssertExactEquals(dictionary.string, "test");
        TKAssertExactEquals(dictionary.runs.length, 3);
        TKAssertExactEquals(dictionary.runs[0].length, 1);
        TKAssertExactEquals(dictionary.runs[0].attributes.bold, true);
        TKAssertExactEquals(dictionary.runs[0].attributes.textColor, undefined);
        TKAssertExactEquals(dictionary.runs[0].attributes.font.family, "Dummy");
        TKAssertExactEquals(dictionary.runs[0].attributes.font.weight, 400);
        TKAssertExactEquals(dictionary.runs[0].attributes.font.style, "normal");
        TKAssertExactEquals(dictionary.runs[0].attributes.font.size, 20);
        TKAssertExactEquals(dictionary.runs[1].length, 2);
        TKAssertExactEquals(dictionary.runs[1].attributes.bold, undefined);
        TKAssertExactEquals(dictionary.runs[1].attributes.textColor.space, "rgb");
        TKAssertExactEquals(dictionary.runs[1].attributes.textColor.components.length, 4);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[0], 0);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[1], 0.5);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[2], 1);
        TKAssertFloatEquals(dictionary.runs[1].attributes.textColor.components[3], 1);
        TKAssertExactEquals(dictionary.runs[1].attributes.font.family, "Dummy");
        TKAssertExactEquals(dictionary.runs[1].attributes.font.weight, 400);
        TKAssertExactEquals(dictionary.runs[1].attributes.font.style, "normal");
        TKAssertExactEquals(dictionary.runs[1].attributes.font.size, 20);
        TKAssertExactEquals(dictionary.runs[2].length, 1);
        TKAssertExactEquals(dictionary.runs[2].attributes.bold, true);
        TKAssertExactEquals(dictionary.runs[2].attributes.textColor, undefined);
        TKAssertExactEquals(dictionary.runs[2].attributes.font.family, "Dummy");
        TKAssertExactEquals(dictionary.runs[2].attributes.font.weight, 400);
        TKAssertExactEquals(dictionary.runs[2].attributes.font.style, "normal");
        TKAssertExactEquals(dictionary.runs[2].attributes.font.size, 20);
    },

    testInitFromDictionary: function(){
        var dictionary = {
            string: "test",
            runs: [
                {
                    location: 0,
                    length: 4,
                    attributes: {
                        bold: true
                    }
                }
            ]
        };
        var string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 4));
        TKAssertExactEquals(string.attributeAtIndex("bold", 0), true);

        dictionary = {
            string: "test",
            runs: [
                {
                    length: 1,
                    attributes: {
                        bold: true,
                        font: {
                            family: "Dummy",
                            weight: 700,
                            style: "italic",
                            size: 30
                        }
                    }
                },
                {
                    length: 2,
                    attributes: {
                        textColor: {
                            space: "rgb",
                            components: [0, 0.5, 1, 1]
                        }
                    }
                },
                {
                    length: 1,
                    attributes: {
                        bold: true
                    }
                },
            ]
        };
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 1));
        TKAssertExactEquals(string.attributeAtIndex("bold", 0), true);
        var font = string.attributeAtIndex("font", 0);
        TKAssertExactEquals(font.descriptor, this.fontDescriptors[2]);
        TKAssertExactEquals(font.pointSize, 30);
        TKAssertObjectEquals(string.rangeOfRunAtIndex(1), JSRange(1, 2));
        TKAssertExactEquals(string.attributeAtIndex("bold", 1), undefined);
        var color = string.attributeAtIndex("textColor", 1);
        TKAssertInstance(color, JSColor);
        TKAssertFloatEquals(color.red, 0);
        TKAssertFloatEquals(color.green, 0.5);
        TKAssertFloatEquals(color.blue, 1);
        TKAssertFloatEquals(color.alpha, 1);

        dictionary = {};
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 0));


        dictionary = {
            string: "test"
        };
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 4));

        dictionary = {
            string: "test",
            runs: [
                {
                    length: 1,
                    attributes: {
                        bold: true
                    }
                },
            ]
        };
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 1));
        TKAssertObjectEquals(string.rangeOfRunAtIndex(1), JSRange(1, 3));
        TKAssertExactEquals(string.attributeAtIndex("bold", 1), undefined);

        dictionary = {
            string: "test",
            runs: [
                {
                    length: 1,
                    attributes: {
                        bold: true
                    }
                },
                {
                    length: 20,
                    attributes: {
                        textColor: {
                            space: "rgb",
                            components: [0, 0.5, 1, 1]
                        }
                    }
                },
                {
                    length: 1,
                    attributes: {
                        bold: true
                    }
                },
            ]
        };
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 1));
        TKAssertObjectEquals(string.rangeOfRunAtIndex(1), JSRange(1, 3));
        TKAssertObjectEquals(string.rangeOfRunAtIndex(4), JSRange(1, 3));

        dictionary = {
            string: "test",
            runs: [
                {
                    length: 10,
                    attributes: {
                        bold: true
                    }
                },
                {
                    length: 20,
                    attributes: {
                        textColor: {
                            space: "rgb",
                            components: [0, 0.5, 1, 1]
                        }
                    }
                },
                {
                    length: 1,
                    attributes: {
                        bold: true
                    }
                },
            ]
        };
        string = JSAttributedString.initFromDictionary(dictionary);
        TKAssertExactEquals(string.string, "test");
        TKAssertObjectEquals(string.rangeOfRunAtIndex(0), JSRange(0, 4));
        TKAssertObjectEquals(string.rangeOfRunAtIndex(4), JSRange(0, 4));
    }
    
});


JSClass("JSAttributedStringMockFontDescriptor", JSFontDescriptor, {

    init: function(){
        this._family = "Dummy";
        this._weight = JSFont.Weight.regular;
        this._style = JSFont.Style.normal;
        this._face = "NA";
        this._postScriptName = "Dummy";
        this._ascender = 1700;
        this._descender = -300;
        this._unitsPerEM = 2048;
    },

    descriptorWithWeight: function(weight){
        var descriptor = JSAttributedStringMockFontDescriptor.init();
        descriptor._weight = weight;
        return descriptor;
    },

    descriptorWithStyle: function(style){
        var descriptor = JSAttributedStringMockFontDescriptor.init();
        descriptor._style = style;
        return descriptor;
    },

    widthOfGlyph: function(){
        return 1;
    }
});

JSAttributedStringMockFontDescriptor.Resources = {
    normal: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Regular",
            family: "Dummy",
            name: "Dummy Regular",
            postscript_name: "Dummy-Regular",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-regular",
            unitsPerEM: 2048,
            weight: 400,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    },
    bold: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Bold",
            family: "Dummy",
            name: "Dummy Bold",
            postscript_name: "Dummy-Bold",
            style: "normal",
            unique_identifier: "UIKitTesting;dummy-bold",
            unitsPerEM: 2048,
            weight: 700,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    },
    boldItalic: {
        font: {
            ascender: 1700,
            cmap: {
                format: 13,
                data: "eJwBEADv/wEAAAAAAAAA/////wAAAAAaBgP+",
            },
            descender: -300,
            face: "Bold Italic",
            family: "Dummy",
            name: "Dummy Bold Italic",
            postscript_name: "Dummy-BoldItalic",
            style: "italic",
            unique_identifier: "UIKitTesting;dummy-bold-italic",
            unitsPerEM: 2048,
            weight: 700,
            widths: "eJwBAgD9/wAIAAoACQ=="
        }
    }
};