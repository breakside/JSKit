// #import DBKit
// #import TestKit
/* global DBMongoStore */
"use strict";

(function(){

var MockMongoClient = function(url, options){
    this.url = url;
    this.options = options;
    this.databasesByName = {};
};

MockMongoClient.prototype = {
    databasesByName: null,

    connect: function(callback){
        JSRunLoop.main.schedule(callback, undefined, null, this);
    },

    db: function(name){
        var db = this.databasesByName[name];
        if (!db){
            db = new MockMongoDatabase(name);
            this.databasesByName[name] = db;
        }
        return db;
    }
};

var MockMongoDatabase = function(name){
    this.name = name;
    this.collectionsByName = {};
};

MockMongoDatabase.prototype = {
    collectionsByName: null,

    collection: function(name){
        var collection = this.collectionsByName[name];
        if (!collection){
            collection = new MockMongoCollection(name, []);
            this.collectionsByName[name] = collection;
        }
        return collection;
    }
};

var MockMongoCollection = function(name, objects){
    this.name = name;
    this.objects = objects;
    this.queries = [];
};

MockMongoCollection.prototype = {

    objects: null,
    queries: null,

    find: function(query){
        this.queries.push({query: query, cursor: null});
        var objects = [];
        var obj;
        for (var i = 0, l = this.objects.length; i < l; ++i){
            obj = this.objects[i];
            if (obj.collectionThrow){
                throw new Error("collectionThrow");
            }
            if (obj._id == query._id){
                objects.push(obj);
            }
        }
        var cursor = new MockMongoCursor(objects);
        this.queries[this.queries.length - 1].cursor = cursor;
        return cursor;

    },

    replaceOne: function(query, object, options, callback){
        this.queries.push({query: query, options: options});
        if (object.replaceOneError){
            JSRunLoop.main.schedule(callback, undefined, new Error("replaceOneError"));
            return;
        }
        if (object.replaceOneThrow){
            throw new Error("replaceOneThrow");
        }
        var obj;
        for (var i = 0, l = this.objects.length; i < l; ++i){
            obj = this.objects[i];
            if (obj.collectionThrow){
                throw new Error("collectionThrow");
            }
            if (obj._id == query._id){
                this.objects[i] = object;
                JSRunLoop.main.schedule(callback, undefined, null);
                return;
            }
        }
        this.objects.push(object);
        JSRunLoop.main.schedule(callback, undefined, null);
    },

    deleteOne: function(query, options, callback){
        this.queries.push({query: query, options: options});
        if (query._id == "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3"){
            JSRunLoop.main.schedule(callback, undefined, new Error("deleteOneError"));
            return;
        }
        if (query._id == "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx4"){
            throw new Error("deleteOneThrow");
        }
        var obj;
        for (var i = 0, l = this.objects.length; i < l; ++i){
            obj = this.objects[i];
            if (obj.collectionThrow){
                throw new Error("collectionThrow");
            }
            if (obj._id == query._id){
                this.objects.splice(i, 1);
                JSRunLoop.main.schedule(callback, undefined, null);
                return;
            }
        }
        JSRunLoop.main.schedule(callback, undefined, null);
    }
};

var MockMongoCursor = function(objects){
    this.objects = objects;
    this.index = 0;
};

MockMongoCursor.prototype = {
    next: function(callback){
        if (this.index >= this.objects.length){
            JSRunLoop.main.schedule(callback, undefined, new Error("end of cursor"), null);
        }else{
            var obj = this.objects[this.index++];
            if (obj.cursorThrow){
                throw new Error("cursorThrow");
            }
            JSRunLoop.main.schedule(callback, undefined, null, obj);
        }
    }
};

JSClass("DBMongoStoreTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        TKAssertExactEquals(store.mongodb, mongodb);
        TKAssertEquals(url.encodedString, "mongodb://localhost:1234/testdb");
        TKAssertEquals(store.connectionURL.encodedString, "mongodb://localhost:1234");
        TKAssertEquals(store.databaseName, "testdb");
        TKAssertNull(store.client);
        TKAssertNull(store.database);
    },

    testObject: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            });
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNotNull(object);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(collection.queries[0].cursor.index, 1);
                TKAssertEquals(object.id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(object.a, 1);
                TKAssertEquals(object.b, "two");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectNotFound: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2",
                a: 1,
                b: "two",
                cursorError: true
            });
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(collection.queries[0].cursor.index, 0);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectNextThrows: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                cursorThrow: true
            });
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(collection.queries[0].cursor.index, 1);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectFindThrows: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                collectionThrow: true
            });
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertNull(collection.queries[0].cursor);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveInsert: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2",
                a: 1,
                b: "two"
            });
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(success);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.queries[0].options.upsert, true);
                TKAssertEquals(collection.objects.length, 2);
                TKAssertEquals(collection.objects[0]._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2");
                TKAssertEquals(collection.objects[1]._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.objects[1].id);
                TKAssertExactEquals(collection.objects[1].a, 1);
                TKAssertEquals(collection.objects[1].b, "two");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveUpdate: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            });
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 12,
                b: "twothree"
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(success);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.queries[0].options.upsert, true);
                TKAssertEquals(collection.objects.length, 1);
                TKAssertEquals(collection.objects[0]._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.objects[0].id);
                TKAssertExactEquals(collection.objects[0].a, 12);
                TKAssertEquals(collection.objects[0].b, "twothree");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveError: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            });
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 12,
                b: "twothree",
                replaceOneError: true
            };
            expectation.call(store.save, store, object, function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.queries[0].options.upsert, true);
                TKAssertEquals(collection.objects.length, 1);
                TKAssertEquals(collection.objects[0]._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.objects[0].id);
                TKAssertExactEquals(collection.objects[0].a, 1);
                TKAssertEquals(collection.objects[0].b, "two");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveThrows: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            });
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 12,
                b: "twothree",
                replaceOneThrow: true
            };
            expectation.call(store.save, store, object, function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.queries[0].options.upsert, true);
                TKAssertEquals(collection.objects.length, 1);
                TKAssertEquals(collection.objects[0]._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.objects[0].id);
                TKAssertExactEquals(collection.objects[0].a, 1);
                TKAssertEquals(collection.objects[0].b, "two");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDelete: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            });
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(success);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(collection.objects.length, 0);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDeleteError: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3",
                a: 1,
                b: "two"
            });
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3", function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3");
                TKAssertEquals(collection.objects.length, 1);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDeleteThrows: function(){
        var mongodb = {
            MongoClient: MockMongoClient
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            var database = store.database;
            var collection = database.collection("obj");
            collection.objects.push({
                _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx4",
                a: 1,
                b: "two"
            });
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx4", function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.queries.length, 1);
                TKAssertEquals(collection.queries[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx4");
                TKAssertEquals(collection.objects.length, 1);
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

});

})();