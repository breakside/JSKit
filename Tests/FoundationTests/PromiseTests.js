// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSPromise, TKExpectation, JSGlobalObject, setTimeout */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
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
        }, 50);
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
    }

});

})();