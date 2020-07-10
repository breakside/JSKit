// #import TestKit
'use strict';

JSClass("TestTestRun", TKTestRun, {

    completion: null,
    target: null,

    init: function(){
        TestTestRun.$super.initInEnvironment.call(this, 'test');
    },

    runSuite: function(suite, completion, target){
        this.completion = completion;
        this.target = target;
        this.suiteQueue.push(suite);
        this.resume();
    },

    endSuite: function(suite, results){
        this.completion.call(this.target);
    },

});

JSClass("TKTestRunTests", TKTestSuite, {
    
    testPass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                TKAssert(false);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testUniqueSuiteEachCase: function(){

        var suiteIdOnMethod1 = null;
        var suiteIdOnMethod2 = null;

        var suiteClass = TKTestSuite.$extend({

            testMethod1: function(){
                suiteIdOnMethod1 = this.objectID;
                TKAssert(true);
            },

            testMethod2: function(){
                suiteIdOnMethod2 = this.objectID;
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertNotNull(suiteIdOnMethod1);
            TKAssertNotNull(suiteIdOnMethod2);
            TKAssertNotEquals(suiteIdOnMethod1, suiteIdOnMethod2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testFailContinues: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                TKAssert(false);
            },

            testMethod2: function(){
                TKAssert(true);
            },

            testMethod3: function(){
                TKAssert(true);
            },

            testMethod4: function(){
                TKAssert(false);
            },

            testMethod5: function(){
                TKAssert(true);
            },

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 3);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                throw new Error("test");
            },

            testMethod2: function(){
                TKAssert(true);
            },

            testMethod3: function(){
                TKAssert(true);
            },

            testMethod4: function(){
                throw new Error("test");
            },

            testMethod5: function(){
                TKAssert(true);
            },

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 3);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testErrorContinues: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                throw new Error("test");
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationPass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationWaits: function(){

        var resultsOnMethod2 = null;

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(false);
                });
                this.wait(expectation, 1.0);
            },

            testMethod2: function(){
                TKAssert(true);
                resultsOnMethod2 = JSCopy(run.results[suiteClass.className]);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(resultsOnMethod2[TKTestResult.NotRun], 1);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Passed], 0);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Failed], 1);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Error], 0);

            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(false);
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    throw new Error("test");
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationTimeoutPass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 0.1);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationTimeoutFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(false);
                });
                this.wait(expectation, 0.1);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testExpectationTimeoutError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    throw new Error("test");
                });
                this.wait(expectation, 0.1);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationPass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        TKAssert(true);
                    });
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        TKAssert(false);
                    });
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        throw new Error("test");
                    });
                });
                this.wait(expectation, 1.0);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationTimeoutPass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        TKAssert(true);
                    });
                });
                this.wait(expectation, 0.3);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationTimeoutFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        TKAssert(false);
                    });
                });
                this.wait(expectation, 0.3);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testChainedExpectationTimeoutError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                    expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                        throw new Error("test");
                    });
                });
                this.wait(expectation, 0.3);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupFail: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                TKAssert(false);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupError: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                throw new Error();
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupExpectationPass: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupExpectationTimeout: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 0.1);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupExpectationWaits: function(){

        var setupDoneOnMethod1 = false;
        var setupDoneOnMethod2 = false;

        var suiteClass = TKTestSuite.$extend({

            setupDone: false,

            setup: function(){
                var expectation = TKExpectation.init();
                var test = this;
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    test.setupDone = true;
                    TKAssert(true);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                setupDoneOnMethod1 = this.setupDone;
                TKAssert(true);
            },

            testMethod2: function(){
                setupDoneOnMethod2 = this.setupDone;
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssert(setupDoneOnMethod1);
            TKAssert(setupDoneOnMethod2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupExpectationFail: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(false);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testSetupExpectationError: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    throw new Error("test");
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownFail: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                TKAssert(false);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownError: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                throw new Error();
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownExpectationPass: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownExpectationTimeout: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(true);
                });
                this.wait(expectation, 0.1);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownExpectationWaits: function(){

        var teardownCount = 0;

        var suiteClass = TKTestSuite.$extend({

            teardownDone: false,

            teardown: function(){

                var expectation = TKExpectation.init();
                var test = this;
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    ++teardownCount;
                    TKAssert(true);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(teardownCount, 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownExpectationFail: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    TKAssert(false);
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 2);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testTeardownExpectationError: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                var expectation = TKExpectation.init();
                expectation.call(JSTimer.scheduledTimerWithInterval, JSTimer, 0.2, function(){
                    throw new Error("test");
                });
                this.wait(expectation, 5.0);
            },

            testMethod: function(){
                TKAssert(true);
            },

            testMethod2: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 2);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromisePass: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseWaits: function(){

        var resultsOnMethod2 = null;

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        try{
                            TKAssert(false);
                            resolve();
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            },

            testMethod2: function(){
                TKAssert(true);
                resultsOnMethod2 = JSCopy(run.results[suiteClass.className]);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(resultsOnMethod2[TKTestResult.NotRun], 1);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Passed], 0);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Failed], 1);
            TKAssertEquals(resultsOnMethod2[TKTestResult.Error], 0);

            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseFail: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        try{
                            TKAssert(false);
                            resolve();
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseError: function(){

        var suiteClass = TKTestSuite.$extend({

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        reject(new Error("test"));
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTimeoutPass: function(){

        var suiteClass = TKTestSuite.$extend({

            implicitWaitInterval: 0.1,

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTimeoutFail: function(){

        var suiteClass = TKTestSuite.$extend({

            implicitWaitInterval: 0.1,

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        try{
                            TKAssert(false);
                            resolve();
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTimeoutError: function(){

        var suiteClass = TKTestSuite.$extend({

            implicitWaitInterval: 0.1,

            testMethod: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        reject(new Error("test"));
                    });
                });
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseSetupPass: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseSetupWaits: function(){

        var setupDoneOnMethod1 = false;

        var suiteClass = TKTestSuite.$extend({

            setupDone: false,

            setup: function(){
                var test = this;
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        test.setupDone = true;
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                setupDoneOnMethod1 = this.setupDone;
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssert(setupDoneOnMethod1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseSetupTimeout: function(){

        var suiteClass = TKTestSuite.$extend({

            implicitWaitInterval: 0.1,

            setup: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseSetupFail: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        try{
                            TKAssert(false);
                            resolve();
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseSetupError: function(){

        var suiteClass = TKTestSuite.$extend({

            setup: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        reject(new Error("test"));
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTeardownPass: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTeardownWaits: function(){

        var teardownCount = 0;

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        ++teardownCount;
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(teardownCount, 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTeardownTimeout: function(){

        var suiteClass = TKTestSuite.$extend({

            implicitWaitInterval: 0.1,

            teardown: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        TKAssert(true);
                        resolve();
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTeardownFail: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        try{
                            TKAssert(false);
                            resolve();
                        }catch (e){
                            reject(e);
                        }
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 1);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 0);
        });
        this.wait(expectation, 5.0);
    },
    
    testPromiseTeardownError: function(){

        var suiteClass = TKTestSuite.$extend({

            teardown: function(){
                return new Promise(function(resolve, reject){
                    JSTimer.scheduledTimerWithInterval(0.2, function(){
                        reject(new Error("test"));
                    });
                });
            },

            testMethod: function(){
                TKAssert(true);
            }

        }, "TestSuite");

        var run = TestTestRun.init();
        var expectation = TKExpectation.init();
        expectation.call(run.runSuite, run, suiteClass, function(){
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.NotRun], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Passed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Failed], 0);
            TKAssertEquals(run.results[suiteClass.className][TKTestResult.Error], 1);
        });
        this.wait(expectation, 5.0);
    },

});