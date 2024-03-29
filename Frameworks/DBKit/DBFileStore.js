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

// #import "DBObjectStore.js"
// #import "DBObjectChange.js"
'use strict';

JSClass("DBFileStore", DBObjectStore, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.fileManager = fileManager || JSFileManager.shared;
    },

    object: function(id, completion){
        var url = this._urlForID(id);
        this.fileManager.contentsAtURL(url, function(contents){
            if (contents === null){
                completion(null);
                return;
            }
            var obj = null;
            try{
                var json = contents.stringByDecodingUTF8();
                obj = JSON.parse(json);
            }catch (e){
                completion(null);
                return;
            }
            completion(obj);
        }, this);
    },

    save: function(obj, completion){
        var url = this._urlForID(obj.id);
        var json = JSON.stringify(obj);
        var contents = json.utf8();
        this.fileManager.createFileAtURL(url, contents, function(success){
            completion(success);
        }, this);
    },

    delete: function(id, completion){
        var url = this._urlForID(id);
        this.fileManager.removeItemAtURL(url, function(success){
            completion(success);
        }, this);
    },

    exclusiveSave: function(id, change, completion){
        // TODO: don't clobber any other changes
        var store = this;
        this.object(id, function(object){
            change(object, function(changedObject){
                store.save(changedObject, completion);
            });
        });
    },

    saveChange: function(change, completion){
        this.exclusiveSave(change.object.id, function(object, changeCompletion){
            if (object === null){
                changeCompletion(null);
                return;
            }
            if (object.dbkitSecure){
                changeCompletion(null);
                return;
            }
            var value = change.object[change.property];
            if (change.operator === DBObjectChange.Operator.set){
                object[change.property] = value;
            }else if (change.operator === DBObjectChange.Operator.increment){
                if (isNaN(object[change.property])){
                    object[change.property] = 0;
                }
                object[change.property] += change.operands[0];
            }else if (change.operator === DBObjectChange.Operator.insert){
                object[change.property].splice(change.operands[0], 0, value[change.operands[0]]);
            }else if (change.operator === DBObjectChange.Operator.delete){
                var array = object[change.property];
                var i = change.operands[0];
                var j = i;
                if (array[j] != value[i]){
                    j = array.indexOf(value[i]);
                }
                if (j >= 0){
                    array.splice(j, 1);
                }
            }else{
                changeCompletion(null);
                return;
            }
            changeCompletion(object);
        }, completion);
    },

    _urlForID: function(id){
        var hashlen = 40;
        var i = id.length - hashlen;
        var prefix = id.substr(0, i - 1);
        var hash1 = id.substr(i, 2);
        var hash2 = id.substr(i + 2, 2);
        var final = id.substr(i + 4);
        var components = [
            prefix,
            hash1,
            hash2,
            final
        ];
        return this.url.appendingPathComponents(components);
    }

});