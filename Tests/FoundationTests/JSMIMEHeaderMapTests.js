// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertEquals, TKAssertExactEquals, TKAssertNotNull, TKAssertUndefined, JSMIMEHeader, JSMIMEHeaderMap */
'use strict';

JSClass("JSMIMEHeaderMapTests", TKTestSuite, {

    testHeaderConstructor: function(){
        var header = new JSMIMEHeader("Test", "123");
        TKAssertEquals(header.name, "Test");
        TKAssertEquals(header.lowerName, "test");
        TKAssertEquals(header.value, "123");
    },

    testHeaderFunctionConstructor: function(){
        var header = JSMIMEHeader("Test", "123");
        TKAssert(header instanceof JSMIMEHeader);
        TKAssertEquals(header.name, "Test");
        TKAssertEquals(header.lowerName, "test");
        TKAssertEquals(header.value, "123");
    },

    testHeaderCopyConstructor: function(){
        var header1 = new JSMIMEHeader("Test", "123");
        var header2 = JSMIMEHeader(header1);
        TKAssertEquals(header2.name, "Test");
        TKAssertEquals(header2.lowerName, "test");
        TKAssertEquals(header2.value, "123");
    },

    testConstructor: function(){
        var map = new JSMIMEHeaderMap();
        TKAssertEquals(map.headers.length, 0);
    },

    testFunctionConstructor: function(){
        var map = JSMIMEHeaderMap();
        TKAssert(map instanceof JSMIMEHeaderMap);
        TKAssertEquals(map.headers.length, 0);
    },

    testAdd: function(){
        var map = JSMIMEHeaderMap();
        map.add('Test', "123");
        TKAssertEquals(map.headers.length, 1);
        TKAssertEquals(map.headers[0].name, "Test");
    },

    testCopyConstructor: function(){
        var map1 = JSMIMEHeaderMap();
        map1.add('Test', "123");
        var map2 = JSMIMEHeaderMap(map1);
        TKAssertEquals(map2.headers.length, 1);
        TKAssertEquals(map2.headers[0].name, "Test");
        map1.unset("Test");
        TKAssertEquals(map1.headers.length, 0);
        TKAssertEquals(map2.headers.length, 1);
        TKAssertEquals(map2.headers[0].name, "Test");
    },

    testParse: function(){
        var map = JSMIMEHeaderMap();
        var lines = [
            "Test: 123",
            "Another: asdf",
            "Third:",
            "   Fourth   :     testing    ",
            "Third: again"
        ];
        map.parse(lines.join("\r\n"));
        TKAssertEquals(map.headers.length, 5);
        TKAssertEquals(map.headers[0].name, "Test");
        TKAssertEquals(map.headers[0].value, "123");
        TKAssertEquals(map.headers[1].name, "Another");
        TKAssertEquals(map.headers[1].value, "asdf");
        TKAssertEquals(map.headers[2].name, "Third");
        TKAssertEquals(map.headers[2].value, "");
        TKAssertEquals(map.headers[3].name, "Fourth");
        TKAssertEquals(map.headers[3].value, "testing");
        TKAssertEquals(map.headers[4].name, "Third");
        TKAssertEquals(map.headers[4].value, "again");
    },

    testGet: function(){
        var map = JSMIMEHeaderMap();
        map.add("Test", "123");
        map.add("Another", "asdf");
        map.add("Third", "3");
        map.add("Third", "again");
        map.add("Fourth", "");
        TKAssertEquals(map.get("Test"), "123");
        TKAssertEquals(map.get("test"), "123");
        TKAssertEquals(map.get("TEST"), "123");
        TKAssertEquals(map.get("Another"), "asdf");
        TKAssertEquals(map.get("Third"), "3");
        TKAssertUndefined(map.get("Not-There"));
        TKAssertEquals(map.get("Not-There", "default"), "default");
        TKAssertExactEquals(map.get("Fourth", "default"), "");
    },

    testGetAll: function(){
        var map = JSMIMEHeaderMap();
        map.add("Test", "123");
        map.add("Another", "asdf");
        map.add("Third", "3");
        map.add("Third", "again");
        var values = map.getAll("Test");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "123");
        values = map.getAll("test");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "123");
        values = map.getAll("TEST");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "123");
        values = map.getAll("Another");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "asdf");
        values = map.getAll("Third");
        TKAssertEquals(values.length, 2);
        TKAssertEquals(values[0], "3");
        TKAssertEquals(values[1], "again");
        values = map.getAll("Not-There");
        TKAssertEquals(values.length, 0);
    },

    testSet: function(){
        var map = JSMIMEHeaderMap();
        map.add("Test", "123");
        map.add("Another", "asdf");
        map.add("Third", "3");
        map.add("Third", "again");
        map.set("Test", "456");
        var values = map.getAll("Test");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "456");
        map.set("test", "789");
        values = map.getAll("Test");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "789");
        map.set("Third", "onlyone");
        values = map.getAll("Third");
        TKAssertEquals(values.length, 1);
        TKAssertEquals(values[0], "onlyone");
    },

    testUnset: function(){
        var map = JSMIMEHeaderMap();
        map.add("Test", "123");
        map.add("Another", "asdf");
        map.add("Third", "3");
        map.add("Third", "again");
        map.unset("Test");
        var values = map.getAll("Test");
        TKAssertEquals(values.length, 0);
        map.unset("another");
        values = map.getAll("Another");
        TKAssertEquals(values.length, 0);
        map.unset("Third");
        values = map.getAll("Third");
        TKAssertEquals(values.length, 0);
    }
});