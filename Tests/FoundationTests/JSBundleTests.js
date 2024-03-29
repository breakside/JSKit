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

JSClass('JSBundleTests', TKTestSuite, {

    setup: function(){
        this.originalPreferredLanguages = JSLocale.preferredLanguages;
        JSBundle.bundles['io.breakside.Test'] = {
            'Info': {
                'a': 1,
                'b': 2,
                'JSDevelopmentLanguage': 'en',
                'JSLocalizations': ['en', 'en-GB', 'de-DE', 'zn-Hans-CN']
            },
            'Resources': [
                {'other': 123},
                {'other': 456},
                {'other': 789},
                {'strings': {
                    'color': 'Color'
                }},
                {'strings': {
                    'color': 'Colour'
                }},
                {'strings': {
                    'color': 'Farbe'
                }},
                {'strings': {
                    'color': '颜色'
                }},
                {'strings': {
                    'testing': 'Testing',
                    'testing2': 'Testing 2'
                }},
                {'strings': {
                    'testing': 'Testen'
                }}
            ],
            'ResourceLookup': {
                'global': {
                    'test1.test': [0],
                    'test1': [0],
                    'test2.test': [1],
                    'test2.xyz': [2],
                    'test2': [1, 2]
                },
                'en': {
                    'Localizable.strings.yaml': [3],
                    'Localizable.strings': [3],
                    'Test.strings.yaml': [7],
                    'Test.strings': [7]
                },
                'en-GB': {
                    'Localizable.strings.yaml': [4],
                    'Localizable.strings': [4]
                },
                'de-DE': {
                    'Localizable.strings.yaml': [5],
                    'Localizable.strings': [5],
                    'Test.strings.yaml': [8],
                    'Test.strings': [8]
                },
                'zn-Hans-CN': {
                    'Localizable.strings.yaml': [6],
                    'Localizable.strings': [6]
                }
            },
            'Fonts': {
            }
        };
    },

    teardown: function(){
        JSLocale.preferredLanguages = this.originalPreferredLanguages;
        JSLocale.ClearCache();
        delete JSBundle.bundles['io.breakside.Test'];
    },

    testContructor: function(){
        var bundle = JSBundle.initWithIdentifier('io.breakside.Test');
        TKAssertNotNull(bundle);
        TKAssertThrows(function(){
            bundle = JSBundle.initWithIdentifier('io.breakside.DoesNotExist');
        });
    },

    testInfo: function(){
        var bundle = JSBundle.initWithIdentifier('io.breakside.Test');
        var info = bundle.info;
        TKAssertNotNull(info);
        TKAssertEquals(info.a, 1);
        TKAssertEquals(info.b, 2);
    },

    testResourcesMetadata: function(){
        var bundle = JSBundle.initWithIdentifier('io.breakside.Test');
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
    },

    testLocalizedString: function(){
        var bundle = JSBundle.initWithIdentifier('io.breakside.Test');

        // Exact match in default table
        JSLocale.preferredLanguages = ['en-GB'];
        var str = bundle.localizedString("color");
        TKAssertEquals(str, "Colour");

        // Fallback match in default table
        JSLocale.preferredLanguages = ['en-US', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "Color");

        // Upgrade match in default table
        JSLocale.preferredLanguages = ['de', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "Farbe");

        // Sibling match in default table
        JSLocale.preferredLanguages = ['de-AT', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "Farbe");

        // Upgrade match in default table with script
        JSLocale.preferredLanguages = ['zn', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "颜色");

        // Upgrade match in default table with script
        JSLocale.preferredLanguages = ['zn-Hans', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "颜色");

        // Upgrade match in default table with script
        JSLocale.preferredLanguages = ['zn-Test', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "颜色");

        // Upgrade match in default table with script
        JSLocale.preferredLanguages = ['zn-Hans-XY', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "颜色");

        // Upgrade match in default table with script
        JSLocale.preferredLanguages = ['zn-Test-XY', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "颜色");

        // Missing language fallback
        JSLocale.preferredLanguages = ['fr-FR', 'en-GB'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "Colour");

        // Development language fallback
        JSLocale.preferredLanguages = ['fr-FR'];
        str = bundle.localizedString("color");
        TKAssertEquals(str, "Color");

        // Specific table
        JSLocale.preferredLanguages = ['en-US'];
        str = bundle.localizedString("testing", "Test.strings");
        TKAssertEquals(str, "Testing");
        str = bundle.localizedString("testing2", "Test.strings");
        TKAssertEquals(str, "Testing 2");

        // Specific table fallback
        JSLocale.preferredLanguages = ['de'];
        str = bundle.localizedString("testing", "Test.strings");
        TKAssertEquals(str, "Testen");
        str = bundle.localizedString("testing2", "Test.strings");
        TKAssertEquals(str, "Testing 2");
    },

    testGetResourceData: function(){
        var bundle = JSBundle.testBundle;
        var metadata = bundle.metadataForResourceName("test", "txt");
        TKAssertNotNull(metadata);
        var expectation = TKExpectation.init();
        expectation.call(bundle.getResourceData, bundle, metadata, function(data){
            TKAssertNotNull(data);
            var txt = data.stringByDecodingUTF8();
            TKAssertEquals(txt, "Hello, world!");
        });
        this.wait(expectation, 2.0);
    },

    testFileForResourceName: function(){
        var bundle = JSBundle.testBundle;
        var file = bundle.fileForResourceName("test", "txt");
        TKAssertNotNull(file);
        var expectation = TKExpectation.init();
        expectation.call(file.readData, file, function(data){
            TKAssertNotNull(data);
            var txt = data.stringByDecodingUTF8();
            TKAssertEquals(txt, "Hello, world!");
        });
        this.wait(expectation, 2.0);
    }

    // TODO: localized resources

});