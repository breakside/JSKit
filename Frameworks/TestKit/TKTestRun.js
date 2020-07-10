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
// #import "TKAssert.js"
// #import "TKTestResult.js"
// #import "TKTestSuite.js"
'use strict';

JSClass('TKTestRun', JSObject, {

    results: null,
    suiteQueue: null,
    caseQueue: null,
    bundle: null,

    initInEnvironment: function(environment){
        this.suiteQueue = [];
        this.caseQueue = [];
        this.results = {};
        this.environment = environment;
        this.bundle = JSBundle.testBundle;
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
        TKAssertion.CurrentTestSuite = suite.className;
        TKAssertion.CurrentTestCase = testName;
        this.startCase(suite, testName);
        var result = null;
        var suiteInstance = null;
        var run = this;

        var handleTestCaseError = function(e){
            if (result !== null){
                return;
            }
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

        var setupTestCase = function(){
            return new Promise(function(resolve, reject){
                suiteInstance = suite.init();
                suiteInstance.bundle = run.bundle;
                var promise = suiteInstance.setup();
                if (promise){
                    var timedOut = false;
                    var timer = JSTimer.scheduledTimerWithInterval(suiteInstance.implicitWaitInterval, function(){
                        timedOut = true;
                        reject(new Error("Async test setup took longer than %f seconds".sprintf(suiteInstance.implicitWaitInterval)));
                    });
                    promise.then(function(){
                        if (!timedOut){
                            timer.invalidate();
                            resolve();
                        }
                    }, function(e){
                        if (!timedOut){
                            timer.invalidate();
                            reject(e);
                        }
                    });
                    return;
                }
                if (suiteInstance.expectation){
                    if (result !== null){
                        suiteInstance.expectation.cancel();
                    }
                    suiteInstance.expectation.finally(function(){
                        var error = suiteInstance.expectation.error;
                        suiteInstance.expectation = null;
                        if (error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                    return;
                }
                resolve();
            });
        };

        var runTestCase = function(){
            return new Promise(function(resolve, reject){
                var promise = suiteInstance[testName]();
                if (promise){
                    var timedOut = false;
                    var timer = JSTimer.scheduledTimerWithInterval(suiteInstance.implicitWaitInterval, function(){
                        timedOut = true;
                        reject(new Error("Async test took longer than %f seconds".sprintf(suiteInstance.implicitWaitInterval)));
                    });
                    promise.then(function(){
                        if (!timedOut){
                            timer.invalidate();
                            resolve();
                        }
                    }, function(e){
                        if (!timedOut){
                            timer.invalidate();
                            reject(e);
                        }
                    });
                    return;
                }
                if (suiteInstance.expectation){
                    if (result !== null){
                        suiteInstance.expectation.cancel();
                    }
                    suiteInstance.expectation.finally(function(){
                        var error = suiteInstance.expectation.error;
                        suiteInstance.expectation = null;
                        if (error){
                            reject(error);
                        }else{
                            resolve();
                        }
                    });
                    return;
                }
                resolve();
            });
        };

        var teardownTestCase = function(){
            return new Promise(function(resolve, reject){
                if (suiteInstance !== null){
                    var promise = suiteInstance.teardown();
                    if (promise){
                        var timedOut = false;
                        var timer = JSTimer.scheduledTimerWithInterval(suiteInstance.implicitWaitInterval, function(){
                            timedOut = true;
                            reject(new Error("Async test teardown took longer than %f seconds".sprintf(suiteInstance.implicitWaitInterval)));
                        });
                        promise.then(function(){
                            if (!timedOut){
                                timer.invalidate();
                                resolve();
                            }
                        }, function(e){
                            if (!timedOut){
                                timer.invalidate();
                                reject(e);
                            }
                        });
                        return;
                    }
                    if (suiteInstance.expectation){
                        suiteInstance.expectation.finally(function(){
                            var error = suiteInstance.expectation.error;
                            suiteInstance.expectation = null;
                            if (error){
                                reject(error);
                            }else{
                                resolve();
                            }
                        });
                        return;
                    }
                }
                resolve();
            });
        };

        var writeTestCaseResults = function(){
            if (result === null){
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Passed);
            }
            if (result.result != TKTestResult.NotRun){
                run.results[suite.className][TKTestResult.NotRun] -= 1;
                run.results[suite.className][result.result] += 1;
            }
            run.endCase(suite, testName, result);
        };

        run.pause();
        setupTestCase().then(runTestCase).catch(function(e){
            handleTestCaseError(e);
        }).then(teardownTestCase).catch(function(e){
            handleTestCaseError(e);
        }).then(function(){
            writeTestCaseResults();
            run.resume();
        });
    },

    _runCaseOriginal: function(suite, testName){
        TKAssertion.CurrentTestSuite = suite.className;
        TKAssertion.CurrentTestCase = testName;
        this.startCase(suite, testName);
        var result = null;
        var suiteInstance = null;
        var run = this;

        var handleTestCaseError = function(e){
            if (result !== null){
                return;
            }
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

        var setupTestCase = function(){
            try{
                suiteInstance = suite.init();
                suiteInstance.bundle = run.bundle;
                suiteInstance.setup();
            }catch (e){
                handleTestCaseError(e);
            }finally{
                if (suiteInstance.expectation){
                    if (result !== null){
                        suiteInstance.expectation.cancel();
                    }
                    suiteInstance.expectation.catch(handleTestCaseError).finally(runTestCase);
                }else{
                    runTestCase();
                }
            }
        };

        var runTestCase = function(){
            suiteInstance.expectation = null;
            try{
                // Only run the case if we have a valid instanace and don't already have an error result (due to setup error)
                if (suiteInstance !== null && result === null){
                    suiteInstance[testName]();
                }
            }catch (e){
                handleTestCaseError(e);
            }finally{
                if (suiteInstance.expectation){
                    if (result !== null){
                        suiteInstance.expectation.cancel();
                    }
                    suiteInstance.expectation.catch(handleTestCaseError).finally(teardownTestCase);
                }else{
                    teardownTestCase();
                }
            }
        };

        var teardownTestCase = function(){
            suiteInstance.expectation = null;
            try{
                suiteInstance.teardown();
            }catch (e){
                handleTestCaseError(e);
            }finally{
                if (suiteInstance.expectation){
                    suiteInstance.expectation.catch(handleTestCaseError).finally(writeTestCaseResults);
                }else{
                    writeTestCaseResults();
                }
            }
        };

        var writeTestCaseResults = function(){
            if (result === null){
                result = TKTestResult.initWithNamesAndResult(suite.className, testName, TKTestResult.Passed);
            }
            if (result.result != TKTestResult.NotRun){
                run.results[suite.className][TKTestResult.NotRun] -= 1;
                run.results[suite.className][result.result] += 1;
            }
            run.endCase(suite, testName, result);
            run.resume();
        };

        run.pause();
        setupTestCase(); // -> runTestCase() -> teardownTestCase() -> writeTestCaseResults() -> run.resume()
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