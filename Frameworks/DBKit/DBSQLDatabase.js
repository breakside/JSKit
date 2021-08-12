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
/* global DBMySQLEngine, DBPostgreSQLEngine, DBSQLiteEngine */
"use strict";

(function(){

var logger = JSLog("dbkit", "sql");

JSClass("DBSQLDatabase", JSObject, {

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
    },

    engine: JSReadOnlyProperty("_engine", null),

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
        function handler(success){
            completion.call(target);
        }
        var promise = this.engine.open(handler);
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

    transaction: function(operations, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var db = this;
        db.execute("BEGIN TRASACTION", function(results){
            if (results === null){
                completion.call(target, false);
                return;
            }
            operations().then(function(){
                db.execute("COMMIT", function(results){
                    if (results === null){
                        completion.call(target, false);
                        return;
                    }
                    completion.call(target, true);
                });
            }, function(error){
                logger.error("Error in transaction: %{error}", error);
                db.execute("ROLLBACK", function(results){
                    completion.call(target, false); 
                });
            });
        });
        return completion.promise;
    }
});

})();