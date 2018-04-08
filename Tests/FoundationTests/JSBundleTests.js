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
            'Resources': [
                {'other': 123},
                {'other': 456},
                {'other': 789},
            ],
            'ResourceLookup': {
                'global': {
                    'test1.test': [0],
                    'test1': [0],
                    'test2.test': [1],
                    'test2.xyz': [2],
                    'test2': [1, 2]
                }
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

    testResourcesMetadata: function(){
        var bundle = JSBundle.initWithIdentifier('com.owenshaw.Test');
        var test1 = bundle.metadataForResourceName('test1');
        TKAssertEquals(test1.other, 123);

        test1 = bundle.metadataForResourceName('test1', 'test');
        TKAssertEquals(test1.other, 123);

        test1 = bundle.metadataForResourceName('test1.test');
        TKAssertEquals(test1.other, 123);

        test1 = bundle.metadataForResourceName('test1.xyz');
        TKAssertNull(test1);

        test1 = bundle.metadataForResourceName('test1', 'xyz');
        TKAssertNull(test1);

        var missing = bundle.metadataForResourceName('doesNotExist');
        TKAssertNull(missing);

        var test2 = bundle.metadataForResourceName('test2', 'test');
        TKAssertEquals(test2.other, 456);

        test2 = bundle.metadataForResourceName('test2.test');
        TKAssertEquals(test2.other, 456);

        test2 = bundle.metadataForResourceName('test2');
        TKAssertEquals(test2.other, 456);

        test2 = bundle.metadataForResourceName('test2', 'xyz');
        TKAssertEquals(test2.other, 789);

        test2 = bundle.metadataForResourceName('test2.xyz');
        TKAssertEquals(test2.other, 789);

        test2 = bundle.metadataForResourceName('test2', 'abc');
        TKAssertNull(test2);
    }

});