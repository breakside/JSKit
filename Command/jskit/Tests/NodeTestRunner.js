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

// #import TestKit
// jshint node: true
'use strict';

global.performance = require('perf_hooks').performance;

JSClass('NodeTestRun', TKTestRun, {

    name: null,

    init: function(){
        NodeTestRun.$super.initInEnvironment.call(this, 'node');
        var info = this.bundle.info;
        this.name = info.JSBundleDisplayName || info.JSBundleIdentifier;
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
            process.exitCode = -2;
        }else if (result.result == TKTestResult.Error){
            icon = "❌";
            process.exitCode = -2;
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

module.exports.run = function(){
    JSLog.configure({print: false}, JSLog.Level.debug);
    JSLog.configure({print: false}, JSLog.Level.info);
    JSLog.configure({print: false}, JSLog.Level.log);
    var args = JSArguments.initWithOptions({
        help: {kind: "flag", shortcut: "h", hidden: true},
        suite: {default: null, help: "The single test suite (class name) to run"},
        case: {default: null, help: "The single test case (method name) to run (requires --suite)"},
    });
    var argv = process.argv.slice(1);
    try{
        args.parse(argv);
    }catch (e){
        process.stdout.write(e.toString());
        process.stdout.write("\n\n");
        process.stdout.write(args.helpString());
        process.exit(-1);
        return;
    }
    if (args.help){
        process.stdout.write(args.helpString());
        process.exit(0);
        return;
    }
    var testRun = NodeTestRun.init();
    if (args.suite !== null){
        if (args.case !== null){
            testRun.runCaseNamed(args.suite, args.case);
        }else{
            testRun.runSuiteNamed(args.suite);
        }
    }else{
        testRun.runAllRegisteredSuites();
    }
};