// #import "Foundation/Foundation+Node.js"
// #import "TestKit/TestKit.js"
/* global global, require, module, process, JSClass, JSBundle, TKTestRun, TKTestResult, NodeTestRun, console */
'use strict';

global.performance = require('perf_hooks').performance;

JSClass('NodeTestRun', TKTestRun, {

    name: null,

    init: function(){
        var info = JSBundle.mainBundle.info();
        this.name = info.JSBundleDisplayName || info.JSBundleIdentifier;
        NodeTestRun.$super.init.call(this);
    },

    startSuite: function(suite){
        process.stdout.write('▶️  ' + suite.className + '...\n');
    },

    endSuite: function(suite, results){
        var failed = results[TKTestResult.Failed] > 0 || results[TKTestResult.Error] > 0;
        var passed = !failed && results[TKTestResult.Passed] > 0;
        var result = '';
        var icon = '';
        if (passed){
            icon = '✅';
            result = 'passed';
        }else if (failed){
            icon = '😡';
            result = 'failed';
        }else{
            icon = '0️⃣';
            result = 'not run';
        }
        process.stdout.write(icon + ' ' + suite.className + ' ' + result + '. Excecuted ' + (results[TKTestResult.Passed] + results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' with ' + (results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' failures (' + (results[TKTestResult.Error]) + ' errors)\n');
    },

    startCase: function(suite, testName){
        if (process.stdout.isTTY){
            process.stdout.write('▶️ ' + testName + '...');
        }
    },

    endCase: function(suite, testName, result){
        var icon = '';
        if (result.result == TKTestResult.NotRun){
        }else if (result.result == TKTestResult.Passed){
            icon = "✅";
        }else if (result.result == TKTestResult.Failed){
            icon = "‼️ ";
        }else if (result.result == TKTestResult.Error){
            icon = "❌";
        }
        if (process.stdout.isTTY){
            process.stdout.write('\x1b[1K\r');
        }
        process.stdout.write(icon + ' ' + testName + '\n');
        if (result.result != TKTestResult.Passed){
            process.stdout.write('     ' + result.message + '\n');
        }
    },

    endTests: function(results){
        var passed = 0;
        var failed = 0;
        var suiteResults;
        var suitePassed;
        var suiteFailed;
        var run = 0;
        for (var suiteName in results){
            suiteResults = results[suiteName];
            suiteFailed = suiteResults[TKTestResult.Failed] > 0 || suiteResults[TKTestResult.Error] > 0;
            suitePassed = !suiteFailed && suiteResults[TKTestResult.Passed] > 0;
            if (suitePassed){
                passed += 1;
            }else if (suiteFailed){
                failed += 1;
            }
            run += 1;
        }
        if (run > 1){
            if (failed > 0){
                process.stdout.write("\n‼️  " + this.name+ ': ' + failed + ' test suites failed\n');
            }else{
                process.stdout.write("\n✅ " + this.name + ': All tests passed\n');
            }
        }
        process.exit();
    }
});

function parseOptions(){
    var options = {};
    var argv = process.argv.slice(1 + process.execArgv.length);
    var arg;
    var key = null;
    for (var i = 1; i < argv.length; ++i){
        arg = argv[i];
        if (arg.length > 1 && arg.charAt(0) == '-' && arg.charAt(1) == '-'){
            if (key !== null){
                options[key] = true;
                key = null;
            }
            key = arg.substr(2);
        }else{
            if (key !== null){
                options[key] = arg;
                key = null;
            }
        }
    }
    if (key !== null){
        options[key] = true;
        key = null;
    }
    return options;
}

module.exports.run = function(){
    var testRun = NodeTestRun.init();
    var options = parseOptions();
    if (options.suite){
        if (options.case){
            testRun.runCaseNamed(options.suite, options.case);
        }else{
            testRun.runSuiteNamed(options.suite);
        }
    }else{
        testRun.runAllRegisteredSuites();
    }
};