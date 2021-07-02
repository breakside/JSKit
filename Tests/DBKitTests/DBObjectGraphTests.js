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

// #import DBKit
// #import TestKit
'use strict';

JSClass("DBObjectGraphTests", TKTestSuite, {

    testInitWithObjectDatabase: function(){
        var db = DBObjectDatabase.initInMemory();
        var graph = DBObjectGraph.initWithObjectDatabase(db);
        TKAssertNotNull(graph.objectsByID);
    },

    testObject: function(){
        var store = DBObjectGraphTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var graph = DBObjectGraph.initWithObjectDatabase(db);
        store.nextCompletion = [{
            id: "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            one: 1,
            two: "2"
        }];
        var expectation = TKExpectation.init();
        expectation.call(graph.object, graph, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object, error){
            TKAssertNotNull(object);
            TKAssertNull(error);
            TKAssertEquals(object.id, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
            TKAssertExactEquals(object.one, 1);
            TKAssertExactEquals(object.two, "2");
            TKAssertEquals(store.calls, 1);
            store.nextCompletion = null;
            expectation.call(graph.object, graph, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object, error){
                TKAssertNotNull(object);
                TKAssertNull(error);
                TKAssertEquals(object.id, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(object.one, 1);
                TKAssertExactEquals(object.two, "2");
                TKAssertEquals(store.calls, 1);
            });
        });
        this.wait(expectation, 5.0);
    },

    testObjectError: function(){
        var store = DBObjectGraphTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var graph = DBObjectGraph.initWithObjectDatabase(db);
        store.nextCompletion = [null, new Error("testing")];
        var expectation = TKExpectation.init();
        expectation.call(graph.object, graph, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object, error){
            TKAssertNull(object);
            TKAssertInstance(error, Error);
            TKAssertEquals(error.message, "testing");
            TKAssertEquals(store.calls, 1);
        });
        this.wait(expectation, 5.0);
    },

    testObjectNotFound: function(){
        var store = DBObjectGraphTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var graph = DBObjectGraph.initWithObjectDatabase(db);
        store.nextCompletion = [null, null];
        var expectation = TKExpectation.init();
        expectation.call(graph.object, graph, "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object, error){
            TKAssertNull(object);
            TKAssertNull(error);
            TKAssertEquals(store.calls, 1);
        });
        this.wait(expectation, 5.0);
    },

});

JSClass("DBObjectGraphTestsMockCallbackStore", DBObjectStore, {

    nextCompletion: null,
    calls: 0,

    object: function(id, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
        ++this.calls;
    },

    save: function(object, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
    },

    delete: function(object, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
    }

});