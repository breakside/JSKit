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

var logger = JSLog("dbkit", "pg");

JSClass("DBPostgreSQLEngine", DBSQLEngine, {

    initWithURL: function(url, pg){
        if (!pg){
            try{
                pg = require("pg");
            }catch (e){
                throw new Error("Cannot create DBPostgreSQLEngine. pg package not installed.  Add pg to package.json");
            }
        }
        this.pg = pg;
        this.url = url;
    },

    open: function(completion){
        logger.info("Opening pg client to %{public}:%d...", this.url.host, this.url.port);
        var creds = this.url.encodedUserInfo.stringByDecodingUTF8().split(":");
        var client = this.pg.Client({
            host: this.url.host,
            port: this.url.port || 5432,
            user: creds[0],
            password: creds[1],
            database: this.url.pathComponents[1]
        });
        var engine = this;
        try{
            client.connect(function(error){
                if (error){
                    logger.error("Error opening pg client: %{error}", error);
                    completion(false);
                    return;
                }
                logger.error("pg client open");
                engine.client = client;
                completion(true);
            });
        }catch (e){
            logger.error("Error thrown opening pg client: %{error}", e);
            JSRunLoop.main.schedule(completion, undefined, false);
        }
    },

    close: function(completion){
        if (this.client !== null){
            logger.info("Closing pg client to %{public}:%d...", this.url.host, this.url.port);
            try{
                this.client.end(function(error){
                    if (error){
                        logger.error("Error closing pg client: %{error}", error);
                    }else{
                        logger.error("pg client closed");   
                    }
                    completion();
                });
            }catch (e){
                logger.error("Error thrown closing pg client: %{error}", e);
                JSRunLoop.main.schedule(completion);
            }
        }else{
            JSRunLoop.main.schedule(completion);
        }
    },

    nextStatementID: 1,

    prepare: function(query, persist, completion){
        if (!persist){
            completion(DBPostgreSQLStatement.initWithQuery(query, this));
            return;
        }
        var name = "dbkit_%04d".sprintf(this.nextStatementID++);
        completion(DBPostgreSQLStatement.initWithName(name, query, this));
    },

    execute: function(statement, parameters, completion){
        var query = {
            text: statement.query,
            values: parameters
        };
        if (statement.name !== null){
            query.name = statement.name;
        }
        this.client.query(query, function(error, result){
            if (error){
                logger.error("Error executing statement: %{error}", error);
                completion(null);
                return;
            }
            if (result.command === "SELECT"){
                completion(result.rows);
                return;
            }
            completion(true);
        });
    }

});

JSClass("DBPostgreSQLStatement", DBSQLStatement, {

    initWithQuery: function(query, engine){
        DBPostgreSQLStatement.$super.initWithEngine.call(this, engine);
        this.query = query;
    },

    initWithName: function(name, query, engine){
        DBPostgreSQLStatement.$super.initWithEngine.call(this, engine);
        this.name = name;
        this.query = query;
    },

    name: null,
    query: null,
});

})();