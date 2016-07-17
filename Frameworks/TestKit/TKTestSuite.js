// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
/* global JSObject, JSClass, TKAssertion , TKTestSuite*/
'use strict';

JSClass("TKTestSuite", JSObject, {

    testCases: null,

    init: function(){
        this.testCases = [];
        this._findTestCases();
    },

    _findTestCases: function(){
        this.testCases = [];
        for (var x in this){
            if (x.length > 4 && x.substr(0,4) == 'test' && x[5] >= 'A' && x[5] <= 'Z'){
                this.testCases.push(x);
            }
        }
    },
});

TKTestSuite.RegisteredTestSutes = [];

TKTestSuite.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.RegisteredTestSutes.push(subclass);
    return subclass;
};