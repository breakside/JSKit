// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
// #import "TestKit/TKTestResult.js"
// #import "TestKit/TKTestSuite.js"
/* global JSClass, JSObject, JSLog, TKAssertion, TKTestResult, TKTestSuite */
'use strict';

JSClass('TKTestRun', JSObject, {

    results: null,

    init: function(){
        this.results = [];
    },

    runAllRegisteredSuites: function(){
        var suite;
        for (var i = 0, l = TKTestSuite.RegisteredTestSuites.length; i < l; ++i){
            suite = TKTestResult.RegisteredTestSuites[i];
            this.runSuite(suite);
        }
    },

    runSuite: function(suite){
        var testName;
        var result;
        for (var i = 0, l = suite.testCases.length; i < l; ++i){
            testName = suite.testCases[i];
            this.runCase(suite, testName);
        }
    },

    runCase: function(suite, testName){
        var result;
        try{
            suite[testName]();
            result = TKTestResult.initWithNamesAndResult(suite.$class.name, testName, TKTestResult.Passed);
        }catch (e){
            if (e instanceof TKAssertion){
                result = TKTestResult.initWithNamesAndResult(suite.$class.name, testName, TKTestResult.Failed);
            }else{
                result = TKTestResult.initWithNamesAndResult(suite.$class.name, testName, TKTestResult.Error);
            }
        }
        this.reportResult(result);
    },

    reportResult: function(result){
        this.results.push(result);
        JSLog("");
    }

});