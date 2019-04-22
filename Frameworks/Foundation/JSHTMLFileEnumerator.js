// #import "JSFileEnumerator.js"
// #import "JSHTMLFile.js"
/* global JSClass, JSObject, JSFileEnumerator, JSHTMLFile, JSHTMLFileListFileEnumerator, JSHTMLFileSystemEntryFileEnumerator */
'use strict';

JSClass("JSHTMLFileListFileEnumerator", JSFileEnumerator, {

    htmlFiles: null,
    htmlFileIndex: null,

    initWithHTMLFiles: function(htmlFiles){
        this.htmlFiles = htmlFiles;
        this.htmlFileIndex = 0;
    },

    next: function(callback, target){
        if (this.htmlFileIndex < this.htmlFiles.length){
            var htmlFile = this.htmlFiles[this.htmlFileIndex];
            ++this.htmlFileIndex;
            var file = JSHTMLFile.initWithFile(htmlFile);
            var directory = '';
            if (htmlFile.webkitRelativePath){
                directory = htmlFile.webkitRelativePath.substr(0, htmlFile.webkitRelativePath.length - file.name.length);
            }
            callback.call(target, directory, file);
        }else{
            callback.call(target, null, null);
        }
    }

});

JSClass("JSHTMLFileSystemEntryFileEnumerator", JSFileEnumerator, {

    htmlEntries: null,
    htmlEntryIndex: null,
    directory: null,
    _childEnumerator: null,

    initWithHTMLEntries: function(htmlEntries, directory){
        if (directory === undefined){
            directory = '';
        }
        this.htmlEntries = htmlEntries;
        this.htmlEntryIndex = 0;
        this.directory = directory;
    },

    next: function(callback, target){
        if (this._childEnumerator !== null){
            this._childEnumerator.next(function(directory, file){
                if (file === null){
                    this._childEnumerator = null;
                    this.next(callback, target);
                }else{
                    callback.call(target, directory, file);
                }
            }, this);
        }else if (this.htmlEntryIndex < this.htmlEntries.length){
            var htmlEntry = this.htmlEntries[this.htmlEntryIndex];
            var self = this;
            ++this.htmlEntryIndex;
            if (htmlEntry.isFile){
                htmlEntry.file(function JSHTMLFileSystemEntryFileEnumerator_next_file_success(htmlFile){
                    var file = JSHTMLFile.initWithFile(htmlFile);
                    callback.call(target, self.directory, file);
                }, function JSHTMLFileSystemEntryFileEnumerator_next_file_error(error){
                    self.next(callback, target);
                });
            }else if (htmlEntry.isDirectory){
                var reader = htmlEntry.createReader();
                reader.readEntries(function JSHTMLFileSystemEntryFileEnumerator_next_readEntries_success(htmlEntries){
                    self._childEnumerator = JSHTMLFileSystemEntryFileEnumerator.initWithHTMLEntries(htmlEntries, htmlEntry.fullPath.substr(1) + '/');
                    self.next(callback, target);
                }, function JSHTMLFileSystemEntryFileEnumerator_next_readEntries_error(error){
                    self.next(callback, target);
                });
            }else{
                this.next(callback, target);
            }
        }else{
            callback.call(target, null, null);
        }
    }

});