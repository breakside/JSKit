// #import "Foundation/JSFile.js"
// #import "Foundation/JSData.js"
// #import "Foundation/JSURL.js"
/* global JSClass, JSFile */
/* feature Blob */
/* feature FileReader */
/* feature URL.createObjectURL */
/* feature URL.revokeObjectURL */
/* global FileReader, JSData, JSURL, URL */
'use strict';

JSClass("JSHTMLFile", JSFile, {

    _blob: null,

    initWithFile: function(file){
        this.initWithBlob(file);
        this._name = file.name;
    },

    initWithBlob: function(blob){
        this._blob = blob;
        this._size = blob.size;
        this._contentType = blob.type || null;
    },

    readData: function(completion, target){
        this._readBlob(this._blob, completion, target);
    },

    readDataRange: function(range, completion, target){
        var slice = this._blob.slice(range.location, range.end);
        this._readBlob(slice, completion, target);
    },

    _readBlob: function(blob, completion, target){
        var reader = new FileReader();
        var listener = {
            handleEvent: function(e){
                if (e.type in this){
                    this[e.type](e);
                }
            },

            loadend: function(e){
                if (reader.readyState == FileReader.DONE){
                    var data = null;
                    if (reader.result !== null){
                        var buffer = reader.result;
                        data = JSData.initWithBuffer(buffer);
                    }
                    completion.call(target, data);
                }
            }
        };
        reader.addEventListener('loadend', listener);
        reader.readAsArrayBuffer(blob);
    },

    _blobURL: null,

    close: function(){
        if (this._blobURL !== null){
            URL.revokeObjectURL(this._blobURL);
        }
    },

    getURL: function(){
        if (this._blobURL === null){
            var urlString = URL.createObjectURL(this._blob);
            this._blobURL = JSURL.initWithString(urlString);
        }
        return this._blobURL;
    }

});