// #import Foundation
/* global JSClass, JSObject, DBObjectDatabase, UUID, JSSHA1Hash */
'use strict';

JSClass("DBObjectDatabase", JSObject, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.fileManager = fileManager;
    },

    id: function(table){
        var chunks = Array.prototype.slice.call(arguments, 1);
        var hash = new JSSHA1Hash();
        hash.start();
        for (var i = 0, l = chunks.length; i < l; ++i){
            hash.add(chunks[i]);
        }
        if (i === 0){
            hash.add(new UUID().bytes);
        }
        hash.finish();
        var hex = hash.digest().hexStringRepresentation();
        return table + '_' + hex;
    },

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        var url = this._urlForId(id);
        this.fileManager.contentsAtURL(url, function(contents){
            if (contents === null){
                completion.call(target, null);
                return;
            }
            var obj = null;
            try{
                var json = contents.stringByDecodingUTF8();
                obj = JSON.parse(json);
            }catch (e){
                completion.call(target, null);
                return;
            }
            completion.call(target, obj);
        }, this);
        return completion.promise;
    },

    saveObject: function(obj, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var url = this._urlForId(obj.id);
        var json = JSON.stringify(obj);
        var contents = json.utf8();
        this.fileManager.createFileAtURL(url, contents, function(success){
            completion.call(target, success);
        }, this);
        return completion.promise;
    },

    deleteObject: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        var url = this._urlForId(id);
        this.fileManager.removeItemAtURL(url, function(success){
            completion.call(target, success);
        }, this);
        return completion.promise;
    },

    _urlForId: function(id){
        var hashlen = 40;
        var i = id.length - hashlen;
        var table = id.substr(0, i - 1);
        var hash1 = id.substr(i, 2);
        var hash2 = id.substr(i + 2, 2);
        var final = id.substr(i + 4);
        var components = [
            table,
            hash1,
            hash2,
            final
        ];
        return this.url.appendingPathComponents(components);
    }

});