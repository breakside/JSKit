// Copyright 2021 Breakside Inc.
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

// #import Foundation
// #import "DBSQLStatement.js"
// #import "DBSQLTransaction.js"
/* global DBMySQLEngine, DBPostgreSQLEngine, DBSQLiteEngine */
"use strict";

(function(){

var logger = JSLog("dbkit", "sql");

JSProtocol("DBSQLDatabaseDelegate", JSProtocol, {

    databaseDidClose: function(database){}

});

JSClass("DBSQLDatabase", JSObject, {

    initWithURL: function(url, maximumNumberOfConnections){
        if (maximumNumberOfConnections === undefined){
            maximumNumberOfConnections = 5;
        }
        return DBSQLDatabasePool.initWithURL(url, maximumNumberOfConnections);
    },

    initStandaloneWithURL: function(url){
        return DBSQLDatabaseStandalone.initWithURL(url);
    },

    delegate: null,

    open: function(completion, target){
        JSRunLoop.main.schedule(completion, target, false);
    },

    close: function(completion, target){
        JSRunLoop.main.schedule(completion, target);
    },

    execute: function(query, parameters, completion, target){
        JSRunLoop.main.schedule(completion, target, null);
    },

    prepare: function(query, completion, target){
        JSRunLoop.main.schedule(completion, target, null);
    },

    beginTransaction: function(completion, target){
        JSRunLoop.main.schedule(completion, target, null);
    },

    transaction: function(operations, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.beginTransaction(function(transaction){
            if (transaction === null){
                completion.call(target, false);
                return;
            }
            var commit = function(){
                transaction.commit(completion, target);
            };
            var rollback = function(){
                transaction.rollback(function(){
                    completion.call(target, false);
                });
            };
            try{
                var promise = operations(transaction, function(success){
                    if (success){
                        commit();
                    }else{
                        rollback();
                    }
                });
                if (promise instanceof Promise){
                    promise.then(commit, rollback);
                }
            }catch (e){
                rollback();
            }
        }, this);
        return completion.promise;
    }
});

JSClass("DBSQLDatabaseStandalone", DBSQLDatabase, {

    initWithURL: function(url){
        var engine = null;
        if (url.scheme === "sqlite"){
            if (JSGlobalObject.DBSQLiteEngine){
                engine = DBSQLiteEngine.initWithURL(url);
            }else{
                throw new Error("sqlite database not supported for this environment");
            }
        }else if (url.scheme === "mysql"){
            if (JSGlobalObject.DBMySQLEngine){
                engine = DBMySQLEngine.initWithURL(url);
            }else{
                throw new Error("mysql database not supported for this environment");
            }
        }else if (url.scheme === "pgsql" || url.scheme == "postgresql"){
            if (JSGlobalObject.DBPostgreSQLEngine){
                engine = DBPostgreSQLEngine.initWithURL(url);
            }else{
                throw new Error("pgsql database not supported for this environment");
            }
        }else{
            throw new Error("%s object database not supported".sprintf(url.scheme));
        }
        this.initWithEngine(engine);
    },

    initWithEngine: function(engine){
        this._engine = engine;
        this._engine.delegate = this;
    },

    engine: JSReadOnlyProperty("_engine", null),

    engineDidCrash: function(engine, error){
        this.close();
    },

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        function handler(success){
            completion.call(target, success);
        }
        var promise = this.engine.open(handler);
        if (promise instanceof Promise){
            promise.then(function(){
                return true;
            }, function(error){
                logger.error("Error opening database: %{error}", error);
                return false;
            }).then(handler);
        }
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this.delegate && this.delegate.databaseDidClose){
            this.delegate.databaseDidClose(this);   
        }
        function handler(success){
            completion.call(target);
        }
        var promise = this.engine.close(handler);
        if (promise instanceof Promise){
            promise.catch(function(error){
                logger.error("Error closing database: %{error}", error);
            }).then(handler);
        }
        return completion.promise;
    },

    execute: function(query, parameters, completion, target){
        if (typeof(parameters) === 'function'){
            target = completion;
            completion = parameters;
            parameters = [];
        }
        if (parameters === undefined){
            parameters = [];
        }
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (query instanceof DBSQLStatement){
            query.execute(parameters, completion, target);
        }else{
            var handler = function(statement){
                if (statement === null){
                    completion.call(target, null);
                    return;
                }
                statement.execute(parameters, completion, target);
            };
            var promise = this.engine.prepare(query, false, handler);
            if (promise instanceof Promise){
                promise.catch(function(error){
                    logger.error("Error auto-preparing statement: %{error}", error);
                    return null;
                }).then(handler);
            }
        }
        return completion.promise;
    },

    prepare: function(query, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        function handler(statement){
            completion.call(target, statement);
        }
        var promise = this.engine.prepare(query, true, handler);
        if (promise instanceof Promise){
            promise.catch(function(error){
                logger.error("Error preparing statement: %{error}", error);
                return null;
            }).then(handler);
        }
        return completion.promise;
    },

    beginTransaction: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.execute("BEGIN TRANSACTION", [], function(results){
            if (results === null){
                completion.call(target, null);
            }else{
                var transaction = DBSQLTransaction.initWithDatabase(this);
                completion.call(target, transaction);
            }
        }, this);
        return completion.promise;
    }

});

