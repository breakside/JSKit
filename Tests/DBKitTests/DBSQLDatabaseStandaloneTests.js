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

JSClass("DBSQLDatabaseStandaloneTests", TKTestSuite, {

    testInitWithEngine: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        TKAssertExactEquals(db.engine, engine);
        TKAssertExactEquals(engine.delegate, db);
    },

    testOpen: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.open.addCallback([true]);
        expectation.call(db.open, db, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(engine.open.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.open.addCallback([false]);
        expectation.call(db.open, db, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(engine.open.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.open.addCallback([true]);
        var promise = db.open();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(engine.open.calls.length, 1);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testOpenErrorPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.open.addCallback([false]);
        var promise = db.open();
        expectation.call(promise.then, promise, function(){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.open.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testClose: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.close.addCallback([]);
        expectation.call(db.close, db, function(){
            TKAssertExactEquals(engine.close.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testClosePromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.close.addCallback([]);
        var promise = db.close();
        expectation.call(promise.then, promise, function(){
            TKAssertExactEquals(engine.close.calls.length, 1);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testPrepare: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        expectation.call(db.prepare, db, "SELECT id FROM users WHERE name = ?", function(statement2){
            TKAssertExactEquals(statement2, statement);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, true);
        });
        this.wait(expectation, 1.0);
    },

    testPrepareError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.prepare.addCallback([null]);
        expectation.call(db.prepare, db, "SELECT id FROM users WHERE name = ?", function(statement2){
            TKAssertNull(statement2);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, true);
        });
        this.wait(expectation, 1.0);
    },

    testPreparePromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        var promise = db.prepare("SELECT id FROM users WHERE name = ?");
        expectation.call(promise.then, promise, function(statement2){
            TKAssertExactEquals(statement2, statement);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, true);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testPrepareErrorPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        engine.prepare.addCallback([null]);
        var promise = db.prepare("SELECT id FROM users WHERE name = ?");
        expectation.call(promise.then, promise, function(statement2){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, true);
        });
        this.wait(expectation, 1.0);
    },

    testExecute: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([[{id: 12}]]);
        expectation.call(db.execute, db, "SELECT id FROM users WHERE name = ?", ["hello"], function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteNoParams: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([[{id: 12}]]);
        expectation.call(db.execute, db, "SELECT id FROM users", function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatement: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([[{id: 12}]]);
        expectation.call(db.execute, db, statement, ["hello"], function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementNoParams: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([[{id: 12}]]);
        expectation.call(db.execute, db, statement, function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testExecutePromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([[{id: 12}]]);
        var promise = db.execute("SELECT id FROM users WHERE name = ?", ["hello"]);
        expectation.call(promise.then, promise, function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteNoParamsPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([[{id: 12}]]);
        var promise = db.execute("SELECT id FROM users");
        expectation.call(promise.then, promise, function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([[{id: 12}]]);
        var promise = db.execute(statement, ["hello"]);
        expectation.call(promise.then, promise, function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementNoParamsPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([[{id: 12}]]);
        var promise = db.execute(statement);
        expectation.call(promise.then, promise, function(rows){
            TKAssertInstance(rows, Array);
            TKAssertExactEquals(rows.length, 1);
            TKAssertExactEquals(rows[0].id, 12);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        expectation.call(db.execute, db, "SELECT id FROM users WHERE name = ?", ["hello"], function(rows){
            TKAssertNull(rows);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteNoParamsError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        expectation.call(db.execute, db, "SELECT id FROM users", function(rows){
            TKAssertNull(rows);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([null]);
        expectation.call(db.execute, db, statement, ["hello"], function(rows){
            TKAssertNull(rows);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementNoParamsError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([null]);
        expectation.call(db.execute, db, statement, function(rows){
            TKAssertNull(rows);
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testExecutePromiseError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        var promise = db.execute("SELECT id FROM users WHERE name = ?", ["hello"]);
        expectation.call(promise.then, promise, function(rows){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users WHERE name = ?");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteNoParamsPromiseError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        var promise = db.execute("SELECT id FROM users");
        expectation.call(promise.then, promise, function(rows){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "SELECT id FROM users");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementPromiseError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([null]);
        var promise = db.execute(statement, ["hello"]);
        expectation.call(promise.then, promise, function(rows){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].params[0], "hello");
        });
        this.wait(expectation, 1.0);
    },

    testExecuteStatementNoParamsPromiseError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.execute.addCallback([null]);
        var promise = db.execute(statement);
        expectation.call(promise.then, promise, function(rows){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 0);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransaction: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([true]);
        expectation.call(db.beginTransaction, db, function(transaction){
            TKAssertInstance(transaction, DBSQLTransaction);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "BEGIN TRANSACTION");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        expectation.call(db.beginTransaction, db, function(transaction){
            TKAssertNull(transaction);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "BEGIN TRANSACTION");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionPromise: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([true]);
        var promise = db.beginTransaction();
        expectation.call(promise.then, promise, function(transaction){
            TKAssertInstance(transaction, DBSQLTransaction);
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "BEGIN TRANSACTION");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        }, function(){
            TKAssert(false, "Unexpected rejection");
        });
        this.wait(expectation, 1.0);
    },

    testBeginTransactionPromiseError: function(){
        var engine = MockEngine();
        var db = DBSQLDatabaseStandalone.initWithEngine(engine);
        var expectation = TKExpectation.init();
        var statement = DBSQLStatement.initWithEngine(engine);
        engine.prepare.addCallback([statement]);
        engine.execute.addCallback([null]);
        var promise = db.beginTransaction();
        expectation.call(promise.then, promise, function(transaction){
            TKAssert(false, "Unexpected resolve");
        }, function(){
            TKAssertExactEquals(engine.prepare.calls.length, 1);
            TKAssertExactEquals(engine.prepare.calls[0].query, "BEGIN TRANSACTION");
            TKAssertExactEquals(engine.prepare.calls[0].persist, false);
            TKAssertExactEquals(engine.execute.calls.length, 1);
            TKAssertExactEquals(engine.execute.calls[0].statement, statement);
            TKAssertExactEquals(engine.execute.calls[0].params.length, 0);
        });
        this.wait(expectation, 1.0);
    },

});

})();