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
        logger.info("Opening msyql connection to %{public}:%d...", this.url.host, this.url.port);
        var creds = this.url.encodedUserInfo.stringByDecodingUTF8().split(":");
        var connection = this.msyql.createConnection({
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
    },

    close: function(completion){
        if (this.connection !== null){
            logger.info("Closing msyql connection to %{public}:%d...", this.url.host, this.url.port);
            this.connection.end(function(error){
                if (error){
                    logger.error("Error closing mysql connection: %{error}", error);
                }else{
                    logger.error("mysql connection closed");   
                }
                completion();
            });
        }else{
            completion();
        }
    },

    prepare: function(query, persist, completion){
        var engine = this;
        this.connection.prepare(query, function(error, mysqlStatement){
            if (error){
                logger.error("Error preparing statement: %{error}", error);
                completion(null);
                return;
            }
            var statement = DBMySQLStatement.initWithMySQLStatement(mysqlStatement, persist, engine);
            completion(statement);
        });
    },

    execute: function(statement, parameters, completion){
        statement.mysqlStatement.execute(parameters, function(error, result, fields){
            if (error){
                logger.error("Error executing statement: %{error}", error);
                completion(null);
                return;
            }
            if (result instanceof Array){
                completion(result);
                return;
            }
            if (result.affectedRows !== undefined && result.affectedRows !== null){
                completion(result.affectedRows);
                return;
            }
            completion(true);
        });
        if (statement.autoClose){
            statement.mysqlStatement.close(function(error){
                if (error){
                    logger.error("Error auto-closing statement: %{error}", error);
                }
            });
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