JSClass("DBSQLDatabasePool", DBSQLDatabase, {

    initWithURL: function(url, maximumNumberOfConnections){
        if (maximumNumberOfConnections === undefined){
            maximumNumberOfConnections = 5;
        }
        this.url = url;
        this.maximumNumberOfConnections = maximumNumberOfConnections;
        this.databases = [];
        this.availableDatabases = [];
        this.waitQueue = [];
    },

    url: null,
    maximumNumberOfConnections: 5,
    databases: null,
    availableDatabases: null,
    standaloneClass: DBSQLDatabaseStandalone,

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.dequeueDatabase(function(database){
            if (database !== null){
                this.enqueueDatabase(database);
                completion.call(target, true);
            }else{
                completion.call(target, false);
            }
        }, this);
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.availableDatabases = [];
        this.maximumNumberOfConnections = 0;
        var closeNext = function(){
            if (this.databases.length === 0){
                completion.call(target, true);
            }else{
                var database = this.databases.pop();
                database.delegate = null;
                database.close(function(){
                    closeNext.call(this);
                }, this);
            }
        };
        closeNext.call(this);
        return completion.promise;
    },

    dequeueDatabase: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (this.availableDatabases.length > 0){
            completion.call(target, this.availableDatabases.shift());
        }else{
            if (this.databases.length < this.maximumNumberOfConnections){
                var database = this.standaloneClass.initWithURL(this.url);
                this.databases.push(database);
                database.open(function(success){
                    if (!success){
                        var index = this.databases.indexOf(database);
                        this.databases.splice(index, 1);
                        completion.call(target, null);
                    }else{
                        database.delegate = this;
                        completion.call(target, database);
                    }
                }, this);
            }else{
                this.waitQueue.push({completion: completion, target: target});
            }
        }
        return completion.promise;
    },

    waitQueue: null,

    enqueueDatabase: function(database){
        var index = this.databases.indexOf(database);
        if (index >= 0){
            if (this.waitQueue.length === 0){
                this.availableDatabases.push(database);
            }else{
                var waiter = this.waitQueue.shift();
                if (waiter.query && waiter.query.engine === database.engine){
                    waiter.query.execute(waiter.parameters, function(results){
                        this.enqueueDatabase(database);
                        waiter.completion.call(waiter.target, results);
                    }, this);
                }else{
                    JSRunLoop.main.schedule(waiter.completion, waiter.target, database);
                }
            }
        }
    },

    databaseDidClose: function(database){
        var index = this.databases.indexOf(database);
        if (index >= 0){
            database.delegate = null;
            this.databases.splice(index, 1);
            index = this.availableDatabases.indexOf(database);
            if (index >= 0){
                this.availableDatabases.splice(index, 1);
            }
        }
    },

    execute: function(query, parameters, completion, target){
        if (typeof(parameters) === 'function'){
            target = completion;
            completion = parameters;
            parameters = [];
        }
        if (parameters === undefined){
            parameters = [];
        }
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        if (query instanceof DBSQLStatement){
            var database = null;
            for (var i = 0, l = this.availableDatabases.length; i < l && database === null; ++i){
                if (this.availableDatabases[i].engine === query.engine){
                    database = this.availableDatabases[i];
                    this.availableDatabases.splice(i, 1);
                }
            }
            if (database !== null){
                query.execute(parameters, function(results){
                    this.enqueueDatabase(database);
                    completion.call(target, results);
                }, this);
            }else{
                this.waitQueue.push({query: query, parameters: parameters, completion: completion, target: target});
            }
        }else{
            this.dequeueDatabase(function(database){
                if (database === null){
                    completion.call(target, null);
                    return;
                }
                database.execute(query, parameters, function(results){
                    this.enqueueDatabase(database);
                    completion.call(target, results);
                }, this);
            }, this);
        }
        return completion.promise;
    },

    prepare: function(query, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.dequeueDatabase(function(database){
            if (database === null){
                completion.call(target, null);
                return;
            }
            database.prepare(query, function(statement){
                this.enqueueDatabase(database);
                completion.call(target, statement);
            }, this);
        }, this);
        return completion.promise;
    },

    beginTransaction: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.dequeueDatabase(function(database){
            if (database === null){
                completion.call(target, null);
                return;
            }
            database.beginTransaction(function(transaction){
                if (transaction === null){
                    this.enqueueDatabase(database);
                    completion.call(target, null);
                    return;
                }
                transaction.addCompletion(function(success){
                    this.enqueueDatabase(database);
                }, this);
                completion.call(target, transaction);
            }, this);
        }, this);
        return completion.promise;
    }

});

})();