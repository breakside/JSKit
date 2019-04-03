// #import Foundation
/* global JSClass, JSObject, TKTestResult */
'use strict';

JSClass("TKTestResult", JSObject, {

    suiteName: null,
    testName: null,
    result: null,
    message: '',

    initWithNamesAndResult: function(suiteName, testName, result){
        this.suiteName = suiteName;
        this.testName = testName;
        this.result = result;
    }

});

TKTestResult.NotRun = 'notrun';
TKTestResult.Passed = 'passed';
TKTestResult.Failed = 'failed';
TKTestResult.Error = 'error';