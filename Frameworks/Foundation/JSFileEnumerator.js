// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSFileEnumerator, JSFileArrayFileEnumerator */
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
                files.push(file);
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