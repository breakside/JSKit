// Copyright 2022 Breakside Inc.
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

JSClass("JSUserDefaultsTests", TKTestSuite, {

    fileManager: null,

    setup: function(){
        var timestamp = (new Date()).getTime();
        this.fileManager = JSFileManager.initWithIdentifier("io.breakside.JSKit.FoundationTests-%d".sprintf(timestamp));
        var expectation = TKExpectation.init();
        expectation.call(this.fileManager.open, this.fileManager, function(state){
            TKAssertExactEquals(state, JSFileManager.State.success);
        });
        this.wait(expectation, 3.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.fileManager.destroy, this.fileManager, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 3.0);
    },

    testLifecycle: function(){
        var defaults = JSUserDefaults.initWithIdentifier("test1", this.fileManager);
        TKAssertNotNull(defaults);
        TKAssertThrows(function(){
            defaults.valueForKey("key1");
        });
        TKAssertThrows(function(){
            defaults.setValueForKey("a", "key1");
        });
        var expectation = TKExpectation.init();
        expectation.call(defaults.open, defaults, function(){
            defaults.setValueForKey("b", "key1");
            var value = defaults.valueForKey("key1");
            TKAssertEquals(value, "b");
            expectation.call(defaults.close, defaults, function(){
                TKAssertThrows(function(){
                    defaults.valueForKey("key1");
                });
                TKAssertThrows(function(){
                    defaults.setValueForKey("a", "key1");
                });
            });
        }, this);
        this.wait(expectation, 3.0);
    },

    testLifecyclePromsie: function(){
        var defaults = JSUserDefaults.initWithIdentifier("test1", this.fileManager);
        TKAssertNotNull(defaults);
        TKAssertThrows(function(){
            defaults.valueForKey("key1");
        });
        TKAssertThrows(function(){
            defaults.setValueForKey("a", "key1");
        });
        var expectation = TKExpectation.init();
        var promise = defaults.open();
        expectation.call(promise.then, promise, function(){
            defaults.setValueForKey("b", "key1");
            var value = defaults.valueForKey("key1");
            TKAssertEquals(value, "b");
            promise = defaults.close();
            expectation.call(promise.then, promise, function(){
                TKAssertThrows(function(){
                    defaults.valueForKey("key1");
                });
                TKAssertThrows(function(){
                    defaults.setValueForKey("a", "key1");
                });
            }, function(){
                TKAssert("Unexpected promise rejection");
            });
        }, function(){
            TKAssert("Unexpected promise rejection");
        });
        this.wait(expectation, 3.0);
    }

});