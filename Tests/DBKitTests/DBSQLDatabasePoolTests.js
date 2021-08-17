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
"use strict";

(function(){

var MockEngine = TKMock({

    open: ["cb"],
    close: ["cb"],
    execute: ["statement", "params", "cb"],
    prepare: ["query", "persist", "cb"],

});

var MockStandaloneClass = TKMock({
    initWithURL: ["url"]
});

JSClass("DBSQLDatabasePoolTests", TKTestSuite, {

    testInitWithURL: function(){
        var url = JSURL.initWithString("testsql://");
        var db = DBSQLDatabasePool.initWithURL(url);
        TKAssertExactEquals(db.url, url);
    },

    testOpen: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([false]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testOpenPromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testOpenErrorPromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([false]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testDequeueDatabase: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            expectation.call(pool.dequeueDatabase, pool, function(db){
                TKAssertNotNull(db);
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                expectation.call(pool.dequeueDatabase, pool, function(db){
                    TKAssertNotNull(db);
                    TKAssertExactEquals(db, databases[1]);
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                    expectation.call(pool.dequeueDatabase, pool, function(db){
                        TKAssertNotNull(db);
                        TKAssertExactEquals(db, databases[0]);
                        TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                        TKAssertExactEquals(engines[0].open.calls.length, 1);
                        TKAssertExactEquals(engines[0].close.calls.length, 0);
                        TKAssertExactEquals(engines[1].open.calls.length, 1);
                        TKAssertExactEquals(engines[1].close.calls.length, 0);
                        expectation.call(pool.dequeueDatabase, pool, function(db){
                            TKAssertNotNull(db);
                            TKAssertExactEquals(db, databases[0]);
                            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                            TKAssertExactEquals(engines[0].open.calls.length, 1);
                            TKAssertExactEquals(engines[0].close.calls.length, 0);
                            TKAssertExactEquals(engines[1].open.calls.length, 1);
                            TKAssertExactEquals(engines[1].close.calls.length, 0);
                            expectation.call(pool.dequeueDatabase, pool, function(db){
                                TKAssertNotNull(db);
                                TKAssertExactEquals(db, databases[1]);
                                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                                TKAssertExactEquals(engines[0].open.calls.length, 1);
                                TKAssertExactEquals(engines[0].close.calls.length, 0);
                                TKAssertExactEquals(engines[1].open.calls.length, 1);
                                TKAssertExactEquals(engines[1].close.calls.length, 0);
                            });
                            pool.enqueueDatabase(databases[1]);
                        });
                        pool.enqueueDatabase(databases[0]);
                    });
                    pool.enqueueDatabase(databases[0]);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testDequeueDatabasePromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            var promise = pool.dequeueDatabase();
            expectation.call(promise.then, promise, function(db){
                TKAssertNotNull(db);
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                var promise = pool.dequeueDatabase();
                expectation.call(promise.then, promise, function(db){
                    TKAssertExactEquals(db, databases[1]);
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                    var promise = pool.dequeueDatabase();
                    expectation.call(promise.then, promise, function(db){
                        TKAssertExactEquals(db, databases[0]);
                        TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                        TKAssertExactEquals(engines[0].open.calls.length, 1);
                        TKAssertExactEquals(engines[0].close.calls.length, 0);
                        TKAssertExactEquals(engines[1].open.calls.length, 1);
                        TKAssertExactEquals(engines[1].close.calls.length, 0);
                        var promise = pool.dequeueDatabase();
                        expectation.call(promise.then, promise, function(db){
                            TKAssertExactEquals(db, databases[0]);
                            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                            TKAssertExactEquals(engines[0].open.calls.length, 1);
                            TKAssertExactEquals(engines[0].close.calls.length, 0);
                            TKAssertExactEquals(engines[1].open.calls.length, 1);
                            TKAssertExactEquals(engines[1].close.calls.length, 0);
                            var promise = pool.dequeueDatabase();
                            expectation.call(promise.then, promise, function(db){
                                TKAssertExactEquals(db, databases[1]);
                                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                                TKAssertExactEquals(engines[0].open.calls.length, 1);
                                TKAssertExactEquals(engines[0].close.calls.length, 0);
                                TKAssertExactEquals(engines[1].open.calls.length, 1);
                                TKAssertExactEquals(engines[1].close.calls.length, 0);
                            }, function(){
                                TKAssert(false, "Unexpected rejection");
                            });
                            pool.enqueueDatabase(databases[1]);
                        }, function(){
                            TKAssert(false, "Unexpected rejection");
                        });
                        pool.enqueueDatabase(databases[0]);
                    }, function(){
                        TKAssert(false, "Unexpected rejection");
                    });
                    pool.enqueueDatabase(databases[0]);
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testDequeueDatabaseError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([false]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            expectation.call(pool.dequeueDatabase, pool, function(db){
                TKAssertNotNull(db);
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                expectation.call(pool.dequeueDatabase, pool, function(db){
                    TKAssertNull(db);
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testDequeueDatabasePromiseError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([false]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            var promise = pool.dequeueDatabase();
            expectation.call(promise.then, promise, function(db){
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                var promise = pool.dequeueDatabase();
                expectation.call(promise.then, promise, function(db){
                    TKAssert(false, "Unexpected resolve");
                }, function(){
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testClose: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].close.addCallback([]);
        engines[1].close.addCallback([]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            expectation.call(pool.dequeueDatabase, pool, function(db){
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                expectation.call(pool.dequeueDatabase, pool, function(db){
                    TKAssertExactEquals(db, databases[1]);
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                    pool.enqueueDatabase(databases[0]);
                    expectation.call(pool.close, pool, function(){
                        TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                        TKAssertExactEquals(engines[0].open.calls.length, 1);
                        TKAssertExactEquals(engines[0].close.calls.length, 1);
                        TKAssertExactEquals(engines[1].open.calls.length, 1);
                        TKAssertExactEquals(engines[1].close.calls.length, 1);
                    });
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testClosePromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].close.addCallback([]);
        engines[1].close.addCallback([]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            TKAssertExactEquals(engines[1].open.calls.length, 0);
            TKAssertExactEquals(engines[1].close.calls.length, 0);
            var promise = pool.dequeueDatabase();
            expectation.call(promise.then, promise, function(db){
                TKAssertExactEquals(db, databases[0]);
                TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
                TKAssertExactEquals(engines[0].open.calls.length, 1);
                TKAssertExactEquals(engines[0].close.calls.length, 0);
                TKAssertExactEquals(engines[1].open.calls.length, 0);
                TKAssertExactEquals(engines[1].close.calls.length, 0);
                var promise = pool.dequeueDatabase();
                expectation.call(promise.then, promise, function(db){
                    TKAssertExactEquals(db, databases[1]);
                    TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                    TKAssertExactEquals(engines[0].open.calls.length, 1);
                    TKAssertExactEquals(engines[0].close.calls.length, 0);
                    TKAssertExactEquals(engines[1].open.calls.length, 1);
                    TKAssertExactEquals(engines[1].close.calls.length, 0);
                    pool.enqueueDatabase(databases[0]);
                    var promise = pool.close();
                    expectation.call(promise.then, promise, function(){
                        TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 2);
                        TKAssertExactEquals(engines[0].open.calls.length, 1);
                        TKAssertExactEquals(engines[0].close.calls.length, 1);
                        TKAssertExactEquals(engines[1].open.calls.length, 1);
                        TKAssertExactEquals(engines[1].close.calls.length, 1);
                    }, function(){
                        TKAssert(false, "Unexpected rejection");
                    });
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testPrepare: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.prepare, pool, "SELECT id FROM users WHERE name = ?", function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[0]);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
            });
            expectation.call(pool.prepare, pool, "UPDATE users SET name = ? WHERE id = ?", function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[1]);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, true);
                expectation.call(pool.prepare, pool, "DELETE FROM users WHERE id = ?", function(statement){
                    TKAssertNotNull(statement);
                    TKAssertExactEquals(statement, statements[2]);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([null]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.prepare, pool, "SELECT id FROM users WHERE name = ?", function(statement){
                TKAssertNull(statement);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
            });
            expectation.call(pool.prepare, pool, "UPDATE users SET name = ? WHERE id = ?", function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[1]);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, true);
                expectation.call(pool.prepare, pool, "DELETE FROM users WHERE id = ?", function(statement){
                    TKAssertNotNull(statement);
                    TKAssertExactEquals(statement, statements[2]);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testPreparePromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.prepare("SELECT id FROM users WHERE name = ?");
            expectation.call(promise.then, promise, function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[0]);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
            promise = pool.prepare("UPDATE users SET name = ? WHERE id = ?");
            expectation.call(promise.then, promise, function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[1]);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, true);
                var promise = pool.prepare("DELETE FROM users WHERE id = ?");
                expectation.call(promise.then, promise, function(statement){
                    TKAssertNotNull(statement);
                    TKAssertExactEquals(statement, statements[2]);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, true);
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testPrepareErrorPromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([null]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.prepare("SELECT id FROM users WHERE name = ?");
            expectation.call(promise.then, promise, function(statement){
                TKAssert(false, "Unexpected resolve");
            }, function(){
                TKAssertGreaterThanOrEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
            });
            promise = pool.prepare("UPDATE users SET name = ? WHERE id = ?");
            expectation.call(promise.then, promise, function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[1]);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, true);
                var promise = pool.prepare("DELETE FROM users WHERE id = ?");
                expectation.call(promise.then, promise, function(statement){
                    TKAssertNotNull(statement);
                    TKAssertExactEquals(statement, statements[2]);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, true);
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testExecute: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].execute.addCallback([[{id: 12}]]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.execute, pool, "SELECT id FROM users WHERE name = ?", ["hello"], function(rows){
                TKAssertInstance(rows, Array);
                TKAssertExactEquals(rows.length, 1);
                TKAssertExactEquals(rows[0].id, 12);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].params[0], "hello");
            });
            expectation.call(pool.execute, pool, "UPDATE users SET name = ? WHERE id = ?", ["hello", 12], function(success){
                TKAssertExactEquals(success, true);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[1].execute.calls.length, 1);
                TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                TKAssertExactEquals(engines[1].execute.calls[0].params.length, 2);
                TKAssertExactEquals(engines[1].execute.calls[0].params[0], "hello");
                TKAssertExactEquals(engines[1].execute.calls[0].params[1], 12);
                expectation.call(pool.execute, pool, "DELETE FROM users WHERE id = ?", [12], function(success){
                    TKAssertExactEquals(success, true);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[1].params[0], 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteNoParams: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
        ];
        engines[0].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].execute.addCallback([[{id: 12}]]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.execute, pool, "SELECT id FROM users", function(rows){
                TKAssertInstance(rows, Array);
                TKAssertExactEquals(rows.length, 1);
                TKAssertExactEquals(rows[0].id, 12);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatement: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].execute.addCallback([[{id: 12}]]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.prepare, pool, "SELECT id FROM users WHERE name = ?", function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[0]);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
                expectation.call(pool.execute, pool, statement, ["hello"], function(rows){
                    TKAssertInstance(rows, Array);
                    TKAssertExactEquals(rows.length, 1);
                    TKAssertExactEquals(rows[0].id, 12);
                    TKAssertExactEquals(engines[0].execute.calls.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                    TKAssertExactEquals(engines[0].execute.calls[0].params.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[0].params[0], "hello");
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementNoParams: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].execute.addCallback([[{id: 12}]]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.prepare, pool, "SELECT id FROM users", function(statement){
                TKAssertNotNull(statement);
                TKAssertExactEquals(statement, statements[0]);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, true);
                expectation.call(pool.execute, pool, statement, function(rows){
                    TKAssertInstance(rows, Array);
                    TKAssertExactEquals(rows.length, 1);
                    TKAssertExactEquals(rows[0].id, 12);
                    TKAssertExactEquals(engines[0].execute.calls.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                    TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].execute.addCallback([null]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.execute, pool, "SELECT id FROM users WHERE name = ?", ["hello"], function(rows){
                TKAssertNull(rows, Array);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].params[0], "hello");
            });
            expectation.call(pool.execute, pool, "UPDATE users SET name = ? WHERE id = ?", ["hello", 12], function(success){
                TKAssertExactEquals(success, true);
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[1].execute.calls.length, 1);
                TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                TKAssertExactEquals(engines[1].execute.calls[0].params.length, 2);
                TKAssertExactEquals(engines[1].execute.calls[0].params[0], "hello");
                TKAssertExactEquals(engines[1].execute.calls[0].params[1], 12);
                expectation.call(pool.execute, pool, "DELETE FROM users WHERE id = ?", [12], function(success){
                    TKAssertExactEquals(success, true);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[1].params[0], 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecutePromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].execute.addCallback([[{id: 12}]]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.execute("SELECT id FROM users WHERE name = ?", ["hello"]);
            expectation.call(promise.then, promise, function(rows){
                TKAssertInstance(rows, Array);
                TKAssertExactEquals(rows.length, 1);
                TKAssertExactEquals(rows[0].id, 12);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].params[0], "hello");
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
            promise = pool.execute("UPDATE users SET name = ? WHERE id = ?", ["hello", 12]);
            expectation.call(promise.then, promise, function(){
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[1].execute.calls.length, 1);
                TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                TKAssertExactEquals(engines[1].execute.calls[0].params.length, 2);
                TKAssertExactEquals(engines[1].execute.calls[0].params[0], "hello");
                TKAssertExactEquals(engines[1].execute.calls[0].params[1], 12);
                var promise = pool.execute("DELETE FROM users WHERE id = ?", [12]);
                expectation.call(promise.then, promise, function(){
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[1].params[0], 12);
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        this.wait(expectation, 1.0);
    },

    testExecutePromiseError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0])
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].execute.addCallback([null]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.execute("SELECT id FROM users WHERE name = ?", ["hello"]);
            expectation.call(promise.then, promise, function(rows){
                TKAssert(false, "Unexpected resolve");
            }, function(){
                TKAssertGreaterThanOrEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].params[0], "hello");
            });
            promise = pool.execute("UPDATE users SET name = ? WHERE id = ?", ["hello", 12]);
            expectation.call(promise.then, promise, function(){
                TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                TKAssertExactEquals(engines[1].prepare.calls[0].query, "UPDATE users SET name = ? WHERE id = ?");
                TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[1].execute.calls.length, 1);
                TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                TKAssertExactEquals(engines[1].execute.calls[0].params.length, 2);
                TKAssertExactEquals(engines[1].execute.calls[0].params[0], "hello");
                TKAssertExactEquals(engines[1].execute.calls[0].params[1], 12);
                var promise = pool.execute("DELETE FROM users WHERE id = ?", [12]);
                expectation.call(promise.then, promise, function(){
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "DELETE FROM users WHERE id = ?");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 1);
                    TKAssertExactEquals(engines[0].execute.calls[1].params[0], 12);
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        this.wait(expectation, 1.0);
    },

    testBeginTransaction: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[0].prepare.addCallback([statements[3]]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.beginTransaction, pool, function(transaction1){
                TKAssertNotNull(transaction1);
                TKAssertNotUndefined(transaction1);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "BEGIN TRANSACTION");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
                expectation.call(pool.beginTransaction, pool, function(transaction2){
                    TKAssertNotNull(transaction2);
                    TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                    TKAssertExactEquals(engines[1].prepare.calls[0].query, "BEGIN TRANSACTION");
                    TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                    TKAssertExactEquals(engines[1].execute.calls.length, 1);
                    TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                    TKAssertExactEquals(engines[1].execute.calls[0].params.length, 0);
                    expectation.call(transaction1.commit, transaction1, function(success){
                        TKAssertExactEquals(success, true);
                        TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                        TKAssertExactEquals(engines[0].prepare.calls[1].query, "COMMIT");
                        TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                        TKAssertExactEquals(engines[0].execute.calls.length, 2);
                        TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                        TKAssertExactEquals(engines[0].execute.calls[1].params.length, 0);
                        expectation.call(pool.beginTransaction, pool, function(transaction3){
                            TKAssertNotNull(transaction3);
                            TKAssertExactEquals(engines[0].prepare.calls.length, 3);
                            TKAssertExactEquals(engines[0].prepare.calls[2].query, "BEGIN TRANSACTION");
                            TKAssertExactEquals(engines[0].prepare.calls[2].persist, false);
                            TKAssertExactEquals(engines[0].execute.calls.length, 3);
                            TKAssertExactEquals(engines[0].execute.calls[2].statement, statements[3]);
                            TKAssertExactEquals(engines[0].execute.calls[2].params.length, 0);
                        });
                    });
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionError: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
        ];
        engines[0].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[1]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[0].execute.addCallback([null]);
        engines[0].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        expectation.call(pool.open, pool, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            expectation.call(pool.beginTransaction, pool, function(transaction1){
                TKAssertNull(transaction1);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "BEGIN TRANSACTION");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
                expectation.call(pool.beginTransaction, pool, function(transaction2){
                    TKAssertNotNull(transaction2);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "BEGIN TRANSACTION");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[1]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 0);
                    expectation.call(transaction2.commit, transaction2, function(success){
                        TKAssertExactEquals(success, true);
                        TKAssertExactEquals(engines[0].prepare.calls.length, 3);
                        TKAssertExactEquals(engines[0].prepare.calls[2].query, "COMMIT");
                        TKAssertExactEquals(engines[0].prepare.calls[2].persist, false);
                        TKAssertExactEquals(engines[0].execute.calls.length, 3);
                        TKAssertExactEquals(engines[0].execute.calls[2].statement, statements[2]);
                        TKAssertExactEquals(engines[0].execute.calls[2].params.length, 0);
                    });
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionPromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[1]),
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
        ];
        engines[0].open.addCallback([true]);
        engines[1].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[1].prepare.addCallback([statements[1]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[0].prepare.addCallback([statements[3]]);
        engines[0].execute.addCallback([true]);
        engines[1].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.beginTransaction();
            expectation.call(promise.then, promise, function(transaction1){
                TKAssertNotNull(transaction1);
                TKAssertNotUndefined(transaction1);
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "BEGIN TRANSACTION");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
                var promise = pool.beginTransaction();
                expectation.call(promise.then, promise, function(transaction2){
                    TKAssertNotNull(transaction2);
                    TKAssertExactEquals(engines[1].prepare.calls.length, 1);
                    TKAssertExactEquals(engines[1].prepare.calls[0].query, "BEGIN TRANSACTION");
                    TKAssertExactEquals(engines[1].prepare.calls[0].persist, false);
                    TKAssertExactEquals(engines[1].execute.calls.length, 1);
                    TKAssertExactEquals(engines[1].execute.calls[0].statement, statements[1]);
                    TKAssertExactEquals(engines[1].execute.calls[0].params.length, 0);
                    var promise = transaction1.commit();
                    expectation.call(promise.then, promise, function(){
                        TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                        TKAssertExactEquals(engines[0].prepare.calls[1].query, "COMMIT");
                        TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                        TKAssertExactEquals(engines[0].execute.calls.length, 2);
                        TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[2]);
                        TKAssertExactEquals(engines[0].execute.calls[1].params.length, 0);
                        var promise = pool.beginTransaction();
                        expectation.call(promise.then, promise, function(transaction3){
                            TKAssertNotNull(transaction3);
                            TKAssertExactEquals(engines[0].prepare.calls.length, 3);
                            TKAssertExactEquals(engines[0].prepare.calls[2].query, "BEGIN TRANSACTION");
                            TKAssertExactEquals(engines[0].prepare.calls[2].persist, false);
                            TKAssertExactEquals(engines[0].execute.calls.length, 3);
                            TKAssertExactEquals(engines[0].execute.calls[2].statement, statements[3]);
                            TKAssertExactEquals(engines[0].execute.calls[2].params.length, 0);
                        }, function(){
                            TKAssert(false, "Unexpected rejection");
                        });
                    }, function(){
                        TKAssert(false, "Unexpected rejection");
                    });
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            }, function(){
                TKAssert(false, "Unexpected rejection");
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionErrorPromise: function(){
        var url = JSURL.initWithString("testsql://");
        var pool = DBSQLDatabasePool.initWithURL(url, 2);
        pool.standaloneClass = new MockStandaloneClass();
        var engines = [
            MockEngine(),
            MockEngine()
        ];
        var databases = [];
        var db;
        for (var i = 0, l = engines.length; i < l; ++i){
            db = DBSQLDatabaseStandalone.initWithEngine(engines[i]);
            databases.push(db);
            pool.standaloneClass.initWithURL.addReturn(db);
        }
        var expectation = TKExpectation.init();
        var statements = [
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
            DBSQLStatement.initWithEngine(engines[0]),
        ];
        engines[0].open.addCallback([true]);
        engines[0].prepare.addCallback([statements[0]]);
        engines[0].prepare.addCallback([statements[1]]);
        engines[0].prepare.addCallback([statements[2]]);
        engines[0].execute.addCallback([null]);
        engines[0].execute.addCallback([true]);
        engines[0].execute.addCallback([true]);
        var promise = pool.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(pool.standaloneClass.initWithURL.calls.length, 1);
            TKAssertExactEquals(engines[0].open.calls.length, 1);
            TKAssertExactEquals(engines[0].close.calls.length, 0);
            var promise = pool.beginTransaction();
            expectation.call(promise.then, promise, function(){
                TKAssert(false, "Unexpected resolve");
            }, function(){
                TKAssertExactEquals(engines[0].prepare.calls.length, 1);
                TKAssertExactEquals(engines[0].prepare.calls[0].query, "BEGIN TRANSACTION");
                TKAssertExactEquals(engines[0].prepare.calls[0].persist, false);
                TKAssertExactEquals(engines[0].execute.calls.length, 1);
                TKAssertExactEquals(engines[0].execute.calls[0].statement, statements[0]);
                TKAssertExactEquals(engines[0].execute.calls[0].params.length, 0);
                var promise = pool.beginTransaction();
                expectation.call(promise.then, promise, function(transaction2){
                    TKAssertNotNull(transaction2);
                    TKAssertExactEquals(engines[0].prepare.calls.length, 2);
                    TKAssertExactEquals(engines[0].prepare.calls[1].query, "BEGIN TRANSACTION");
                    TKAssertExactEquals(engines[0].prepare.calls[1].persist, false);
                    TKAssertExactEquals(engines[0].execute.calls.length, 2);
                    TKAssertExactEquals(engines[0].execute.calls[1].statement, statements[1]);
                    TKAssertExactEquals(engines[0].execute.calls[1].params.length, 0);
                    var promise = transaction2.commit();
                    expectation.call(promise.then, promise, function(){
                        TKAssertExactEquals(engines[0].prepare.calls.length, 3);
                        TKAssertExactEquals(engines[0].prepare.calls[2].query, "COMMIT");
                        TKAssertExactEquals(engines[0].prepare.calls[2].persist, false);
                        TKAssertExactEquals(engines[0].execute.calls.length, 3);
                        TKAssertExactEquals(engines[0].execute.calls[2].statement, statements[2]);
                        TKAssertExactEquals(engines[0].execute.calls[2].params.length, 0);
                    }, function(){
                        TKAssert(false, "Unexpected rejection");
                    });
                }, function(){
                    TKAssert(false, "Unexpected rejection");
                });
            });
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    }

});

})();