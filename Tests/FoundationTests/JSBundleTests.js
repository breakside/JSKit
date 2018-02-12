// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, TKAssert, TKAssertNull, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals, TKAssertThrows, JSBundle */
'use strict';

JSClass('JSBundleTests', TKTestSuite, {

    setup: function(){
        JSBundle.bundles['com.owenshaw.Test'] = {
            'Info': {
                'a': 1,
                'b': 2
            },
            'Resources': {
                'test1': [
                    {'kind': 'test', 'other': 123}
                ],
                'test2': [
                    {'kind': 'test', 'other': 456},
                    {'kind': 'xyz', 'other': 789},
                ]
            },
            'Fonts': {
            }
        };
    },

    teardown: function(){
        delete JSBundle.bundles['com.owenshaw.Test'];
    },

    testContructor: function(){
        var bundle = JSBundle.initWithIdentifier('com.owenshaw.Test');
        TKAssertNotNull(bundle);
        TKAssertThrows(function(){
            bundle = JSBundle.initWithIdentifier('com.owenshaw.DoesNotExist');
        });
    },

    testInfo: function(){
        var bundle = JSBundle.initWithIdentifier('com.owenshaw.Test');
        var info = bundle.info();
        TKAssertNotNull(info);
        TKAssertEquals(info.a, 1);
        TKAssertEquals(info.b, 2);
    },

    testResources: function(){
        var bundle = JSBundle.initWithIdentifier('com.owenshaw.Test');
        TKAssertEquals(bundle.hasResource('test1'), true);
        var test1Resources = bundle.resourcesNamed('test1');
        TKAssertEquals(test1Resources.length, 1);
        TKAssertEquals(test1Resources[0].kind, 'test');
        TKAssertEquals(test1Resources[0].other, 123);

        var test1 = bundle.resourceNamed('test1', 'test');
        TKAssertEquals(test1.kind, 'test');
        TKAssertEquals(test1.other, 123);

        test1 = bundle.resourceNamed('test1', 'xyz');
        TKAssertNull(test1);

        TKAssertEquals(bundle.hasResource('doesNotExist'), false);
        TKAssertThrows(function(){
            bundle = bundle.resourcesNamed('doesNotExist');
        });

        TKAssertEquals(bundle.hasResource('test2'), true);
        var test2Resources = bundle.resourcesNamed('test2');
        TKAssertEquals(test2Resources.length, 2);
        TKAssertEquals(test2Resources[0].kind, 'test');
        TKAssertEquals(test2Resources[1].kind, 'xyz');

        var test2 = bundle.resourceNamed('test2', 'test');
        TKAssertEquals(test2.kind, 'test');
        TKAssertEquals(test2.other, 456);

        test2 = bundle.resourceNamed('test2', 'xyz');
        TKAssertEquals(test2.kind, 'xyz');
        TKAssertEquals(test2.other, 789);

        test2 = bundle.resourceNamed('test2', 'abc');
        TKAssertNull(test1);
    }

});