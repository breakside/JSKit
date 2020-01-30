// #import Foundation
// #import TestKit
'use strict';

JSClass("JSSpecTests", TKTestSuite, {

    testValueForKey: function(){
        var dictionary = {
            "Number": 123,
            "String": "abc",
            "Boolean": true,
            "Object": {
                a: 1,
                b: 2
            }
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        TKAssertExactEquals(spec.valueForKey("Number"), 123);
        TKAssertExactEquals(spec.valueForKey("String"), "abc");
        TKAssertExactEquals(spec.valueForKey("Boolean"), true);
        var obj = spec.valueForKey("Object");
        TKAssert(obj.isKindOfClass(JSSpec));
        TKAssertExactEquals(obj.valueForKey('a'), 1);
        TKAssertExactEquals(obj.valueForKey('b'), 2);
    },

    testGlobalVariable: function(){
        var dictionary = {
            "test1": "$JSSpecTests.StaticTest",
            "test2": "\\$JSSpecTests.StaticTest"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        TKAssertExactEquals(spec.valueForKey("test1"), "hello");
        TKAssertExactEquals(spec.valueForKey("test2"), "$JSSpecTests.StaticTest");
    },

    testInstantiatedObject: function(){
        var dictionary = {
            "test1": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            }
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var obj = spec.valueForKey("test1");
        TKAssert(obj.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(obj.test, 12);
    },

    testReferencedObject: function(){
        var dictionary = {
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "test2": "/Test One"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var obj = spec.valueForKey("test2");
        TKAssert(obj.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(obj.test, 12);
    },

    testSingleInstantiation: function(){
        var dictionary = {
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "test2": "/Test One"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var obj1 = spec.valueForKey("test2");
        var obj2 = spec.valueForKey("test2");
        TKAssertExactEquals(obj1, obj2);
        TKAssertEquals(obj1.test, 12);
    },

    testFilesOwner: function(){
        var dictionary = {
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12
            },
            "File's Owner": "/Test One"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var owner = spec.filesOwner;
        TKAssert(owner.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(owner.test, 12);
    },

    testCircularReference: function(){
        var dictionary = {
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
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var owner = spec.filesOwner;
        TKAssertNotNull(owner);
    },

    testBindings: function(){
        var dictionary = {
            "Test One": {
                "class": "JSSpecTestsObject",
                "testKey": 12,
                "bindings": {
                    "value": {"to": "/Test Two", "value": "test"}
                }
            },
            "Test Two": {
                "class": "JSSpecTestsObject"
            },
            "File's Owner": "/Test One"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var one = spec.valueForKey("Test One");
        var two = spec.valueForKey("Test Two");
        two.test = 12;
        TKAssertEquals(one.value, 12);
    },

    testDefaultClass: function(){
        var dictionary = {
            "Test": {
                "class": "JSSpecTestsObject"
            },
            "Test2": "Testing",
            "File's Owner": "/Test"
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var two = spec.valueForKey("Test2", JSSpecTestsObject);
        TKAssert(two.isKindOfClass(JSSpecTestsObject));
        TKAssertEquals(two.name, "Testing");
    },

    testEnum: function(){
        var dictionary = {
            "Test": {
                "class": "JSSpecTestsObject"
            },
            "Test1": "one",
            "Test2": "two",
            "Test3": "three",
            "File's Owner": "/Test"
        };
        var TestEnum = {
            one: 'first',
            two: 'second'
        };
        var spec = JSSpec.initWithDictionary(dictionary);
        var value = spec.valueForKey("Test1", TestEnum);
        TKAssertEquals(value, TestEnum.one);
        value = spec.valueForKey("Test2", TestEnum);
        TKAssertEquals(value, TestEnum.two);
        value = spec.valueForKey("Test3", TestEnum);
        TKAssertEquals(value, 'three');
    },

});

JSClass("JSSpecTestsObject", JSObject, {
    test: 0,
    target: null,
    value: null,
    name: null,

    initWithSpec: function(spec){
        if (spec.stringValue !== null){
            this.name = spec.stringValue;
        }else{
            JSSpecTestsObject.$super.initWithSpec.call(this, spec);
            this.test = spec.valueForKey('testKey');
            if (spec.containsKey('target')){
                this.target = spec.valueForKey('target');
            }
        }
    }
});

JSSpecTests.StaticTest = "hello";