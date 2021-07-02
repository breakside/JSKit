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

JSClass("DBObjectDatabaseTests", TKTestSuite, {

    testID: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("testing");
        TKAssertEquals(id.length, 48);
        TKAssertEquals(id.substr(0, 8), "testing_");

        var id2 = db.id("testing");
        TKAssertEquals(id.length, 48);
        TKAssertEquals(id.substr(0, 8), "testing_");
        TKAssertNotEquals(id, id2);

        var data = "Hello, World!".utf8();
        id = db.id("test", data);
        var hash = JSSHA1Hash(data).hexStringRepresentation();
        var expected = "test_" + hash;
        TKAssertEquals(id, expected);
        id2 = db.id("test", data);
        TKAssertEquals(id, id2);
    },

    testCallbackStoreSave: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextCompletion = [true];
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(db.save, db, obj, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreSaveFailed: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextCompletion = [false];
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(db.save, db, obj, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreSavePromise: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextCompletion = [true];
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = db.save(obj);
        expectation.call(promise.then, promise, function(){
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreSavePromiseRejected: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextCompletion = [false];
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = db.save(obj);
        expectation.call(promise.then, promise, function(){
            TKAssert(false, "Promise should be rejected");
        }, function(){
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObject: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [{
            id: id,
            one: 1,
            two: "2",
            three: null
        }, null];
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNotNull(obj);
            TKAssertNull(error);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, this);
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObjectUndefinedError: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [{
            id: id,
            one: 1,
            two: "2",
            three: null
        }];
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNotNull(obj);
            TKAssertNull(error);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, this);
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObjectError: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [null, new Error("testing")];
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNull(obj);
            TKAssertInstance(error, Error);
            TKAssertEquals(error.message, "testing");
        }, this);
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObjectPromise: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [{
            id: id,
            one: 1,
            two: "2",
            three: null
        }, null];
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssertNotNull(obj);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObjectPromiseUndefinedError: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [{
            id: id,
            one: 1,
            two: "2",
            three: null
        }];
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssertNotNull(obj);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreObjectPromiseError: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [null, new Error("testing")];
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssert(false, "Promise should be rejected");
        }, function(error){
            TKAssertInstance(error, Error);
            TKAssertEquals(error.message, "testing");
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreMissingObject: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [null, null];
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNull(obj);
            TKAssertNull(error);
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreMissingObjectPromise: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [null, null];
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssertNull(obj);
        }, function(error){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreDelete: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [true];
        var expectation = TKExpectation.init();
        expectation.call(db.delete, db, id, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testCallbackStoreDeleteFailed: function(){
        var store = DBObjectDatabaseTestsMockCallbackStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextCompletion = [false];
        var expectation = TKExpectation.init();
        expectation.call(db.delete, db, id, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSave: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ resolve(true); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(db.save, db, obj, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSaveFailed: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ resolve(false); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(db.save, db, obj, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSaveFailedError: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ reject(new Error("failed")); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        expectation.call(db.save, db, obj, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSavePromise: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ resolve(true); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = db.save(obj);
        expectation.call(promise.then, promise, function(){
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSavePromiseRejected: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ resolve(false); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = db.save(obj);
        expectation.call(promise.then, promise, function(){
            TKAssert(false, "Promise should be rejected");
        }, function(){
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreSavePromiseRejectedError: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        store.nextPromise = new Promise(function(resolve, reject){ reject(new Error("falied")); });
        var obj = {
            id: db.id("test"),
            one: 1,
            two: "2",
            three: null
        };
        var expectation = TKExpectation.init();
        var promise = db.save(obj);
        expectation.call(promise.then, promise, function(){
            TKAssert(false, "Promise should be rejected");
        }, function(){
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreObject: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){
            resolve({
                id: id,
                one: 1,
                two: "2",
                three: null
            });
        });
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNotNull(obj);
            TKAssertNull(error);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, this);
        this.wait(expectation, 1.0);
    },

    testPromiseStoreObjectError: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ reject(new Error("testing")); });
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNull(obj);
            TKAssertInstance(error, Error);
            TKAssertEquals(error.message, "testing");
        }, this);
        this.wait(expectation, 1.0);
    },

    testPromiseStoreObjectPromise: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){
            resolve({
                id: id,
                one: 1,
                two: "2",
                three: null
            });
        });
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssertNotNull(obj);
            TKAssertEquals(obj.id, id);
            TKAssertExactEquals(obj.one, 1);
            TKAssertExactEquals(obj.two, "2");
            TKAssertNull(obj.three);
        }, function(){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreObjectPromiseError: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ reject(new Error("testing")); });
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssert(false, "Promise should be rejected");
        }, function(error){
            TKAssertInstance(error, Error);
            TKAssertEquals(error.message, "testing");
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreMissingObject: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ resolve(null); });
        var expectation = TKExpectation.init();
        expectation.call(db.object, db, id, function(obj, error){
            TKAssertNull(obj);
            TKAssertNull(error);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreMissingObjectPromise: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ resolve(null); });
        var expectation = TKExpectation.init();
        var promise = db.object(id);
        expectation.call(promise.then, promise, function(obj){
            TKAssertNull(obj);
        }, function(error){
            TKAssert(false, "Promise rejected");
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreDelete: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ resolve(true); });
        var expectation = TKExpectation.init();
        expectation.call(db.delete, db, id, function(success){
            TKAssert(success);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreDeleteFailed: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ resolve(false); });
        var expectation = TKExpectation.init();
        expectation.call(db.delete, db, id, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    },

    testPromiseStoreDeleteError: function(){
        var store = DBObjectDatabaseTestsMockPromiseStore.init();
        var db = DBObjectDatabase.initWithObjectStore(store);
        var id = db.id("test");
        store.nextPromise = new Promise(function(resolve, reject){ reject(new Error("failed")); });
        var expectation = TKExpectation.init();
        expectation.call(db.delete, db, id, function(success){
            TKAssertExactEquals(success, false);
        });
        this.wait(expectation, 1.0);
    }

});

JSClass("DBObjectDatabaseTestsMockCallbackStore", DBObjectStore, {

    nextCompletion: null,

    object: function(id, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
    },

    save: function(object, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
    },

    delete: function(object, completion){
        JSRunLoop.main.schedule(completion, undefined, this.nextCompletion[0], this.nextCompletion[1]);
    }

});

JSClass("DBObjectDatabaseTestsMockPromiseStore", DBObjectStore, {

    nextPromise: null,

    object: function(id, completion){
        return this.nextPromise;
    },

    save: function(object, completion){
        return this.nextPromise;
    },

    delete: function(object, completion){
        return this.nextPromise;
    }

});