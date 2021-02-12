// #import SearchKit
// #import TestKit
"use strict";

JSClass("SEIndexTests", TKTestSuite, {

    testMemoryAddDocumentAndSearch: function(){
        var index = SEIndex.initInMemory();
        var document1 = {
            id: "abc123",
            title: "Hello, world!"
        };
        var document2 = {
            id: "abc456",
            title: "world wide web"
        };
        var expectation = TKExpectation.init();
        expectation.call(index.addDocument, index, document1, function(){
            expectation.call(index.addDocument, index, document2, function(){
                expectation.call(index.search, index, "HELLO", function(documentIDs){
                    TKAssertEquals(documentIDs.length, 1);
                    TKAssertEquals(documentIDs[0], "abc123");
                    expectation.call(index.search, index, "world", function(documentIDs){
                        TKAssertEquals(documentIDs.length, 2);
                        TKAssertEquals(documentIDs[0], "abc123");
                        TKAssertEquals(documentIDs[1], "abc456");
                        expectation.call(index.search, index, "hello world", function(documentIDs){
                            TKAssertEquals(documentIDs.length, 1);
                            TKAssertEquals(documentIDs[0], "abc123");
                            expectation.call(index.search, index, "web", function(documentIDs){
                                TKAssertEquals(documentIDs.length, 1);
                                TKAssertEquals(documentIDs[0], "abc456");
                                expectation.call(index.search, index, "other", function(documentIDs){
                                    TKAssertEquals(documentIDs.length, 0);
                                }, this);
                            }, this);
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    }

});