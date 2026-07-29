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
        this.directoryIndexByFilename = {};
        this.offset = 0;
    },

    initWithData: function(data){
        if (data === null || data === undefined){
            return null;
        }
        if (data.length < 22){
            return null;
        }
        this._data = data;
        this.directory = [];
        this.directoryIndexByFilename = {};
        var offset = this._data.length - 22;
        var minOffset = Math.max(0, offset - 0xFFFF);
        while (offset >= minOffset && !(this._data[offset] === 0x50 && this._data[offset+1] === 0x4b && this._data[offset+2] === 0x05 && this._data[offset+3] === 0x06)){
            offset -= 1;
        }
        if (offset < minOffset){
            return null;
        }
        var end = this._data.subdataInRange(JSRange(offset, this._data.length - offset));
        var dataView = end.dataView();
        // End of Central Directory Record (APPNOTE.txt 4.3.16)
        // everything is little-endian
        var signature = dataView.getUint32(0, true);
        if (signature !== 0x06054b50){
            return null;
        }
        var diskNumber = dataView.getUint16(4, true);
        var diskNumberWithDirectoryStart = dataView.getUint16(6, true);
        var numberOfItemsOnDisk = dataView.getUint16(8, true);
        var numberOfItemsTotal = dataView.getUint16(10, true);
        var sizeOfDirectory = dataView.getUint32(12, true);
        var offsetOfDirectoryStart = dataView.getUint32(16, true);
        var commentLength = dataView.getUint16(20, true);
        if (diskNumber !== 0 || diskNumberWithDirectoryStart !== 0){
            return null;
        }
        if (offsetOfDirectoryStart + sizeOfDirectory > this._data.length){
            return null;
        }
        var directory = this._data.subdataInRange(JSRange(offsetOfDirectoryStart, sizeOfDirectory));
        dataView = directory.dataView();
        var crc;
        var compressedLength;
        var uncompressedLength;
        var nameLength;
        var extraFieldLength;
        var name;
        var headerOffset;
        offset = 0;
        for (var i = 0; i < numberOfItemsTotal; ++i){
            // Central Directory File Header (APPNOTE.txt 4.3.12)
            // Everything is little-endian
            if (offset + 46 > sizeOfDirectory){
                return null;
            }
            signature = dataView.getUint32(offset + 0, true);
            if (signature !== 0x02014b50){
                return null;
            }
            crc = dataView.getUint32(offset + 16, true);
            compressedLength = dataView.getUint32(offset + 20, true);
            uncompressedLength = dataView.getUint32(offset + 24, true);
            nameLength = dataView.getUint16(offset + 28, true);
            extraFieldLength = dataView.getUint16(offset + 30, true);
            commentLength = dataView.getUint16(offset + 32, true);
            headerOffset = dataView.getUint32(offset + 42, true);
            if (offset + 46 + nameLength > sizeOfDirectory){
                return null;
            }
            name = directory.subdataInRange(JSRange(offset + 46, nameLength)).stringByDecodingUTF8();
            this.directory.push({
                name: name,
                offset: headerOffset,
                header: this.data.subdataInRange(JSRange(headerOffset, 30 + nameLength + extraFieldLength)),
                crc: crc,
                compressedLength: compressedLength,
                uncompressedLength: uncompressedLength
            });
            this.directoryIndexByFilename[name] = i;
            offset += 46 + nameLength + extraFieldLength + commentLength;
        }

    },

    directoryIndexByFilename: null,
    filenames: JSReadOnlyProperty(),

    getFilenames: function(){
        var filenames = [];
        for (var i = 0, l = this.directory.length; i < l; ++i){
            filenames.push(this.directory[i].name);
        }
        return filenames;
    },

    dataForFilename: function(filename){
        var index = this.directoryIndexByFilename[filename];
        if (index === undefined){
            return null;
        }
        var file = this.directory[index];
        var dataView = file.header.dataView();
        var signature = dataView.getUint32(0, true);
        if (signature !== 0x04034b50){
            return null;
        }
        var version = dataView.getUint16(4, true);
        var flags = dataView.getUint16(6, true);
        var method = dataView.getUint16(8, true);
        var crc = dataView.getUint32(14, true);
        var compressedLength = dataView.getUint32(18, true);
        var uncompressedLength = dataView.getUint32(22, true);
        var nameLength = dataView.getUint16(26, true);
        var extraFieldLength = dataView.getUint16(28, true);
        var offset = file.offset + 30 + nameLength + extraFieldLength;
        if (version > 20){
            return null;
        }
        if (method !== 8 && method !== 0){
            return null;
        }
        if ((flags & 0x8) !== 0){
            crc = file.crc;
            compressedLength = file.compressedLength;
            uncompressedLength = file.uncompressedLength;
        }
        if (offset + compressedLength > this.data.length){
            return null;
        }
        if (compressedLength === 0 || uncompressedLength === 0){
            return null;
        }
        var compressedData = this.data.subdataInRange(JSRange(offset, compressedLength));
        var data;
        if (method === 0){
            data = compressedData;
        }else if (method === 8){
            data = JSData.initWithLength(uncompressedLength);
            var stream = DeflateStream();
            stream.input = compressedData;
            stream.output = data;
            stream.inflate(true);
            if (stream.state !== DeflateStream.State.done){
                data = null;
            }
        }
        if (data === null){
            return;
        }
        if (JSCRC32(data) !== crc){
            return null;
        }
        return data;
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
            header: header,
            crc: crc,
            compressedLength: storedData.length,
            uncompressedLength: data.length
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