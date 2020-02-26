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

// #import "JSObject.js"
'use strict';

JSClass("JSFileEnumerator", JSObject, {

    initWithFiles: function(files){
        return JSFileArrayFileEnumerator.initWithFiles(files);
    },

    next: function(callback, target){
    },

    enumerate: function(itemCallback, doneCallback, target){
        var fileHandler = function(directory, file){
            if (file === null){
                doneCallback.call(target);
            }else{
                itemCallback.call(target, directory, file);
                this.next(fileHandler, this);
            }
        };
        this.next(fileHandler, this);
    },

    batch: function(size, callback, target){
        var files = [];
        var handleFile = function(directory, file){
            if (file === null){
                callback.call(target, files);
            }else{
                files.push({directory: directory, file: file});
                if (files.length < size){
                    this.next(handleFile, this);
                }else{
                    callback.call(target, files);
                }
            }
        };
        this.next(handleFile, this);
    },

    size: function(callback, target){
        var size = 0;
        var count = 0;
        this.enumerate(function(directory, file){
            ++count;
            size += file.size;
        }, function(){
            callback.call(target, count, size);
        }, this);
    },

    single: function(callback, target){
        this.next(function(directory, file){
            this.next(function(directory2, file2){
                callback.call(target, file2 === null ? file : null);
            }, this);
        }, this);
    },

    all: function(completion, target){
        var files = [];
        var handleFile = function(directory, file){
            if (file !== null){
                files.push({directory: directory, file: file});
                this.next(handleFile, this);
            }else{
                completion.call(target, files);
            }
        };
        this.next(handleFile, this);
    }

});

JSClass("JSFileArrayFileEnumerator", JSFileEnumerator, {

    files: null,
    fileIndex: null,

    initWithFiles: function(files){
        this.files = files;
        this.fileIndex = 0;
    },

    next: function(callback, target){
        if (this.fileIndex < this.files.length){
            var file = this.files[this.fileIndex];
            ++this.fileIndex;
            callback.call(target, '', file);
        }else{
            callback.call(target, null, null);
        }
    }

});