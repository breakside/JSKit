// #import "TestKit/TKTestRun.js"
/* global document, JSClass, TKTestRun, TKTestResult, HTMLTestRun, console */
'use strict';

JSClass('HTMLTestRun', TKTestRun, {

    rootElement: null,
    table: null,
    tbody: null,
    row: null,

    initWithRootElement: function(rootElement){
        this.$class.$super.init.call(this);
        this.rootElement = rootElement;
        var doc = this.rootElement.ownerDocument;
        this.table = this.rootElement.appendChild(doc.createElement('table'));
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
        cell.appendChild(doc.createTextNode(suite.$class.className));
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
        }else if (failed){
            iconLabel.nodeValue = '😡';
            result = 'failed';
        }else{
            iconLabel.nodeValue = '0️⃣';
            result = 'not run';
        }
        textLabel.nodeValue = suite.$class.className + ' ' + result + '. Excecuted ' + (results[TKTestResult.Passed] + results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' with ' + (results[TKTestResult.Failed] + results[TKTestResult.Error]) + ' failures (' + (results[TKTestResult.Error]) + ' errors)';
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
        }else if (result.result == TKTestResult.Failed){
            iconLabel.nodeValue = "‼️";
        }else if (result.result == TKTestResult.Error){
            iconLabel.nodeValue = "❌";
            console.error(result.error);
        }
        messageLabel.nodeValue = result.message;
    }
});

function main(){
    var testRun = HTMLTestRun.initWithRootElement(document.body);
    testRun.runAllRegisteredSuites();
}

main();