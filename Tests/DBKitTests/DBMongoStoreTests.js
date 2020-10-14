// #import DBKit
// #import TestKit
/* global DBMongoStore */
"use strict";

(function(){

var MockMongoClient = function(url){
    this.url = url;
};

MockMongoClient.prototype = {
};

MockMongoClient.connect = function(url, callback){
    var client = new MockMongoClient(url);
};

var MockMongoDatabase = function(name){
    this.name = name;
};

MockMongoDatabase.prototype = {
    collection: function(name){
        return new MockMongoCollection(name);
    }
};

var MockMongoCollection = function(name){
    this.name = name;
};

MockMongoCollection.prototype = {
};

var MockMongoCursor = function(){
};

MockMongoCursor.prototype = {
};

JSClass("DBMongoStoreTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            TKAssertNotNull(client);
            TKAssertNotNull(database);
            TKAssertEquals(client.url, "mongodb://localhost:1234");
            TKAssertEquals(database.name, "testdb");
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObject: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            find: 0,
            next: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.find = function(query){
                    ++calls.find;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    cursor = new MockMongoCursor();
                    cursor.next = function(callback){
                        ++calls.next;
                        JSRunLoop.main.schedule(callback, undefined, null, {
                            _id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                            a: 1,
                            b: "two"
                        });
                    };
                    return cursor;
                };
                return collection;
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNotNull(object);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.find, 1);
                TKAssertEquals(calls.next, 1);
                TKAssertEquals(collection.name, "obj");
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
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            find: 0,
            next: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.find = function(query){
                    ++calls.find;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    cursor = new MockMongoCursor();
                    cursor.next = function(callback){
                        ++calls.next;
                        JSRunLoop.main.schedule(callback, undefined, null, null);
                    };
                    return cursor;
                };
                return collection;
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.find, 1);
                TKAssertEquals(calls.next, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectError: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            find: 0,
            next: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.find = function(query){
                    ++calls.find;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    cursor = new MockMongoCursor();
                    cursor.next = function(callback){
                        ++calls.next;
                        JSRunLoop.main.schedule(callback, undefined, new Error("next error"), null);
                    };
                    return cursor;
                };
                return collection;
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.find, 1);
                TKAssertEquals(calls.next, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectNextThrows: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            find: 0,
            next: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.find = function(query){
                    ++calls.find;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    cursor = new MockMongoCursor();
                    cursor.next = function(callback){
                        ++calls.next;
                        throw new Error("failed");
                    };
                    return cursor;
                };
                return collection;
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.find, 1);
                TKAssertEquals(calls.next, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testObjectFindThrows: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            find: 0,
            next: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.find = function(query){
                    ++calls.find;
                    throw new Error("failed");
                };
                return collection;
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertNull(object);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.find, 1);
                TKAssertEquals(calls.next, 0);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSave: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            replaceOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        var object = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.replaceOne = function(query, document, options, callback){
                    ++calls.replaceOne;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    TKAssertNotExactEquals(document, object);
                    TKAssertEquals(document._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    TKAssertExactEquals(document.a, 1);
                    TKAssertEquals(document.b, "two");
                    TKAssert(options.upsert);
                    JSRunLoop.main.schedule(callback, undefined, null);
                };
                return collection;
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.replaceOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveError: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            replaceOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        var object = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.replaceOne = function(query, document, options, callback){
                    ++calls.replaceOne;
                    JSRunLoop.main.schedule(callback, undefined, new Error("cannot save"));
                };
                return collection;
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.replaceOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testSaveThrows: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            replaceOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        var object = {
            id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
            a: 1,
            b: "two"
        };
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.replaceOne = function(query, document, options, callback){
                    ++calls.replaceOne;
                    throw new Error("failed");
                };
                return collection;
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.replaceOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDelete: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            deleteOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.deleteOne = function(query, options, callback){
                    ++calls.deleteOne;
                    TKAssertEquals(query._id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                    JSRunLoop.main.schedule(callback, undefined, null);
                };
                return collection;
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.deleteOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDeleteError: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            deleteOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.deleteOne = function(query, options, callback){
                    ++calls.deleteOne;
                    JSRunLoop.main.schedule(callback, undefined, new Error("cannot delete"));
                };
                return collection;
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(!success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.deleteOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

    testDeleteThrows: function(){
        var client = null;
        var database = null;
        var mongodb = {
            MongoClient: {
                connect: function(options, callback){
                    client = new MockMongoClient(options);
                    client.db = function(name){
                        database = new MockMongoDatabase(name);
                        return database;
                    };
                    JSRunLoop.main.schedule(callback, undefined, null, client);
                }
            }
        };
        var url = JSURL.initWithString("mongodb://localhost:1234/testdb");
        var store = DBMongoStore.initWithURL(url, mongodb);
        var expectation = TKExpectation.init();
        var calls = {
            collection: 0,
            deleteOne: 0
        };
        var collection;
        var cursor;
        var promise = store.ready();
        expectation.call(promise.then, promise, function(){
            database.collection = function(name){
                ++calls.collection;
                collection = new MockMongoCollection(name);
                collection.deleteOne = function(query, options, callback){
                    ++calls.deleteOne;
                    throw new Error("failed");
                };
                return collection;
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(!success);
                TKAssertEquals(calls.collection, 1);
                TKAssertEquals(calls.deleteOne, 1);
                TKAssertEquals(collection.name, "obj");
            });
        }, function(){
            TKAssert(false, "Expecting promise success");
        });
        this.wait(expectation, 1.0);
    },

});

})();