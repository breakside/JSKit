// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
/* global JSObject, JSClass, TKAssertion , TKTestSuite*/
'use strict';

JSClass("TKTestSuite", JSObject, {

    cases: null,

    init: function(){
        this.cases = [];
        this._findTestCases();
    },

    _findTestCases: function(){
        this.cases = [];
        var names = Object.getOwnPropertyNames(this.$class.prototype);
        var x;
        for (var i = 0, l = names.length; i < l; ++i){
            x = names[i];
            if (x.length > 4 && x.substr(0,4) == 'test' && x[4] >= 'A' && x[4] <= 'Z'){
                this.cases.push(x);
            }
        }
    },
});

TKTestSuite.RegisteredTestSuites = [];

TKTestSuite.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.RegisteredTestSuites.push(subclass);
    return subclass;
};