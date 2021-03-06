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

(function(){

// Most browsers and environments already implement Promise, but a few do not.
// Since the environments without Promise are rare, it can be easier to test the
// Promise code in an environment that supports Promise, but doing so requires
// chaning our Promise polyfill class name.
// 1. Change this var PromiseClass = Promise; to var PromiseClass = JSPromise;
// 2. Make the corresponding change in Promise+JS.js
// Now any environment will have our completely custom JSPromise class, which can
// be tested for correct behavior without tracking down an old browser.
var PromiseClass = Promise;

JSClass("PromiseTests", TKTestSuite, {

    testConstructor: function(){
        TKAssertThrows(function(){
            var promise = PromiseClass(function(resolve, reject){
            });
        });
        var executed = false;
        var promise = new PromiseClass(function(resolve, reject){
            executed = true;
        });
        TKAssert(executed);
    },

    testThenHappensOnNextRunLoop: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            resolve(123);
        }).then(function(n){
            resolved = n;
        }, function(e){
            rejected = e;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertNull(rejected);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testNestedPromises: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            setTimeout(resolve, 10, 123);
        }).then(function(n){
            return new PromiseClass(function(resolve, reject){
                setTimeout(resolve, 10, n * 2);
            });
        }).then(function(n){
            resolved = n;
        }, function(e){
            rejected = e;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 246);
            TKAssertNull(rejected);
        }, 200);
        this.wait(expectation, 1.0);
    },

    testException: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            mssingfn(resolve, 10, 123);
        }).then(function(n){
            return new PromiseClass(function(resolve, reject){
                setTimeout(resolve, 10, n * 2);
            });
        }).then(function(n){
            resolved = n;
        }, function(e){
            rejected = e;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertNotNull(rejected);
            TKAssert(rejected instanceof Error);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testThenHappensOnNextRunLoopReject: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject("abc");
        }).then(function(n){
            resolved = n;
        }, function(e){
            rejected = e;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(rejected, "abc");
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testCatch: function(){
        var caught = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject("abc");
        }).catch(function(e){
            caught = e;
        });
        TKAssertNull(caught);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(caught, "abc");
        }, 50);
        this.wait(expectation, 1.0);
    },

    testFinallySuccess: function(){
        var finallyRan = false;
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            resolve(123);
        }).finally(function(){
            finallyRan = true;
        }).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssert(!finallyRan);
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssert(finallyRan);
            TKAssertEquals(resolved, 123);
            TKAssertNull(rejected);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testFinallyError: function(){
        var finallyRan = false;
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject("abc");
        }).finally(function(){
            finallyRan = true;
        }).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssert(!finallyRan);
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssert(finallyRan);
            TKAssertEquals(rejected, "abc");
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testRejectToSuccess: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject(123);
        }).then(function(value){
            return value;
        }, function(reason){
            return reason;
        }).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertNull(rejected);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testRejectPassthrough: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject(123);
        }).then(function(value){
            return value;
        }, function(reason){
            return PromiseClass.reject(reason);
        }).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(rejected, 123);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testRejectFallthrough: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            reject(123);
        }).then(function(value){
            return value;
        }).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(rejected, 123);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testResolve: function(){
        var resolved = null;
        var rejected = null;
        PromiseClass.resolve(123).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertNull(rejected);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testResolveWithPromise: function(){
        var resolved = null;
        var rejected = null;
        var promise = new PromiseClass(function(resolve, reject){
            setTimeout(resolve, 50, 123);
        });
        PromiseClass.resolve(promise).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertNull(rejected);
        }, 60);
        this.wait(expectation, 1.0);
    },

    testReject: function(){
        var resolved = null;
        var rejected = null;
        PromiseClass.reject(123).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(rejected, 123);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testRejectWithPromise: function(){
        var resolved = null;
        var rejected = null;
        var promise = PromiseClass.reject(123);
        PromiseClass.reject(promise).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        promise.then(function(){}, function(){});
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertNotNull(rejected);
            TKAssert(rejected instanceof PromiseClass);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testRejectResolved: function(){
        var resolved = null;
        var rejected = null;
        PromiseClass.reject(PromiseClass.resolve(123)).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertNotNull(rejected);
            TKAssert(rejected instanceof PromiseClass);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testResolveRejected: function(){
        var resolved = null;
        var rejected = null;
        PromiseClass.resolve(PromiseClass.reject(123)).then(function(value){
            resolved = value;
        }, function(reason){
            rejected = reason;
        });
        TKAssertNull(resolved);
        TKAssertNull(rejected);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(rejected, 123);
            TKAssertNull(resolved);
        }, 50);
        this.wait(expectation, 1.0);
    },

    testCompletion: function(){
        var completion = PromiseClass.completion();
        TKAssertEquals(typeof(completion), "function");
        TKAssertNotUndefined(completion.promise);
        TKAssertNotNull(completion.promise);
        TKAssert(completion.promise instanceof PromiseClass);
        var resolved;
        var rejected;
        completion.promise.then(function(value){
            resolved = value;
        }, function(value){
            rejected = value;
        });
        TKAssertUndefined(resolved);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertUndefined(rejected);
        });
        completion(123);
        this.wait(expectation, 1.0);
    },

    testCompletionResolveNonNull: function(){
        var completion = PromiseClass.completion(PromiseClass.resolveNonNull);
        var resolved;
        var rejected;
        completion.promise.then(function(value){
            resolved = value;
        }, function(value){
            rejected = value;
        });
        TKAssertUndefined(resolved);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved, 123);
            TKAssertUndefined(rejected);
        });
        completion(123);
        this.wait(expectation, 1.0);
    },

    testCompletionRejectNull: function(){
        var completion = PromiseClass.completion(PromiseClass.resolveNonNull);
        var resolved;
        var rejected = false;
        completion.promise.then(function(value){
            resolved = value;
        }, function(value){
            rejected = true;
        });
        TKAssertUndefined(resolved);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertUndefined(resolved);
            TKAssert(rejected);
        });
        completion(null);
        this.wait(expectation, 1.0);
    },

    testCompletionResolveTrue: function(){
        var completion = PromiseClass.completion(PromiseClass.resolveTrue);
        var resolved = false;
        var rejected = false;
        completion.promise.then(function(){
            resolved = true;
        }, function(){
            rejected = true;
        });
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssert(resolved);
            TKAssert(!rejected);
        });
        completion(true);
        this.wait(expectation, 1.0);
    },

    testCompletionRejectFalse: function(){
        var completion = PromiseClass.completion(PromiseClass.resolveTrue);
        var resolved = false;
        var rejected = false;
        completion.promise.then(function(){
            resolved = true;
        }, function(){
            rejected = true;
        });
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssert(!resolved);
            TKAssert(rejected);
        });
        completion(false);
        this.wait(expectation, 1.0);
    },

    testCompletionResolveKeyed: function(){
        var completion = PromiseClass.completion(PromiseClass.resolveKeyed('one', 'two', 'three'));
        var resolved;
        var rejected;
        completion.promise.then(function(value){
            resolved = value;
        }, function(value){
            rejected = value;
        });
        TKAssertUndefined(resolved);
        var expectation = TKExpectation.init();
        expectation.call(setTimeout, JSGlobalObject, function(){
            TKAssertEquals(resolved.one, 1);
            TKAssertEquals(resolved.two, 2);
            TKAssertEquals(resolved.three, 3);
            TKAssertUndefined(rejected);
        });
        completion(1, 2, 3);
        this.wait(expectation, 1.0);
    }

});

})();