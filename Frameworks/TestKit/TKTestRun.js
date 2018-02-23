// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
// #import "TestKit/TKTestResult.js"
// #import "TestKit/TKTestSuite.js"
/* global JSClass, JSObject, TKAssertion, TKTestResult, TKTestSuite */
'use strict';

JSClass('TKTestRun', JSObject, {

    results: null,

    init: function(){
        this.results = {};
    },

    runAllRegisteredSuites: function(){
        var suite;
        for (var i = 0, l = TKTestSuite.RegisteredTestSuites.length; i < l; ++i){
            suite = TKTestSuite.RegisteredTestSuites[i];
            this.runSuite(suite);
        }
        this.endTests(this.results);
    },

    runSuiteNamed: function(suiteName){
        var suite;
        for (var i = 0, l = TKTestSuite.RegisteredTestSuites.length; i < l; ++i){
            suite = TKTestSuite.RegisteredTestSuites[i];
            if (suite.className == suiteName){
                this.runSuite(suite);
            }
        }
        this.endTests(this.results);
    },

    runSuite: function(suite){
        this.results[suite.className] = {};
        this.results[suite.className][TKTestResult.NotRun] = suite.cases.length;
        this.results[suite.className][TKTestResult.Passed] = 0;
        this.results[suite.className][TKTestResult.Failed] = 0;
        this.results[suite.className][TKTestResult.Error] = 0;
        this.startSuite(suite);
        var testName;
        var result;
        for (var i = 0, l = suite.cases.length; i < l; ++i){
            testName = suite.cases[i];
            this.runCase(suite, testName);
        }
        this.endSuite(suite, this.results[suite.className]);
    },

    runCase: function(suite, testName){
        TKAssertion.CurrentTestCase = testName;
        this.startCase(suite, testName);
        var result;
        try{
            var suiteInstance = suite.init();
            suiteInstance.setup();
            try{
                suiteInstance[testName]();
            }catch (e){
                suiteInstance.teardown();
                throw e;
            }
            suiteInstance.teardown();
            result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Passed);
        }catch (e){
            if (e instanceof TKAssertion){
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Failed);
                result.message = e.message;
            }else{
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Error);
                var line = TKAssertion.LineForCurrentCaseInError(e);
                result.error = e;
                result.message = "Line " + line + ". " + e.toString();
            }
        }
        if (result.result != TKTestResult.NotRun){
            this.results[suite.className][TKTestResult.NotRun] -= 1;
            this.results[suite.className][result.result] += 1;
        }
        this.endCase(suite, testName, result);
    },

    startSuite: function(suite){
    },

    endSuite: function(suite, results){
    },

    startCase: function(suite, testName){
    },

    endCase: function(suite, testName, result){
    },

    endTests: function(results){
    }

});