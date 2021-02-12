// #import SearchKit
// #import TestKit
"use strict";

JSClass("SEMemoryStoreTests", TKTestSuite, {

    testAddDocumentAndSearch: function(){
        var store = SEIndexMemoryStore.init();
        var document1 = {
            id: "abc123",
            title: "Hello, world!"
        };
        var document2 = {
            id: "abc456",
            title: "world wide web"
        };
        var expectation = TKExpectation.init();
        expectation.call(store.addDocument, store, document1, SEStandardTokenizer, function(){
            expectation.call(store.addDocument, store, document2, SEStandardTokenizer, function(){
                expectation.call(store.search, store, ["hello"], [{}], SEStandardRanker, function(documentIDs){
                    TKAssertEquals(documentIDs.length, 1);
                    TKAssertEquals(documentIDs[0], "abc123");
                    expectation.call(store.search, store, ["world"], [{}], SEStandardRanker, function(documentIDs){
                        TKAssertEquals(documentIDs.length, 2);
                        TKAssertEquals(documentIDs[0], "abc123");
                        TKAssertEquals(documentIDs[1], "abc456");
                        expectation.call(store.search, store, ["web"], [{}], SEStandardRanker, function(documentIDs){
                            TKAssertEquals(documentIDs.length, 1);
                            TKAssertEquals(documentIDs[0], "abc456");
                            expectation.call(store.search, store, ["other"], [{}], SEStandardRanker, function(documentIDs){
                                TKAssertEquals(documentIDs.length, 0);
                            }, this);
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    },

    testAddDocumentAndSearchPrefix: function(){
        var store = SEIndexMemoryStore.init();
        var document1 = {
            id: "abc123",
            title: "Hello, world!"
        };
        var document2 = {
            id: "abc456",
            title: "world wide web"
        };
        var expectation = TKExpectation.init();
        expectation.call(store.addDocument, store, document1, SEStandardTokenizer, function(){
            expectation.call(store.addDocument, store, document2, SEStandardTokenizer, function(){
                expectation.call(store.search, store, ["he"], [{isPrefix: true}], SEStandardRanker, function(documentIDs){
                    TKAssertEquals(documentIDs.length, 1);
                    TKAssertEquals(documentIDs[0], "abc123");
                    expectation.call(store.search, store, ["w"], [{isPrefix: true}], SEStandardRanker, function(documentIDs){
                        TKAssertEquals(documentIDs.length, 2);
                        TKAssertEquals(documentIDs[0], "abc456");
                        TKAssertEquals(documentIDs[1], "abc123");
                        expectation.call(store.search, store, ["wi"], [{isPrefix: true}], SEStandardRanker, function(documentIDs){
                            TKAssertEquals(documentIDs.length, 1);
                            TKAssertEquals(documentIDs[0], "abc456");
                            expectation.call(store.search, store, ["other"], [{isPrefix: true}], SEStandardRanker, function(documentIDs){
                                TKAssertEquals(documentIDs.length, 0);
                            }, this);
                        }, this);
                    }, this);
                }, this);
            }, this);
        }, this);
        this.wait(expectation, 2.0);
    }

});