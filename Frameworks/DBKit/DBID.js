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
"use strict";

JSGlobalObject.DBID = function(table){
    var chunks = Array.prototype.slice.call(arguments, 1);
    if (chunks.length === 0){
        chunks.push(UUID.init());
    }
    var hash = new JSSHA1Hash();
    var chunk;
    hash.start();
    for (var i = 0, l = chunks.length; i < l; ++i){
        chunk = chunks[i];
        if (typeof(chunk) == "string"){
            chunk = chunk.utf8();
        }else if (chunk instanceof UUID){
            chunk = chunk.bytes;
        }
        if (!(chunk instanceof JSData)){
            throw new Error("id components must be JSData, String, or UUID");
        }
        hash.add(chunk);
    }
    hash.finish();
    var hex = hash.digest().hexStringRepresentation();
    return table + '_' + hex;
};

DBID.tableForID = function(id){
    return id.substr(0, id.length - 41);
};