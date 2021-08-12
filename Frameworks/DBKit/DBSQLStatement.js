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
"use strict";

(function(){

JSClass("DBSQLStatement", JSObject, {

    initWithEngine: function(engine){
        this.engine = engine;
    },

    engine: null,

    execute: function(parameters, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var promise = this.engine.execute(this, parameters, function(cursor){
            completion.call(target, cursor);
        });
        if (promise instanceof Promise){
            promise.then(function(cursor){
                completion.call(target, cursor);
            }, function(error){
                completion.call(target, null);
            });
        }
        return completion.promise;
    }

});

})();