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