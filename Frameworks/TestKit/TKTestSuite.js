// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
/* global JSObject, JSClass, TKAssertion , TKTestSuite*/
'use strict';

JSClass("TKTestSuite", JSObject, {

    init: function(){
    },

    setup: function(){
    },

    teardown: function(){
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