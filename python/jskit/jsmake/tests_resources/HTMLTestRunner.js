// #import "Foundation/Foundation+HTML.js"
// #import "TestKit/TestKit.js"
/* global document, window, JSClass, JSBundle, TKTestRun, TKTestResult, HTMLTestRun, console */
'use strict';

JSClass('HTMLTestRun', TKTestRun, {

    rootElement: null,
    table: null,
    tbody: null,
    row: null,
    style: null,
    name: null,

    initWithRootElement: function(rootElement){
        var info = JSBundle.mainBundle.info();
        this.name = info.JSBundleDisplayName || info.JSBundleIdentifier;
        HTMLTestRun.$super.init.call(this);
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
        cell.appendChild(doc.createTextNode(''));
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

function parseOptions(){
    var options = {};
    var pairs = window.location.search.substr(1).split('&');
    var keyValue;
    for (var i = 0; i < pairs.length; ++i){
        keyValue = pairs[i].split('=');
        if (keyValue.length == 1){
            options[keyValue[0]] = true;
        }else{
            var key = keyValue.shift();
            options[key] = keyValue.join('=');
        }
    }
    console.log(options);
    return options;
}

function main(){
    var testRun = HTMLTestRun.initWithRootElement(document.body);
    var options = parseOptions();
    if (options.suite){
        testRun.runSuiteNamed(options.suite);
    }else{
        testRun.runAllRegisteredSuites();
    }
}