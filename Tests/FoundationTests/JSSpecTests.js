// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, JSObject, TKTestSuite, JSSpec, JSPropertyList, JSSpecTests, JSSpecTestsObject */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSClass("JSSpecTests", TKTestSuite, {

    testResolvedValue: function(){
        var plist = JSPropertyList.initWithObject({
            "Number": 123,
            "String": "abc",
            "Boolean": true,
            "Object": {
                a: 1,
                b: 2
            }
        });
        var spec = JSSpec.initWithPropertyList(plist);
        TKAssertExactEquals(spec.resolvedValue(plist.Number), 123);
        TKAssertExactEquals(spec.resolvedValue(plist.String), "abc");
        TKAssertExactEquals(spec.resolvedValue(plist.Boolean), true);
        TKAssertExactEquals(spec.resolvedValue(plist.Object), plist.Object);
    },

    testResolvedVariable: function(){
        var plist = JSPropertyList.initWithObject({
            "test1": "$JSSpecTests.StaticTest",
            "test2": "\\$JSSpecTests.StaticTest"
        });
        var spec = JSSpec.initWithPropertyList(plist);
        TKAssertExactEquals(spec.resolvedValue(plist.test1), "hello");
        TKAssertExactEquals(spec.resolvedValue(plist.test2), "$JSSpecTests.StaticTest");
    },

    testInstantiatedObject: function(){
        var plist = JSPropertyList.initWithObject({
            "test1": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            }
        });
        var spec = JSSpec.initWithPropertyList(plist);
        var obj = spec.resolvedValue(plist.test1);
        TKAssert(obj.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(obj.test, 12);
    },

    testResolvedObject: function(){
        var plist = JSPropertyList.initWithObject({
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "test2": "/Test One"
        });
        var spec = JSSpec.initWithPropertyList(plist);
        var obj = spec.resolvedValue(plist.test2);
        TKAssert(obj.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(obj.test, 12);
    },

    testSingleInstantiation: function(){
        var plist = JSPropertyList.initWithObject({
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "test2": "/Test One"
        });
        var spec = JSSpec.initWithPropertyList(plist);
        var obj1 = spec.resolvedValue(plist.test2);
        var obj2 = spec.resolvedValue(plist.test2);
        TKAssertExactEquals(obj1, obj2);
        TKAssertEquals(obj1.test, 12);
    },

    testFilesOwner: function(){
        var plist = JSPropertyList.initWithObject({
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "File's Owner": "/Test One"
        });
        var spec = JSSpec.initWithPropertyList(plist);
        var owner = spec.filesOwner();
        TKAssert(owner.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(owner.test, 12);
    },

    testCircularReference: function(){
        var plist = JSPropertyList.initWithObject({
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12,
                "target": "/Test Two",
            },
            "Test Two": {
                "class": "JSSpecTestsObject",
                "target": "/Test One"
            },
            "File's Owner": "/Test One"
        });
        var spec = JSSpec.initWithPropertyList(plist);
        var owner = spec.filesOwner();
        TKAssertNotNull(owner);
    }

});

JSClass("JSSpecTestsObject", JSObject, {
    test: 0,
    target: null,

    initWithSpec: function(spec, values){
        JSSpecTestsObject.$super.initWithSpec.call(this, spec, values);
        this.test = values.testKey;
        if ('target' in values){
            this.target = spec.resolvedValue(values.target);
        }
    }
});

JSSpecTests.StaticTest = "hello";