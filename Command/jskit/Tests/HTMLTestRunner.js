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
// jshint browser: true
/* global console, headlessPrint, headlessExit */
'use strict';

JSClass('HTMLTestRun', TKTestRun, {

    rootElement: null,
    table: null,
    tbody: null,
    row: null,
    style: null,
    name: null,

    initWithRootElement: function(rootElement){
        HTMLTestRun.$super.initInEnvironment.call(this, 'html');
        var info = this.bundle.info;
        this.name = info.JSBundleDisplayName || info.JSBundleIdentifier;
        this.rootElement = rootElement;
        var doc = this.rootElement.ownerDocument;
        this.table = this.rootElement.appendChild(doc.createElement('table'));
        this.thead = this.table.createTHead();
        var row = this.thead.insertRow(0);
        var cell = row.insertCell(0);
        cell.className = 'result';
        cell.appendChild(doc.createTextNode('▶️'));
        cell = row.insertCell(1);
        cell.className = 'name';
        cell.colSpan = 2;
        cell.appendChild(doc.createTextNode('Running'));
        var style = doc.createElement('style');
        style.type = "text/css";
        doc.head.appendChild(style);
        var sheet = style.sheet;
        sheet.insertRule("table > tbody.passed, table > tbody > tr.passed { }", 0);
        this.style = sheet.cssRules[0].style;
        doc.title = this.name;
    },

    startSuite: function(suite){
        var doc = this.table.ownerDocument;
        this.tbody = this.table.appendChild(doc.createElement('tbody'));
        var row = this.tbody.insertRow(this.tbody.rows.length);
        row.className = 'suite';
        var cell = row.insertCell(0);
        cell.className = 'result';
        cell.appendChild(doc.createTextNode('▶️'));
        cell = row.insertCell(1);
        cell.className = 'name';
        cell.appendChild(doc.createTextNode(suite.className));
        cell.colSpan = 2;
    },

    endSuite: function(suite, results){
        var doc = this.table.ownerDocument;
        var row = this.tbody.insertRow(this.tbody.rows.length);
        row.className = 'suite-summary';
        row.insertCell(0);
        row.insertCell(1);
        row.cells[0].className = 'result';
        row.cells[1].className = 'name';
        row.cells[1].colSpan = 2;
        row.cells[0].appendChild(doc.createTextNode(''));
        row.cells[1].appendChild(doc.createTextNode(''));
        var iconLabel = row.cells[0].childNodes[0];
        var textLabel = row.cells[1].childNodes[0];
        var failed = results[TKTestResult.Failed] > 0 || results[TKTestResult.Error] > 0;
        var passed = !failed && results[TKTestResult.Passed] > 0;
        var result = '';
        if (passed){
            iconLabel.nodeValue = '✅';
            result = 'passed';
            this.tbody.classList.add('passed');
        }else if (failed){
            iconLabel.nodeValue = '😡';
            result = 'failed';
        }else{
            iconLabel.nodeValue = '0️⃣';
            result = 'not run';
        }
        textLabel.nodeValue = suite.className + ' ' + result + '. Excecuted ' + (results[TKTestResult.Passed] + results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' with ' + (results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' failures (' + (results[TKTestResult.Error]) + ' errors)';
    },

    startCase: function(suite, testName){
        var doc = this.table.ownerDocument;
        this.row = this.tbody.insertRow(this.tbody.rows.length);
        var cell = this.row.insertCell(0);
        cell.className = 'result';
        cell.appendChild(doc.createTextNode('▶️'));
        cell = this.row.insertCell(1);
        cell.className = 'name';
        cell.appendChild(doc.createTextNode(testName));
        cell = this.row.insertCell(2);
        cell.className = 'error';
        cell.appendChild(doc.createTextNode(''));
    },

    endCase: function(suite, testName, result){
        var iconLabel = this.row.cells[0].childNodes[0];
        var textLabel = this.row.cells[1].childNodes[0];
        var messageLabel = this.row.cells[2].childNodes[0];
        if (result.result == TKTestResult.NotRun){
        }else if (result.result == TKTestResult.Passed){
            iconLabel.nodeValue = "✅";
            this.row.classList.add('passed');
        }else if (result.result == TKTestResult.Failed){
            iconLabel.nodeValue = "‼️";
        }else if (result.result == TKTestResult.Error){
            iconLabel.nodeValue = "❌";
            console.error(result.error);
        }
        messageLabel.nodeValue = result.message;
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
        var iconLabel = this.thead.rows[0].cells[0].childNodes[0];
        var textLabel = this.thead.rows[0].cells[1].childNodes[0];
        var name = this.name;
        if (run == 1){
            for (suiteName in results){
                name = suiteName;
            }
        }
        if (failed > 0){
            iconLabel.nodeValue = "‼️";
            textLabel.nodeValue = name + ': ' + failed + ' test suites failed';
            this.thead.addEventListener('click', this, false);
            this.thead.addEventListener('mousedown', this, false);
        }else{
            iconLabel.nodeValue = "✅";
            textLabel.nodeValue = name + ': All tests passed';
        }
    },

    handleEvent: function(e){
        if (e.currentTarget === this.thead){
            if (e.type == 'mousedown'){
                e.preventDefault();
            }else if (e.type == 'click'){
                if (this.style.display === ''){
                    this.style.display = 'none';
                }else{
                    this.style.display = '';
                }
            }
        }
    }
});

JSClass("HTMLHeadlessTestRun", TKTestRun, {

    name: null,
    exitCode: 0,

    init: function(){
        HTMLHeadlessTestRun.$super.initInEnvironment.call(this, "html");
        var info = this.bundle.info;
        this.name = info.JSBundleDisplayName || info.JSBundleIdentifier;
    },

    startSuite: function(suite){
        headlessPrint('▶️  ' + suite.className + '...\n');
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
        headlessPrint(icon + ' ' + suite.className + ' ' + result + '. Excecuted ' + (results[TKTestResult.Passed] + results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' with ' + (results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' failures (' + (results[TKTestResult.Error]) + ' errors)\n');
    },

    startCase: function(suite, testName){
        headlessPrint('▶️ ' + testName + '...', true);
    },

    endCase: function(suite, testName, result){
        var icon = '';
        if (result.result == TKTestResult.NotRun){
        }else if (result.result == TKTestResult.Passed){
            icon = "✅";
        }else if (result.result == TKTestResult.Failed){
            icon = "‼️ ";
            this.exitCode = -2;
        }else if (result.result == TKTestResult.Error){
            icon = "❌";
            this.exitCode = -2;
        }
        headlessPrint('\x1b[1K\r', true);
        headlessPrint(icon + ' ' + testName + '\n');
        if (result.result != TKTestResult.Passed){
            headlessPrint('     ' + result.message + '\n');
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
                headlessPrint("\n‼️  " + this.name+ ': ' + failed + ' test suites failed\n');
            }else{
                headlessPrint("\n✅ " + this.name + ': All tests passed\n');
            }
        }
        headlessExit(this.exitCode);
    }
});

function main(){
    var args = JSArguments.initWithOptions({
        suite: {default: null, help: "The single test suite to run"},
        case: {default: null, help: "The single test case to run"},
        pause: {kind: "flag", help: "Pause the debugger before running tests"},
        headless: {kind: "flag", help: "Runs without any display"}
    });
    try{
        args.parseQueryString(window.location.search);
    }catch (e){
        console.error(e);
        console.log(args.helpString());
        return;
    }
    var testRun = null;
    if (args.headless){
        testRun = HTMLHeadlessTestRun.init();
    }else{
        testRun = HTMLTestRun.initWithRootElement(document.body);
    }
    if (args.pause){
        debugger;
    }
    if (args.suite){
        if (args.case){
            testRun.runCaseNamed(args.suite, args.case);
        }else{
            testRun.runSuiteNamed(args.suite);
        }
    }else{
        testRun.runAllRegisteredSuites();
    }
}