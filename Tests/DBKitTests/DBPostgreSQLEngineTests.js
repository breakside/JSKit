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
/* global DBPostgreSQLEngine */
"use strict";

(function(){

var MockPostgreSQL = TKMock({
    Client: ["options", "cb"]
});

var MockClient = TKMock({
    connect: ["cb"],
    end: ["cb"],
    query: ["query", "param", "cb"]
});

JSClass("DBPostgreSQLEngineTests", TKTestSuite, {

    requiredEnvironment: "node",

    testOpen: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pg.createConnection.calls.length, 1);
            TKAssertExactEquals(pg.createConnection.calls[0].options.host, "sql.breakside.io");
            TKAssertExactEquals(pg.createConnection.calls[0].options.port, 1234);
            TKAssertExactEquals(pg.createConnection.calls[0].options.user, "testuser");
            TKAssertExactEquals(pg.createConnection.calls[0].options.password, "testpass");
            TKAssertExactEquals(pg.createConnection.calls[0].options.database, "testdb");
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([new Error("failed")]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.createConnection.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConnectThrow: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addThrow(new Error("failed"));
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.createConnection.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenCreateConnectionThrow: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addThrow(new Error("failed"));
        client.connect.addThrow(new Error("failed"));
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.createConnection.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testClose: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.end.addCallback([null]);
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(client.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testCloseError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.end.addCallback([new Error("failed")]);
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(client.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testCloseThrows: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.end.addThrow(new Error("failed"));
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(client.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepare: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(client.prepare.calls.length, 1);
                TKAssertExactEquals(client.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertNotNull(statement);
                TKAssertInstance(statement, DBSQLStatement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.prepare.addCallback([error, null]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(client.prepare.calls.length, 1);
                TKAssertExactEquals(client.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareFatalError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.prepare.addCallback([error, null]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(client.prepare.calls.length, 1);
                TKAssertExactEquals(client.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 1);
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].engine, engine);
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].error, error);
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareThrows: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            client.prepare.addThrow(new Error("failed"));
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(client.prepare.calls.length, 1);
                TKAssertExactEquals(client.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecute: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, [{id: 12}]]);
                pgStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteCloseError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, [{id: 12}]]);
                pgStatement.close.addCallback([new Error("failed")]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteCloseThrows: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, [{id: 12}]]);
                pgStatement.close.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteUpdate: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, {affectedRows: 1}]);
                pgStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 2);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[1], 12);
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([error, null]);
                pgStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteFatalError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([error, null]);
                pgStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].engine, engine);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].error, error);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteThrows: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addThrow(new Error("failed"));
                pgStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 1);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecutePersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, [{id: 12}]]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 0);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteUpdatePersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", true, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([null, {affectedRows: 1}]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 2);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[1], 12);
                    TKAssertExactEquals(pgStatement.close.calls.length, 0);
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteErrorPersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 0);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteFatalErrorPersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 0);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].engine, engine);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].error, error);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteThrowsPersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.createConnection.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var pgStatement = new MockStatement();
            client.prepare.addCallback([null, pgStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                pgStatement.execute.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(pgStatement.execute.calls.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(pgStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(pgStatement.close.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },


});

})();