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
    }

});

})();