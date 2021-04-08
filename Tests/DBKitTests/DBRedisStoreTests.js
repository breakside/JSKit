// #import DBKit
// #import TestKit
/* global DBRedisStore */
"use strict";

(function(){

var MockRedisClient = function(options){
    this.options = options;
    this.listenersByEvent = {};
    JSRunLoop.main.schedule(this.emit, this, "ready");
};

MockRedisClient.prototype = {

    listenersByEvent: null,

    on: function(event, callback){
        var listeners = this.listenersByEvent[event];
        if (!listeners){
            listeners = this.listenersByEvent[event] = [];
        }
        listeners.push(callback);
    },

    off: function(event, callback){
        var listeners = this.listenersByEvent[event];
        if (listeners){
            for (var i = 0, l = listeners.length; i < l; ++i){
                if (listeners[i] === callback){
                    listeners.splice(i, 1);
                    return;
                }
            }
        }
    },

    emit: function(event){
        var listeners = this.listenersByEvent[event];
        for (var i = 0, l = listeners.length; i < l; ++i){
            listeners[i].call(undefined);
        }
    }

};

JSClass("DBRedisStoreTests", TKTestSuite, {

    requiredEnvironment: "node",

    testInitWithURL: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            TKAssertNotNull(client);
            TKAssertEquals(client.options.url, "redis://localhost:1234");
        });
        this.wait(expectation, 1.0);
    },

    testObject: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            get: 0
        };
        expectation.call(store.open, store, function(success){
            TKAssert(success);
            client.get = function(key, callback){
                ++calls.get;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                var json = JSON.stringify({
                    id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                    a: 1,
                    b: "two"
                });
                JSRunLoop.main.schedule(callback, undefined, null, json);
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertEquals(calls.get, 1);
                TKAssertNotNull(object);
                TKAssertEquals(object.id, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertExactEquals(object.a, 1);
                TKAssertEquals(object.b, "two");
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectNotFound: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            get: 0
        };
        expectation.call(store.open, store, function(success){
            client.get = function(key, callback){
                ++calls.get;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                JSRunLoop.main.schedule(callback, undefined, null, null);
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertEquals(calls.get, 1);
                TKAssertNull(object);
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            get: 0
        };
        expectation.call(store.open, store, function(success){
            client.get = function(key, callback){
                ++calls.get;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                JSRunLoop.main.schedule(callback, undefined, new Error("hello"), null);
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertEquals(calls.get, 1);
                TKAssertNull(object);
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectBadJSON: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            get: 0
        };
        expectation.call(store.open, store, function(success){
            client.get = function(key, callback){
                ++calls.get;
                var json = "not real json";
                JSRunLoop.main.schedule(callback, undefined, null, json);
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertEquals(calls.get, 1);
                TKAssertNull(object);
            });
        });
        this.wait(expectation, 1.0);
    },

    testObjectThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            get: 0
        };
        expectation.call(store.open, store, function(success){
            client.get = function(key, callback){
                ++calls.get;
                throw new Error("failed");
            };
            expectation.call(store.object, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(object){
                TKAssertEquals(calls.get, 1);
                TKAssertNull(object);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSave: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                TKAssertEquals(args.length, 2);
                TKAssertEquals(args[0], "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(args[1], '{"id":"obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1","a":1,"b":"two"}');
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                JSRunLoop.main.schedule(callback, undefined, new Error("cannot save"), null);
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                throw new Error("failed");
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.save, store, object, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveExpiring: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                TKAssertEquals(args.length, 4);
                TKAssertEquals(args[0], "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(args[1], '{"id":"obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1","a":1,"b":"two"}');
                TKAssertEquals(args[2], "EX");
                TKAssertEquals(args[3], 15);
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.saveExpiring, store, object, 15, function(success){
                TKAssert(success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveExpiringError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                JSRunLoop.main.schedule(callback, undefined, new Error("cannot save"), null);
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.saveExpiring, store, object, 15, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testSaveExpiringThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            set: 0
        };
        expectation.call(store.open, store, function(success){
            client.set = function(args, callback){
                ++calls.set;
                throw new Error("failed");
            };
            var object = {
                id: "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1",
                a: 1,
                b: "two"
            };
            expectation.call(store.saveExpiring, store, object, 15, function(success){
                TKAssert(!success);
                TKAssertEquals(calls.set, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testDelete: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            del: 0
        };
        expectation.call(store.open, store, function(success){
            client.del = function(key, callback){
                ++calls.del;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(success);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testDeleteError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            del: 0
        };
        expectation.call(store.open, store, function(success){
            client.del = function(args, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, new Error("cannot delete"), null);
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(!success);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testDeleteThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            del: 0
        };
        expectation.call(store.open, store, function(success){
            client.del = function(args, callback){
                ++calls.del;
                throw new Error("failed");
            };
            expectation.call(store.delete, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", function(success){
                TKAssert(!success);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiring: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                TKAssertEquals(key, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1");
                TKAssertEquals(lifetime, 15);
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertExactEquals(result, 2);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 0);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringExpireError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot expire"), 0);
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringDelError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot expire"), 0);
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot delete"), 0);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringIncrError: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot increment"), 0);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot expire"), 0);
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot delete"), 0);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 0);
                TKAssertEquals(calls.del, 0);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringExpireThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                throw new Error("failed");
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, null, 1);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringDelThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot expire"), 0);
            };
            client.del = function(key, callback){
                ++calls.del;
                throw new Error("failed");
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringExpireAndDelThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                JSRunLoop.main.schedule(callback, undefined, null, 2);
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                throw new Error("expire failed");
            };
            client.del = function(key, callback){
                ++calls.del;
                throw new Error("del failed");
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 1);
                TKAssertEquals(calls.del, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testIncrementExpiringIncrThrows: function(){
        var client = null;
        var redis = {
            createClient: function(options){
                client = new MockRedisClient(options);
                return client;
            }
        };
        var url = JSURL.initWithString("redis://localhost:1234");
        var store = DBRedisStore.initWithURL(url, redis);
        var expectation = TKExpectation.init();
        var calls = {
            incr: 0,
            expire: 0,
            del: 0,
        };
        expectation.call(store.open, store, function(success){
            client.incr = function(key, callback){
                ++calls.incr;
                throw new Error("failed");
            };
            client.expire = function(key, lifetime, callback){
                ++calls.expire;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot expire"), 0);
            };
            client.del = function(key, callback){
                ++calls.del;
                JSRunLoop.main.schedule(callback, undefined, new Error("Cannot delete"), 0);
            };
            expectation.call(store.incrementExpiring, store, "obj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx1", 15, function(result){
                TKAssertNull(result);
                TKAssertEquals(calls.incr, 1);
                TKAssertEquals(calls.expire, 0);
                TKAssertEquals(calls.del, 0);
            });
        });
        this.wait(expectation, 1.0);
    },

});

})();