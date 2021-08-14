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

JSClass("DBSQLTransaction", JSObject, {

    initWithDatabase: function(database){
        this._database = database;
        this.completions = [];
    },

    database: JSReadOnlyProperty("_database", null),

    execute: function(query, parameters, completion, target){
        return this.database.execute(query, parameters, completion, target);
    },

    commit: function(completion, target){
        return this.database.execute("COMMIT", function(results){
            this.callCompletions(results !== null);
            completion.call(target, results);
        }, this);
    },

    rollback: function(completion, target){
        return this.database.execute("ROLLBACK", function(results){
            this.callCompletions(false);
            completion.call(target, results);
        }, this);
    },

    completions: [],

    addCompletion: function(completion, target){
        this.completions.push({fn: completion, target: target});
    },

    callCompletions: function(success){
        var completion;
        for (var i = 0, l = this.completions.length; i < l; ++l){
            completion = this.completion[i];
            try {
                completion.fn.call(completion.target, success);
            }catch (e){
                logger.error("Error calling transaction completion: %{error}", e);
            }
        }
    },

});

})();