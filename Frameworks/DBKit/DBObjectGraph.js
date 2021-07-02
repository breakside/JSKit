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

// #import Foundation
// #import "DBID.js"
'use strict';

(function(){

var logger = JSLog("dbkit", "graph");

JSClass("DBObjectGraph", JSObjectGraph, {

    initWithObjectDatabase: function(database){
        DBObjectGraph.$super.init.call(this);
        this.databases = [database];
        this.databasesByPrefix = {};
    },

    addObjectDatabase: function(database){
        this.databases.push(database);
    },

    databases: null,

    objectOfClass: function(id, cls, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.rejectNonNullSecondArgument);
        }
        if (!DBID.isValid(id)){
            completion.call(target, null, null);
        }else{
            var database = this.databaseForID(id);
            var idClass = database.storableClassResolver.classForID(id);
            if (idClass !== null && idClass.isSubclassOfClass(cls)){
                this.object(id, completion, target);
            }else{
                completion.call(target, null, null);
            }
        }
        return completion.promise;
    },

    loadObjectForID: function(id, completion){
        var database = this.databaseForID(id);
        database.object(id, completion);
    },

    databasesByPrefix: null,

    databaseForID: function(id){
        var database = this.databasesByPrefix[id.dbidPrefix];
        if (database){
            return database;
        }
        var cls;
        for (var i = 0, l = this.databases.length; i < l; ++i){
            database = this.databases[i];
            cls = database.storableClassResolver.classForID(id);
            if (cls !== null){
                this.databasesByPrefix[id.dbidPrefix] = database;
                return database;
            }
        }
        return this.databases[0];
    }

});


})();