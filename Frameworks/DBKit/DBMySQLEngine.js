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

var logger = JSLog("dbkit", "mysql");

JSClass("DBMySQLEngine", DBSQLEngine, {

    initWithURL: function(url, mysql){
        if (!mysql){
            try{
                mysql = require("mysql2");
            }catch (e){
                throw new Error("Cannot create DBMySQLEngine. mysql2 package not installed.  Add mysql2 to package.json");
            }
        }
        this.mysql = mysql;
        this.url = url;
    },

    connection: null,

    open: function(completion){
        logger.info("Opening mysql connection to %{public}:%d...", this.url.host, this.url.port);
        var creds = this.url.encodedUserInfo.stringByDecodingUTF8().split(":");
        try{
            var connection = this.mysql.createConnection({
                host: this.url.host,
                port: this.url.port || 3306,
                user: creds[0],
                password: creds[1],
                database: this.url.pathComponents[1]
            });
            var engine = this;
            connection.connect(function(error){
                if (error){
                    logger.error("Error opening mysql connection: %{error}", error);
                    completion(false);
                    return;
                }
                logger.error("mysql connection open");
                engine.connection = connection;
                completion(true);
            });
        }catch (e){
            logger.error("Error thrown calling open: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
            completion(false);
        }
    },

    close: function(completion){
        if (this.connection !== null){
            logger.info("Closing mysql connection to %{public}:%d...", this.url.host, this.url.port);
            try{
                this.connection.end(function(error){
                    if (error){
                        logger.error("Error closing mysql connection: %{error}", error);
                    }else{
                        logger.error("mysql connection closed");   
                    }
                    completion();
                });
            }catch (e){
                logger.error("Error thrown calling close: %{error}", e);
                JSRunLoop.main.schedule(completion);
            }
        }else{
            JSRunLoop.main.schedule(completion);
        }
    },

    prepare: function(query, persist, completion){
        try{
            var engine = this;
            this.connection.prepare(query, function(error, mysqlStatement){
                if (error){
                    logger.error("Error preparing statement: %{error}", error);
                    if (error.fatal){
                        engine.crash(error);
                    }
                    completion(null);
                    return;
                }
                var statement = DBMySQLStatement.initWithMySQLStatement(mysqlStatement, !persist, engine);
                completion(statement);
            });
        }catch (e){
            logger.error("Error thrown calling prepare: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, null);
        }
    },

    execute: function(statement, parameters, completion){
        try{
            var engine = this;
            statement.mysqlStatement.execute(parameters, function(error, result, fields){
                if (error){
                    logger.error("Error executing statement: %{error}", error);
                    if (error.fatal){
                        engine.crash(error);
                    }
                    completion(null);
                    return;
                }
                if (result instanceof Array){
                    completion(result);
                    return;
                }
                completion(true);
            });
        }catch (e){
            JSRunLoop.main.schedule(completion, undefined, null);
        }
        if (statement.autoClose){
            try{
                statement.mysqlStatement.close(function(error){
                    if (error){
                        logger.error("Error auto-closing statement: %{error}", error);
                    }
                });
            }catch (e){
                logger.error("Error thrown auto-closing statement: %{error}", e);
            }
        }
    }

});

JSClass("DBMySQLStatement", DBSQLStatement, {

    initWithMySQLStatement: function(mysqlStatement, autoClose, engine){
        DBMySQLStatement.$super.initWithEngine.call(this, engine);
        this.mysqlStatement = mysqlStatement;
        this.autoClose = autoClose;
    },

    mysqlStatement: null,
    autoClose: false
});

})();