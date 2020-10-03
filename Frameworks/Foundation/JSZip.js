// #import "JSObject.js"
// #import "Promise+JS.js"
// #import "JSCRC32.js"
"use strict";

JSClass("JSZip", JSObject, {

    init: function(){
        this.chunks = [];
        this.directory = [];
        this.offset = 0;
    },

    offset: 0,

    addFile: function(file, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        file.readData(function(data){
            if (data === null){
                completion.call(target, new Error("Failed to read file data"));
                return;
            }
            this.addDataForFilename(data, file.name, completion, target);
        }, this);
        return completion.promise;
    },

    addDataForFilename: function(data, name, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        var error = null;
        try{
            var encodedName = name.utf8();
            var header = JSData.initWithLength(30 + encodedName.length);
            var dataView = header.dataView();
            var crc = JSCRC32(data);
            dataView.setUint32(0, 0x04034b50, true);
            dataView.setUint16(4, 20, true);
            dataView.setUint16(6, 0, true);
            dataView.setUint16(8, 0, true); // no compression
            dataView.setUint16(10, 0, true);  // date
            dataView.setUint16(12, 0, true); // date
            dataView.setUint32(14, crc, true);
            dataView.setUint32(18, data.length, true);
            dataView.setUint32(22, data.length, true);
            dataView.setUint16(26, encodedName.length, true);
            dataView.setUint16(28, 0, true);
            encodedName.copyTo(header, 30);
            this.directory.push({
                name: name,
                offset: this.offset,
                header: header
            });
            this.addChunk(header);
            this.addChunk(data);
        }catch (e){
            error = e;
        }
        completion.call(target, error);
        return completion.promise;
    },

    close: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        var error = null;
        try{
            var i, l;
            var centralDirectoryOffset = this.offset;
            var centralDirectorySize = 0;
            var header;
            var nameLength;
            var dataView;
            var file;
            for (i = 0, l = this.directory.length; i < l; ++i){
                file = this.directory[i];
                header = JSData.initWithLength(46 + (file.header.length - 30));
                dataView = header.dataView();
                dataView.setUint32(0, 0x02014b50, true);
                dataView.setUint16(4, 0, true);
                file.header.subdataInRange(JSRange(4, 26)).copyTo(header, 6);
                dataView.setUint16(32, 0, true);
                dataView.setUint16(34, 0, true);
                dataView.setUint16(36, 0, true);
                dataView.setUint32(38, 0, true);
                dataView.setUint32(42, file.offset, true);
                file.header.subdataInRange(JSRange(30, file.header.length - 30)).copyTo(header, 46);
                centralDirectorySize += header.length;
                this.addChunk(header);
            }
            var end = JSData.initWithLength(22);
            dataView = end.dataView();
            dataView.setUint32(0, 0x06054b50, true);
            dataView.setUint16(4, 0, true);
            dataView.setUint16(6, 0, true);
            dataView.setUint16(8, this.directory.length, true);
            dataView.setUint16(10, this.directory.length, true);
            dataView.setUint32(12, centralDirectorySize, true);
            dataView.setUint32(16, centralDirectoryOffset, true);
            dataView.setUint16(20, 0, true);
            this.addChunk(end);
            this._data = JSData.initWithChunks(this.chunks);
        }catch (e){
            error = e;
        }
        completion.call(target, error);
        return completion.promise;
    },

    addChunk: function(chunk){
        this.chunks.push(chunk);
        this.offset += chunk.length;
    },

    directory: null,

    chunks: null,

    data: JSReadOnlyProperty("_data", null),

});