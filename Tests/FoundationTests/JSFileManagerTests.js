// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSFileManager, TKExpectation */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertNotUndefined, TKAssertThrows, TKAssertLessThan, TKAssertLessThanOrEquals, TKAssertGreaterThan, TKAssertGreaterThanOrEquals */
'use strict';

JSClass("JSFileManagerTests", TKTestSuite, {

    manager: null,

    setup: function(){
        var timestamp = (new Date()).getTime();
        this.manager = JSFileManager.initWithIdentifier("io.breakside.JSKit.FoundationTests-%d".sprintf(timestamp));
        var expectation = TKExpectation.init();
        expectation.call(this.manager.open, this.manager, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    teardown: function(){
        var expectation = TKExpectation.init();
        expectation.call(this.manager.destroy, this.manager, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testCreateFolderAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('tests');
        expectation.call(manager.createFolderAtURL, manager, url, function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 1.0);
    },

    testCreateFolderAtURL_withIntermediates: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'a', 'b']);
        expectation.call(manager.createFolderAtURL, manager, url, function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 1.0);
    },

    testItemExistsAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'a', 'c']);
        expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
            TKAssert(!exists);
        });
        this.wait(expectation, 1.0);
    },

    testCreateFileAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponents(['tests', 'test1.txt']);
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.itemExistsAtURL, manager, url, function(exists){
                TKAssert(exists);
            });
        });
        this.wait(expectation, 1.0);
    },

    testContentsAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.contentsAtURL, manager, url, function(data){
                TKAssertNotNull(data);
                var str = String.initWithData(data, String.Encoding.utf8);
                TKAssertEquals(str, "This is a test!");
            });
        });
        this.wait(expectation, 1.0);
    },

    testCreateSymbolicLinkAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var txt = "This is a test!";
        expectation.call(manager.createFileAtURL, manager, url, txt.utf8(), function(success){
            TKAssert(success);
            expectation.call(manager.createSymbolicLinkAtURL, manager, url2, url, function(success){
                TKAssert(success);
                expectation.call(manager.contentsAtURL, manager, url2, function(data){
                    TKAssertNotNull(data);
                    var str = String.initWithData(data, String.Encoding.utf8);
                    TKAssertEquals(str, "This is a test!");
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testCircularSymbolicLinkAtURL: function(){
        var manager = this.manager;
        var expectation = TKExpectation.init();
        var url1 = manager.temporaryDirectoryURL.appendingPathComponent('test1.txt');
        var url2 = manager.temporaryDirectoryURL.appendingPathComponent('test2.txt');
        var url3 = manager.temporaryDirectoryURL.appendingPathComponent('test3.txt');
        expectation.call(manager.createSymbolicLinkAtURL, manager, url1, url2, function(success){
            TKAssert(success);
            expectation.call(manager.createSymbolicLinkAtURL, manager, url2, url3, function(success){
                TKAssert(success);
                expectation.call(manager.createSymbolicLinkAtURL, manager, url3, url1, function(success){
                    TKAssert(success);
                    expectation.call(manager.contentsAtURL, manager, url2, function(data){
                        TKAssertNull(data);
                    });
                });
            });
        });
        this.wait(expectation, 1.0);
    }

});