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

// #import "DBSQLEngine.js"
// #import "DBSQLStatement.js"
// jshint node: true
"use strict";

(function(){

var logger = JSLog("dbkit", "sqlite");

JSClass("DBSQLiteEngine", DBSQLEngine, {

    initWithURL: function(url, sqlite){
        if (!sqlite){
            try{
                sqlite = require("sqlite3");
            }catch (e){
                throw new Error("Cannot create DBSQLiteEngine. sqlite3 package not installed.  Add sqlite3 to package.json");
            }
        }
        this.sqlite = sqlite;
        this.url = url;
    },

    open: function(completion){
        var path = this.url.encodedString.substr(this.url.scheme.length + 3);
        var mode = this.sqlite.OPEN_READWRITE | this.sqlite.OPEN_CREATE;
        this.database = this.sqlite.Database(path, mode, function(error){
            if (error){
                logger.info("Error opening sqlite database: %{error}", error);
                completion(false);
                return;
            }
            completion(true);
        });
    },

    close: function(completion){
        if (this.database !== null){
            this.database.close(function(error){
                if (error){
                    logger.error("Error closing sqlite database: %{error}", error);
                }
                completion();
            });
        }else{
            completion();
        }
    },

    prepare: function(query, persist, completion){
        var command = query.substr(0, 10).trim().toUpperCase();
        command = command.substr(0, command.indexOf(" "));
        var sqliteStatement = this.sqlite.prepare(query, function(error){
            if (error){
                logger.error("Error preparing statement: %{error}", error);
                completion(null);
                return;
            }
            completion(DBSQLiteStatement.initWithSQLiteStatement(sqliteStatement, persist, command, this));
        });
    },

    execute: function(statement, parameters, completion){
        var methodName = "run";
        if (statement.command == "SELECT"){
            methodName = "all";
        }
        statement.sqliteStatement[methodName](parameters, function(error, result, fields){
            if (statement.autoClose){
                statement.sqliteStatement.finalize(function(error){
                    if (error){
                        logger.error("Error auto-closing statement: %{error}", error);
                    }
                });
            }
            if (error){
                logger.error("Error executing statement: %{error}", error);
                completion(null);
                return;
            }
            if (methodName === "all"){
                completion(result);
                return;
            }
            completion(true);
        });
    }

});

JSClass("DBSQLiteStatement", DBSQLStatement, {

    initWithSQLiteStatement: function(sqliteStatement, autoClose, command, engine){
        DBSQLiteStatement.$super.initWithEngine.call(this, engine);
        this.sqliteStatement = sqliteStatement;
        this.autoClose = autoClose;
        this.command = command;
    },

    sqliteStatement: null,
    autoClose: false,
    command: false,
});

})();