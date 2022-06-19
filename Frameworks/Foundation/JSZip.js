// #import "JSObject.js"
// #import "Promise+JS.js"
// #import "JSCRC32.js"
// #import "JSDate.js"
// #import "JSCalendar.js"
// #import "Deflate.js"
"use strict";

JSClass("JSZip", JSObject, {

    init: function(){
        this.chunks = [];
        this.directory = [];
        this.offset = 0;
    },

    offset: 0,

    addFile: function(file, completion, target){
        return this.addFileInDirectory(file, "", {}, completion, target);
    },

    addFileInDirectory: function(file, directory, attributes, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        if (directory.startsWith("/")){
            directory = directory.substr(1);
        }
        if (directory.length > 1 && !directory.endsWith("/")){
            directory = directory + "/";
        }
        file.readData(function(data){
            if (data === null){
                completion.call(target, new Error("Failed to read file data"));
                return;
            }
            var error = null;
            try{
                this.addDataForFilename(data, directory + file.name, attributes);
            }catch (e){
                error = e;
            }
            completion.call(target, error);
        }, this);
        return completion.promise;
    },

    addDataForFilename: function(data, name, attributes, deflate){
        var encodedName = name.utf8();
        var header = JSData.initWithLength(30 + encodedName.length);
        var dataView = header.dataView();
        var crc = JSCRC32(data);
        var dateComponents = JSCalendar.gregorian.componentsFromDate(JSCalendar.Unit.day | JSCalendar.Unit.month | JSCalendar.Unit.year | JSCalendar.Unit.hour | JSCalendar.Unit.minute | JSCalendar.Unit.second, attributes.updated !== undefined ? JSDate.initWithTimeIntervalSince1970(attributes.updated) : JSDate.now, JSTimeZone.local || JSTimeZone.utc);
        var dosDate = ((dateComponents.year - 1980) << 9) | ((dateComponents.month) << 5) | (dateComponents.day);
        var dosTime = ((dateComponents.hour) << 11) | ((dateComponents.minute) << 5) | (Math.floor(dateComponents.second / 2));
        var storedData = data;
        var method = 0;
        if (deflate){
            var stream = DeflateStream();
            stream.input = data;
            stream.output = JSData.initWithLength(data.length);
            stream.deflate(true);
            if (stream.state === DeflateStream.State.done){
                storedData = stream.output.subdataInRange(JSRange(0, stream.outputOffset));
                method = 8;
            }
        }
        // Local File Header (APPNOTE.txt 4.3.7)
        // Everything is little-endian
        dataView.setUint32(0, 0x04034b50, true);                // signtature
        dataView.setUint16(4, 0x0014, true);                    // version needed to extract (2.0)
        dataView.setUint16(6, 0, true);                         // general purpose flags
        dataView.setUint16(8, method, true);                    // compression method (0=none, 8=deflate)
        dataView.setUint16(10, dosTime, true);                  // last modified time (MS-DOS)
        dataView.setUint16(12, dosDate, true);                  // last modified date (MS-DOS)
        dataView.setUint32(14, crc, true);                      // crc-32 (magic number 0xdebb20e3, preconditioned to 0xffffffff, post-conditioned by one's compliment)
        dataView.setUint32(18, storedData.length, true);        // compressed size
        dataView.setUint32(22, data.length, true);              // uncompressed size
        dataView.setUint16(26, encodedName.length, true);       // name length
        dataView.setUint16(28, 0, true);                        // extra field length
        encodedName.copyTo(header, 30);                         // name (NOT null-terminated)
        this.directory.push({
            name: name,
            offset: this.offset,
            header: header
        });
        this.chunks.push(header);
        this.chunks.push(storedData);
        this.offset += header.length + storedData.length;
        this._data = null;
    },

    directory: null,

    chunks: null,

    data: JSReadOnlyProperty("_data", null),

    getData: function(){
        if (this._data === null){
            var chunks = JSCopy(this.chunks);
            var i, l;
            var centralDirectoryOffset = this.offset;
            var centralDirectorySize = 0;
            var header;
            var nameLength;
            var dataView;
            var file;
            for (i = 0, l = this.directory.length; i < l; ++i){
                // Central Directory File Header (APPNOTE.txt 4.3.12)
                // Everything is little-endian
                file = this.directory[i];
                header = JSData.initWithLength(46 + (file.header.length - 30));
                dataView = header.dataView();
                dataView.setUint32(0, 0x02014b50, true);                        // signature
                dataView.setUint16(4, 0x0314, true);                            // version made by (UNIX=3, 2.0)
                file.header.subdataInRange(JSRange(4, 26)).copyTo(header, 6);   // copy from local header
                dataView.setUint16(32, 0, true);                                // commenet length
                dataView.setUint16(34, 0, true);                                // disk number start
                dataView.setUint16(36, 0, true);                                // internal file attributes
                dataView.setUint32(38, 0, true);                                // external file attributes
                dataView.setUint32(42, file.offset, true);                      // offset of local header relative to first disk
                file.header.subdataInRange(JSRange(30, file.header.length - 30)).copyTo(header, 46); // name (ALWAYS forward slashes for directories)
                centralDirectorySize += header.length;
                chunks.push(header);
            }
            // End of Central Directory Record (APPNOTE.txt 4.3.16)
            // everything is little-endian
            var end = JSData.initWithLength(22);
            dataView = end.dataView();
            dataView.setUint32(0, 0x06054b50, true);                    // signature
            dataView.setUint16(4, 0, true);                             // number of this disk
            dataView.setUint16(6, 0, true);                             // number of the disk with the start of central directory
            dataView.setUint16(8, this.directory.length, true);         // number of central directory items on this disk
            dataView.setUint16(10, this.directory.length, true);        // number of central directory items total
            dataView.setUint32(12, centralDirectorySize, true);         // size of central directory
            dataView.setUint32(16, centralDirectoryOffset, true);       // offset to central directory with respect to starting disk
            dataView.setUint16(20, 0, true);                            // zip file comemnt length
            chunks.push(end);
            this._data = JSData.initWithChunks(chunks);
        }
        return this._data;
    }

});