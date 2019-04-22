// #import Foundation
// #import "TKAssert.js"
/* global JSObject, JSClass, JSBundle, TKAssertion, TKTestSuite, performance */
'use strict';

JSClass("TKTestSuite", JSObject, {

    expectation: null,
    bundle: null,

    init: function(){
    },

    setup: function(){
    },

    teardown: function(){
    },

    now: function(){
        return performance.now();
    },

    wait: function(expectation, timeout){
        this.expectation = expectation;
        // The expectation may be done already if its callback was called immediately
        // instead of asynchronously
        if (expectation.isDone){
            return;
        }
        expectation.setTimeout(timeout);
    },

    getResourceData: function(resourceName, ext, completion, target){
        var metadata = this.bundle.metadataForResourceName(resourceName, ext);
        this.bundle.getResourceData(metadata, completion, target);
    }

});

TKTestSuite.RegisteredTestSuites = [];

TKTestSuite.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.RegisteredTestSuites.push(subclass);
    this._FindTests(subclass);
    return subclass;
};

TKTestSuite._FindTests = function(subclass){
    var names = Object.getOwnPropertyNames(subclass.prototype);
    subclass.cases = [];
    var x;
    for (var i = 0, l = names.length; i < l; ++i){
        x = names[i];
        if (x.length > 4 && x.substr(0,4) == 'test' && x[4] >= 'A' && x[4] <= 'Z'){
            subclass.cases.push(x);
        }
    }
};