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
    query: ["query", "cb"]
});

JSClass("DBPostgreSQLEngineTests", TKTestSuite, {

    requiredEnvironment: "node",

    testOpen: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(pg.Client.calls.length, 1);
            TKAssertExactEquals(pg.Client.calls[0].options.host, "sql.breakside.io");
            TKAssertExactEquals(pg.Client.calls[0].options.port, 1234);
            TKAssertExactEquals(pg.Client.calls[0].options.user, "testuser");
            TKAssertExactEquals(pg.Client.calls[0].options.password, "testpass");
            TKAssertExactEquals(pg.Client.calls[0].options.database, "testdb");
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([new Error("failed")]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.Client.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConnectThrow: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addThrow(new Error("failed"));
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.Client.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenCreateConnectionThrow: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addThrow(new Error("failed"));
        client.connect.addThrow(new Error("failed"));
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(pg.Client.calls.length, 1);
            TKAssertExactEquals(client.connect.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testClose: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
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
        pg.Client.addReturn(client);
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
        pg.Client.addReturn(client);
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
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                TKAssertInstance(statement, DBSQLStatement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecute: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([null, {command: "SELECT", rows: [{id: 12}]}]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
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
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", false, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([null, {command: "UPDATE", rowCount: 1}]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "UPDATE test SET name = ? WHERE id = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 2);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(client.query.calls[0].query.values[1], 12);
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    _testExecuteFatalError: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
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
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
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
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                client.query.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecutePersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([null, {command: "SELECT", rows: [{id: 12}]}]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(client.query.calls[0].query.name, "dbkit_0001");
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
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", true, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([null, {command: "UPDATE", rowCount: 1}]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "UPDATE test SET name = ? WHERE id = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 2);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(client.query.calls[0].query.values[1], 12);
                    TKAssertExactEquals(client.query.calls[0].query.name, "dbkit_0001");
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteErrorPesist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertExactEquals(client.query.calls[0].query.name, "dbkit_0001");
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    _testExecuteFatalErrorPersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
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
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                client.query.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].engine, engine);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].error, error);
                    TKAssertExactEquals(client.query.calls[0].query.name, "dbkit_0001");
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteThrowsPersist: function(){
        var pg = new MockPostgreSQL();
        var client = new MockClient();
        pg.Client.addReturn(client);
        client.connect.addCallback([null]);
        var engine = DBPostgreSQLEngine.initWithURL(JSURL.initWithString("pg://testuser:testpass@sql.breakside.io:1234/testdb"), pg);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                client.query.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(client.query.calls.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.text, "SELECT id FROM test WHERE name = ?");
                    TKAssertExactEquals(client.query.calls[0].query.values.length, 1);
                    TKAssertExactEquals(client.query.calls[0].query.values[0], 'hello');
                    TKAssertExactEquals(client.query.calls[0].query.name, "dbkit_0001");
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    }


});

})();