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
'use strict';

(function(){

var logger = JSLog("dbkit", "graph");

JSClass("DBObjectGraph", JSObjectGraph, {

    initWithObjectDatabase: function(database){
        DBObjectGraph.$super.init.call(this);
        this.database = database;
        this.classesByTable = {};
    },

    database: null,

    loadObjectForID: function(id, completion, target){
        this.database.object(id, function(dictionary){
            if (dictionary === null){
                completion.call(target, null);
                return;
            }
            var cls = this.classForID(id);
            if (cls !== null){
                var obj = cls.allocate();
                this.addObjectForId(obj, id);
                obj.initFromDictionary(dictionary, this).then(function(result){
                    if (result !== undefined){
                        logger.warn("initFromDictionary should not return anything.  Resulting object graph not well defined");
                        completion.call(target, null);
                    }else{
                        completion.call(target, obj);
                    }
                }, function(){
                    completion.call(target, null);
                });
            }else{
                completion.call(target, dictionary);
            }
        }, this);
    },

    classesByTable: null,

    registerClassForTable: function(cls, table){
        this.classesByTable[table] = cls;
    },

    classForID: function(id){
        var table = this.database.tableForID(id);
        return this.classesByTable[table] || null;
    }

});


})();