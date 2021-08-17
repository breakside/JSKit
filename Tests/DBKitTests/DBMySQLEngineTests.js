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
/* global DBMySQLEngine */
"use strict";

(function(){

var MockMySQL = TKMock({
    createConnection: ["options", "cb"]
});

var MockConnection = TKMock({
    connect: ["cb"],
    end: ["cb"],
    prepare: ["query", "cb"]
});

var MockStatement = TKMock({
    execute: ["params", "cb"],
    close: ["cb"]
});

JSClass("DBMySQLEngineTests", TKTestSuite, {

    requiredEnvironment: "node",

    testOpen: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            TKAssertExactEquals(mysql.createConnection.calls.length, 1);
            TKAssertExactEquals(mysql.createConnection.calls[0].options.host, "sql.breakside.io");
            TKAssertExactEquals(mysql.createConnection.calls[0].options.port, 1234);
            TKAssertExactEquals(mysql.createConnection.calls[0].options.user, "testuser");
            TKAssertExactEquals(mysql.createConnection.calls[0].options.password, "testpass");
            TKAssertExactEquals(mysql.createConnection.calls[0].options.database, "testdb");
            TKAssertExactEquals(connection.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([new Error("failed")]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(mysql.createConnection.calls.length, 1);
            TKAssertExactEquals(connection.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenConnectThrow: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addThrow(new Error("failed"));
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(mysql.createConnection.calls.length, 1);
            TKAssertExactEquals(connection.connect.calls.length, 1);
        });
        this.wait(expectation, 1.0);
    },

    testOpenCreateConnectionThrow: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addThrow(new Error("failed"));
        connection.connect.addThrow(new Error("failed"));
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, false);
            TKAssertExactEquals(mysql.createConnection.calls.length, 1);
            TKAssertExactEquals(connection.connect.calls.length, 0);
        });
        this.wait(expectation, 1.0);
    },

    testClose: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.end.addCallback([null]);
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(connection.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testCloseError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.end.addCallback([new Error("failed")]);
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(connection.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testCloseThrows: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.end.addThrow(new Error("failed"));
            expectation.call(engine.close, engine, function(){
                TKAssertExactEquals(connection.end.calls.length, 1);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepare: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(connection.prepare.calls.length, 1);
                TKAssertExactEquals(connection.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertNotNull(statement);
                TKAssertInstance(statement, DBSQLStatement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.prepare.addCallback([error, null]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(connection.prepare.calls.length, 1);
                TKAssertExactEquals(connection.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareFatalError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.prepare.addCallback([error, null]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(connection.prepare.calls.length, 1);
                TKAssertExactEquals(connection.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 1);
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].engine, engine);
                TKAssertExactEquals(engine.delegate.engineDidCrash.calls[0].error, error);
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testPrepareThrows: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            connection.prepare.addThrow(new Error("failed"));
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertExactEquals(connection.prepare.calls.length, 1);
                TKAssertExactEquals(connection.prepare.calls[0].query, "SELECT id FROM test WHERE name = ?");
                TKAssertNull(statement);
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecute: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, [{id: 12}]]);
                mysqlStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteCloseError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, [{id: 12}]]);
                mysqlStatement.close.addCallback([new Error("failed")]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteCloseThrows: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, [{id: 12}]]);
                mysqlStatement.close.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteUpdate: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, {affectedRows: 1}]);
                mysqlStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 2);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[1], 12);
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([error, null]);
                mysqlStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteFatalError: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([error, null]);
                mysqlStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
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
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", false, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addThrow(new Error("failed"));
                mysqlStatement.close.addCallback([null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 1);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecutePersist: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, [{id: 12}]]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 0);
                    TKAssertInstance(results, Array);
                    TKAssertExactEquals(results.length, 1);
                    TKAssertExactEquals(results[0].id, 12);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteUpdatePersist: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "UPDATE test SET name = ? WHERE id = ?", true, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([null, {affectedRows: 1}]);
                expectation.call(engine.execute, engine, statement, ['hello', 12], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 2);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[1], 12);
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 0);
                    TKAssertExactEquals(results, true);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteErrorPersist: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 0);
                    TKAssertExactEquals(engine.delegate.engineDidCrash.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },

    testExecuteFatalErrorPersist: function(){
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        var error = new Error("failed");
        error.fatal = true;
        engine.delegate = TKMock({
            engineDidCrash: ["engine", "error"]
        })();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addCallback([error, null]);
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 0);
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
        var mysql = new MockMySQL();
        var connection = new MockConnection();
        mysql.createConnection.addReturn(connection);
        connection.connect.addCallback([null]);
        var engine = DBMySQLEngine.initWithURL(JSURL.initWithString("mysql://testuser:testpass@sql.breakside.io:1234/testdb"), mysql);
        var expectation = TKExpectation.init();
        expectation.call(engine.open, engine, function(success){
            TKAssertExactEquals(success, true);
            var mysqlStatement = new MockStatement();
            connection.prepare.addCallback([null, mysqlStatement]);
            expectation.call(engine.prepare, engine, "SELECT id FROM test WHERE name = ?", true, function(statement){
                TKAssertNotNull(statement);
                mysqlStatement.execute.addThrow(new Error("failed"));
                expectation.call(engine.execute, engine, statement, ['hello'], function(results){
                    TKAssertExactEquals(mysqlStatement.execute.calls.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params.length, 1);
                    TKAssertExactEquals(mysqlStatement.execute.calls[0].params[0], 'hello');
                    TKAssertExactEquals(mysqlStatement.close.calls.length, 0);
                    TKAssertNull(results);
                });
            });
        });
        this.wait(expectation, 1.0);
    },


});

})();