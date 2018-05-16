// #import "Foundation/Foundation.js"
// #import "TestKit/TKAssert.js"
// #import "TestKit/TKTestResult.js"
// #import "TestKit/TKTestSuite.js"
/* global JSClass, JSObject, TKAssertion, TKTestResult, TKTestSuite */
'use strict';

JSClass('TKTestRun', JSObject, {

    results: null,
    suiteQueue: null,
    caseQueue: null,

    initInEnvironment: function(environment){
        this.suiteQueue = [];
        this.caseQueue = [];
        this.results = {};
        this.environment = environment;
    },

    canRunSuite: function(suite){
        return suite && (!suite.prototype.requiredEnvironment || suite.prototype.requiredEnvironment == this.environment);
    },

    runAllRegisteredSuites: function(){
        var suite;
        for (var i = TKTestSuite.RegisteredTestSuites.length - 1; i >= 0; --i){
            suite = TKTestSuite.RegisteredTestSuites[i];
            if (this.canRunSuite(suite)){
                this.suiteQueue.push(suite);
            }
        }
        this.resume();
    },

    runSuiteNamed: function(suiteName){
        var suite = this.suiteForName(suiteName);
        if (this.canRunSuite(suite)){
            this.suiteQueue.push(suite);
        }
        this.resume();
    },

    runCaseNamed: function(suiteName, caseName){
        var suite = this.suiteForName(suiteName);
        if (this.canRunSuite(suite)){
            this.suite = suite;
            this.caseQueue.push(caseName);
        }
        this.resume();
    },

    _runCase: function(suite, testName){
        TKAssertion.CurrentTestCase = testName;
        this.startCase(suite, testName);
        var result = null;
        var suiteInstance = null;
        var run = this;
        var errorCatcher = function(e){
            if (e instanceof TKAssertion){
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Failed);
                result.message = e.message;
            }else{
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Error);
                var line = TKAssertion.LineForCurrentCaseInError(e);
                result.error = e;
                result.message = "Line " + line + ". " + e.toString();
            }
        };
        var resultWriter = function(){
            if (result === null){
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Passed);
            }
            if (result.result != TKTestResult.NotRun){
                run.results[suite.className][TKTestResult.NotRun] -= 1;
                run.results[suite.className][result.result] += 1;
            }
            suiteInstance.teardown();
            run.endCase(suite, testName, result);
            run.resume();
        };
        try{
            suiteInstance = suite.init();
            suiteInstance.setup();
            suiteInstance[testName]();
        }catch (e){
            errorCatcher(e);
        }finally{
            if (suiteInstance !== null){
                run.pause();
                if (suiteInstance.expectation){
                    suiteInstance.expectation.catch(errorCatcher).finally(resultWriter);
                }else{
                    resultWriter();
                }
            }
        }
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
    },

    suite: null,
    isRunning: false,

    resume: function(){
        this.isRunning = true;
        while (this.isRunning){
            if (this.suite === null){
                if (this.suiteQueue.length > 0){
                    this.suite = this.suiteQueue.pop();
                    for (var i = this.suite.cases.length - 1; i >= 0; --i){
                        this.caseQueue.push(this.suite.cases[i]);
                    }
                }
            }
            if (this.suite !== null){
                if (!(this.suite.className in this.results)){
                    this.results[this.suite.className] = {};
                    this.results[this.suite.className][TKTestResult.NotRun] = this.caseQueue.length;
                    this.results[this.suite.className][TKTestResult.Passed] = 0;
                    this.results[this.suite.className][TKTestResult.Failed] = 0;
                    this.results[this.suite.className][TKTestResult.Error] = 0;
                    this.startSuite(this.suite);
                }
                if (this.caseQueue.length > 0){
                    var caseName = this.caseQueue.pop();
                    this._runCase(this.suite, caseName);
                }else{
                    this.endSuite(this.suite, this.results[this.suite.className]);
                    this.suite = null;
                }
            }else{
                this.endTests(this.results);
                this.pause();
            }
        }
    },

    pause: function(){
        this.isRunning = false;
    },

    suiteForName: function(suiteName){
        var suite;
        for (var i = 0, l = TKTestSuite.RegisteredTestSuites.length; i < l; ++i){
            suite = TKTestSuite.RegisteredTestSuites[i];
            if (suite.className == suiteName){
                return suite;
            }
        }
        return  null;
    },

});