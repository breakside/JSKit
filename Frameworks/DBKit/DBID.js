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

DBID.tableForId = function(id){
    return id.substr(0, id.length - 41);
};