// #import DBKit
// #import TestKit
/* global DBMongoStore */
"use strict";

(function(){

var MockMethod = function(){
    this.calls = [];
    this.results = [];
};

var MockMongoClient = function(){
    this.mock = {
        connect: new MockMethod(),
        db: new MockMethod()
    };
};

MockMongoClient.prototype = {

    connect: function(callback){
        var result = this.mock.connect.results[this.mock.connect.calls.length];
        this.mock.connect.calls.push({});
        if (result instanceof Error){
            throw result;
        }
        JSRunLoop.main.schedule(callback, undefined, result.error, result.client);
    },

    db: function(name){
        var result = this.mock.db.results[this.mock.db.calls.length];
        this.mock.db.calls.push({name: name});
        if (result instanceof Error){
            throw result;
        }
        return result;
    }
};

var MockMongoDatabase = function(){
    this.mock = {
        collection: new MockMethod(),
    };
};

MockMongoDatabase.prototype = {

    collection: function(name){
        var result = this.mock.collection.results[this.mock.collection.calls.length];
        this.mock.collection.calls.push({name: name});
        if (result instanceof Error){
            throw result;
        }
        return result;
    }
};

var MockMongoCollection = function(){
    this.mock = {
        find: new MockMethod(),
        replaceOne: new MockMethod(),
        updateOne: new MockMethod(),
        deleteOne: new MockMethod()
    };
};

MockMongoCollection.prototype = {

    find: function(query){
        var result = this.mock.find.results[this.mock.find.calls.length];
        this.mock.find.calls.push({query: query});
        if (result instanceof Error){
            throw result;
        }
        return result;
    },

    replaceOne: function(query, object, options, callback){
        var result = this.mock.replaceOne.results[this.mock.replaceOne.calls.length];
        this.mock.replaceOne.calls.push({query: query, object: object, options: options});
        if (result instanceof Error){
            throw result;
        }
        JSRunLoop.main.schedule(callback, undefined, result.error, result.update);
    },

    updateOne: function(query, update, options, callback){
        var result = this.mock.updateOne.results[this.mock.updateOne.calls.length];
        this.mock.updateOne.calls.push({query: query, update: update, options: options});
        if (result instanceof Error){
            throw result;
        }
        JSRunLoop.main.schedule(callback, undefined, result.error, result.update);
    },

    deleteOne: function(query, options, callback){
        var result = this.mock.deleteOne.results[this.mock.deleteOne.calls.length];
        this.mock.deleteOne.calls.push({query: query, options: options});
        if (result instanceof Error){
            throw result;
        }
        JSRunLoop.main.schedule(callback, undefined, result.error);
    }
};

var MockMongoCursor = function(){
    this.mock = {
        next: new MockMethod()
    };
};

MockMongoCursor.prototype = {
    next: function(callback){
        var result = this.mock.next.results[this.mock.next.calls.length];
        this.mock.next.calls.push({});
        if (result instanceof Error){
            throw result;
        }
        JSRunLoop.main.schedule(callback, undefined, result.error, result.object);
    }
};

JSClass("DBMongoStoreTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var client = new MockMongoClient();
        var mongodb = {
            MongoClient: function(url, options){
                TKAssertEquals(url, "mongodb://localhost:1234");
                TKAssert(options.useUnifiedTopology);
                return client;
            }
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

    testOpen: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            TKAssertEquals(client.mock.connect.calls.length, 1);
            TKAssertEquals(client.mock.db.calls.length, 1);
            TKAssertEquals(client.mock.db.calls[0].name, "testdb");
        });
        this.wait(expectation, 1.0);
    },

    testObject: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        var object1 = {
            _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.find.results.push(cursor);
        cursor.mock.next.results.push({error: null, object: object1});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNotNull(object);
                TKAssertEquals(collection.mock.find.calls.length, 1);
                TKAssertEquals(collection.mock.find.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(cursor.mock.next.calls.length, 1);
                TKAssertEquals(object.id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(object.a, 1);
                TKAssertEquals(object.b, "two");
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectNotFound: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.find.results.push(cursor);
        cursor.mock.next.results.push({error: new Error("end of cursor"), object: null});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.mock.find.calls.length, 1);
                TKAssertEquals(collection.mock.find.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(cursor.mock.next.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectNextThrows: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.find.results.push(cursor);
        cursor.mock.next.results.push(new Error("failed"));
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.mock.find.calls.length, 1);
                TKAssertEquals(collection.mock.find.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(cursor.mock.next.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectFindThrows: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.find.results.push(new Error("failed"));
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(collection.mock.find.calls.length, 1);
                TKAssertEquals(collection.mock.find.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(cursor.mock.next.calls.length, 0);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSave: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        var object1 = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.replaceOne.results.push({error: null, update: {modifiedCount: 1}});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.save, store, object1, function(success){
                TKAssert(success);
                TKAssertEquals(collection.mock.replaceOne.calls.length, 1);
                TKAssertEquals(collection.mock.replaceOne.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertNotExactEquals(collection.mock.replaceOne.calls[0].object, object1);
                TKAssertEquals(collection.mock.replaceOne.calls[0].object._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.mock.replaceOne.calls[0].object.id);
                TKAssertExactEquals(collection.mock.replaceOne.calls[0].object.a, 1);
                TKAssertExactEquals(collection.mock.replaceOne.calls[0].object.b, "two");
                TKAssertExactEquals(collection.mock.replaceOne.calls[0].options.upsert, true);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveError: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        var object1 = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.replaceOne.results.push({error: new Error("failed"), update: null});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.save, store, object1, function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.mock.replaceOne.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveThrows: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        var object1 = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.replaceOne.results.push(new Error("failed"));
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.save, store, object1, function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.mock.replaceOne.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testExclusiveSave: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor1 = new MockMongoCursor();
        var cursor2 = new MockMongoCursor();
        var object1 = {
            _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        database.mock.collection.results.push(collection);
        database.mock.collection.results.push(collection);
        database.mock.collection.results.push(collection);
        collection.mock.updateOne.results.push({error: new Error("duplicate key"), update: null});
        collection.mock.updateOne.results.push({error: null, update: {modifiedCount: 1, upsertedCount: 0}});
        collection.mock.updateOne.results.push({error: null, update: {modifiedCount: 1, upsertedCount: 0}});
        collection.mock.find.results.push(cursor1);
        collection.mock.find.results.push(cursor2);
        cursor1.mock.next.results.push({error: null, object: object1});
        cursor2.mock.next.results.push({error: null, object: object1});
        collection.mock.replaceOne.results.push({error: null, update: {modifiedCount: 0, upsertedCount: 0}});
        collection.mock.replaceOne.results.push({error: null, update: {modifiedCount: 1, upsertedCount: 0}});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.exclusiveSave, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object, changeCompletion){
                TKAssertEquals(object.a, 1);
                object.a += 1;
                expectation.continue();
                changeCompletion(object);
            }, function(success){
                TKAssert(success);
                TKAssertEquals(collection.mock.updateOne.calls.length, 3);
                TKAssertEquals(collection.mock.updateOne.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.mock.updateOne.calls[0].query.dbkitMongoLock.$exists, false);
                TKAssertType(collection.mock.updateOne.calls[0].update.$set.dbkitMongoLock, "string");
                TKAssertExactEquals(collection.mock.updateOne.calls[0].options.upsert, true);
                TKAssertEquals(collection.mock.updateOne.calls[1].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.mock.updateOne.calls[1].query.dbkitMongoLock.$exists, false);
                TKAssertType(collection.mock.updateOne.calls[1].update.$set.dbkitMongoLock, "string");
                TKAssertExactEquals(collection.mock.updateOne.calls[1].options.upsert, true);
                TKAssertEquals(collection.mock.updateOne.calls[2].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(collection.mock.updateOne.calls[2].query.dbkitMongoLock.$exists, false);
                TKAssertType(collection.mock.updateOne.calls[2].update.$set.dbkitMongoLock, "string");
                TKAssertExactEquals(collection.mock.updateOne.calls[2].options.upsert, true);
                TKAssertEquals(collection.mock.find.calls.length, 2);
                TKAssertEquals(collection.mock.find.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(collection.mock.find.calls[1].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(cursor1.mock.next.calls.length, 1);
                TKAssertEquals(cursor2.mock.next.calls.length, 1);
                TKAssertEquals(collection.mock.replaceOne.calls.length, 2);
                TKAssertEquals(collection.mock.replaceOne.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertNotExactEquals(collection.mock.replaceOne.calls[0].object, object1);
                TKAssertEquals(collection.mock.replaceOne.calls[0].object._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.mock.replaceOne.calls[0].object.id);
                TKAssertExactEquals(collection.mock.replaceOne.calls[0].object.a, 2);
                TKAssertExactEquals(collection.mock.replaceOne.calls[0].object.b, "two");
                TKAssert(!collection.mock.replaceOne.calls[0].options.upsert);
                TKAssertEquals(collection.mock.replaceOne.calls[1].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertNotExactEquals(collection.mock.replaceOne.calls[1].object, object1);
                TKAssertEquals(collection.mock.replaceOne.calls[1].object._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertUndefined(collection.mock.replaceOne.calls[1].object.id);
                TKAssertExactEquals(collection.mock.replaceOne.calls[1].object.a, 2);
                TKAssertExactEquals(collection.mock.replaceOne.calls[1].object.b, "two");
                TKAssert(!collection.mock.replaceOne.calls[1].options.upsert);
            });
        });
        this.wait(expectation, 1.0);
    },

    testDelete: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.deleteOne.results.push({error: null});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssertExactEquals(success, true);
                TKAssertEquals(collection.mock.deleteOne.calls.length, 1);
                TKAssertEquals(collection.mock.deleteOne.calls[0].query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
            });
        });
        this.wait(expectation, 1.0);
    },

    testDeleteError: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.deleteOne.results.push({error: new Error("failed")});
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.mock.deleteOne.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testDeleteThrows: function(){
        var client = new MockMongoClient();
        var database = new MockMongoDatabase();
        var collection = new MockMongoCollection();
        var cursor = new MockMongoCursor();
        client.mock.connect.results.push({error: null, client: client});
        client.mock.db.results.push(database);
        database.mock.collection.results.push(collection);
        collection.mock.deleteOne.results.push(new Error("failed"));
        var mongodb = {
            MongoClient: function(url, options){
                return client;
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssertExactEquals(success, false);
                TKAssertEquals(collection.mock.deleteOne.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

});

})();