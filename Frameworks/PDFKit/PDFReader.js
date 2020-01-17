// #import Foundation
// #import "PDFTypes.js"
// #import "PDFFilter.js"
// #import "PDFEncryption.js"
// #import "PDFTokenizer.js"
// #import "PDFReaderStream.js"
// #import "PDFStreamOperation.js"
/* global JSClass, JSObject, JSLog, JSReadOnlyProperty, PDFReader, PDFTokenizer, PDFReaderStream, PDFReaderDataStream, PDFStreamOperationIterator, JSData, PDFFilter, PDFEncryption, PDFStreamOperation */
/* global PDFIndirectObject, PDFName, PDFObject, PDFDocument, PDFPages, PDFPage, PDFResources, PDFGraphicsStateParameters, PDFStream, PDFTrailer, PDFFont, PDFType1Font, PDFTrueTypeFont, PDFImage, PDFXrefStream */
'use strict';

(function(){

var logger = JSLog("PDFKit", "Reader");

JSClass("PDFReader", JSObject, {

    // MARK: - Creating a reader

    initWithStream: function(stream){
        this._tokenizer = PDFTokenizer.initWithStream(stream);
        this._tokenizer.allowsIndirectObjects = true;
        this._tokenizer.delegate = this;
    },

    initWithData: function(data){
        var stream = PDFReaderDataStream.initWithData(data);
        this.initWithStream(stream);
    },

    // MARK: - Reading

    open: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this._crossReferenceTable = [];
        this._readVersion();
        var offset = this._readEndOfFile();
        this._readCrossReferenceEntries(offset);
        var encrypt = this._trailer.Encrypt;
        if (!encrypt){
            this._readObjectStreams(function(){
                var document = this._trailer.Root;
                if (document && (document instanceof PDFDocument)){
                    completion.call(target, PDFReader.Status.open, document);
                }else{
                    completion.call(target, PDFReader.Status.error, null);
                }
            }, this);
            return;
        }
        var ids = this._trailer.ID;
        if (!ids){
            completion.call(target, PDFReader.Status.unsupportedEncryption, null);
            return;
        }
        var id = ids[0];
        if (!id){
            completion.call(target, PDFReader.Status.unsupportedEncryption, null);
            return;
        }
        this._encryption = PDFEncryption.initWithDocumentId(id, encrypt);
        if (!this._encryption.isSupported){
            completion.call(target, PDFReader.Status.unsupportedEncryption, null);
            return;
        }
        this.authenticate("", completion, target);
        return completion.promise;
    },

    // MARK: - Encryption

    _encryption: null,

    authenticate: function(userPassword, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this._encryption.authenticateUser(userPassword, function PDFReader_authenticate_result(success){
            if (success){
                this._readObjectStreams(function(){
                    var document = this._trailer.Root;
                    if (document && (document instanceof PDFDocument)){
                        completion.call(target, PDFReader.Status.open, document);
                    }else{
                        completion.call(target, PDFReader.Status.error, null);
                    }
                }, this);
                return;
            }
            completion.call(target, PDFReader.Status.passwordRequired, null);
        }, this);
        return completion.promise;
    },

    // MARK: - Internal data structures

    _tokenizer: null,
    _crossReferenceTable: null,
    _trailer: null,
    _document: null,

    // MARK: - File Structure

    _readVersion: function(){
        var data = this._tokenizer.stream.readLine();
        if (data.length < 8){
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[0] != 0x25){  // %
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[1] != 0x50){  // P
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[2] != 0x44){  // D
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[3] != 0x46){  // F
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[4] != 0x2D){  // -
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[5] != 0x31){  // 1
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data[6] != 0x2E){  // .
            throw new Error("Expecting %PDF-1.x at start");
        }
        var minorVersion = data[7] - PDFTokenizer.Numeric.zero;
        if (minorVersion < 0){
            throw new Error("Invalid minor version number: %d".sprintf(minorVersion));
        }
    },

    _readEndOfFile: function(){
        // Go to the end of the file and read the final line, expecting %%EOF
        // Some PDF files have junk after the %%EOF, so we'll be forgiving
        // - up to 32 lines after %%EOF will be ignored
        // - any content after %%EOF on the same line will be ingored
        this._tokenizer.stream.seek(this._tokenizer.stream.length);
        this._tokenizer.stream.seekToStartOfLine();
        var backwardsOffset = this._tokenizer.stream.offset;

        var token;
        try{
            token = this._tokenizer.readToken();
        }catch (e){
            // invalid junk might cause exceptions, just ignore it
            token = null;
        }
        var lines = 0;
        var maxLines = 32;
        while (lines < maxLines && this._tokenizer.stream.offset > 0 && token != Token.endOfFileComment){
            this._tokenizer.stream.seek(backwardsOffset);
            this._tokenizer.stream.seekToStartOfLine();
            backwardsOffset = this._tokenizer.stream.offset;
            try{
                token = this._tokenizer.readToken();
            }catch (e){
                // invalid junk might cause exceptions, just ignore it
                token = null;
            }
            ++lines;
        }

        // Read the previous token, which should be an integer represeting the
        // cross reference table offset.  (Be sure to skip comment lines)
        this._tokenizer.stream.seek(backwardsOffset);
        this._tokenizer.stream.seekToStartOfLine();
        backwardsOffset = this._tokenizer.stream.offset;
        token = this._tokenizer.readToken(Token.integer, Token.commentStart);
        while (token == Token.commentStart){
            this._tokenizer.stream.seek(backwardsOffset);
            this._tokenizer.stream.seekToStartOfLine();
            backwardsOffset = this._tokenizer.stream.offset;
            token = this._tokenizer.readToken(Token.integer, Token.commentStart);
        }
        this._tokenizer.readToken(Token.endOfLine, Token.commentStart);
        var crossReferenceTableOffset = token.pdfObject;

        // Read the previous token, verifying that it is startxref.
        // (Be sure to skip comment lines)
        this._tokenizer.stream.seek(backwardsOffset);
        this._tokenizer.stream.seekToStartOfLine();
        backwardsOffset = this._tokenizer.stream.offset;
        token = this._tokenizer.readToken(Token.startxref, Token.commentStart);
        while (token == Token.commentStart){
            this._tokenizer.stream.seek(backwardsOffset);
            this._tokenizer.stream.seekToStartOfLine();
            backwardsOffset = this._tokenizer.stream.offset;
            token = this._tokenizer.readToken(Token.startxref, Token.commentStart);
        }
        this._tokenizer.readToken(Token.endOfLine, Token.commentStart);
        return crossReferenceTableOffset;
    },

    _readCrossReferenceEntries: function(offset){
        var maxSections = 1024;
        var trailer;
        var offsets = [offset];
        var i = 0;
        while (i < offsets.length && offsets.length < maxSections){
            offset = offsets[i++];
            this._tokenizer.stream.seek(offset);
            var token = this._tokenizer.readToken(Token.xref, Token.integer);
            if (token == Token.integer){
                trailer = this._readCrossReferenceStream();
            }else{
                trailer = this._readCrossReferenceTable();
            }
            if ('XRefStrm' in trailer){
                if (trailer.XRefStrm !== null){
                    offsets.push(trailer.XRefStrm);
                }
            }else if ('Prev' in trailer){
                if (trailer.Prev !== null){
                    offsets.push(trailer.Prev);
                }
            }
            if (this._trailer === null){
                this._trailer = trailer;
            }
        }
        if (i < offsets.length){
            throw new Error("Too many cross reference sections");
        }
        if (this._crossReferenceTable.length > this._trailer.Size){
            this._crossReferenceTable.splice(this._trailer.Size);
        }
    },

    _readCrossReferenceTable: function(){
        var token = this._tokenizer.readMeaningfulToken(Token.integer);
        var count;
        var objectOffset;
        var status;
        var objectID;
        var generation;
        var offset;
        while (token == Token.integer){
            objectID = token.pdfObject;
            token = this._tokenizer.readToken(Token.integer);
            count = token.pdfObject;
            token = this._tokenizer.readToken(Token.commentStart, Token.endOfLine);
            if (token == Token.commentStart){
                this._tokenizer.finishReadingComment();
            }
            for (var i = 0; i < count; ++i, ++objectID){
                offset = this._tokenizer.stream.offset;
                var entryLine = String.initWithData(this._tokenizer.stream.read(20), String.Encoding.utf8);
                if (entryLine.length != 20){
                    throw new Error("Not enough space for cross reference line @ 0x%08X".sprintf(offset));
                }
                // Spec says lines should end with \r\n
                // reality seems to be any two whitespace bytes
                if (!PDFTokenizer.Whitespace.isWhitespace(entryLine.charCodeAt(18)) || !PDFTokenizer.Whitespace.isWhitespace(entryLine.charCodeAt(19))){
                    throw new Error("Invalid cross reference entry, missing CRLF @ 0x%08X".sprintf(offset + 18));
                }
                if (entryLine.charAt(10) != " " || entryLine.charAt(16) != " "){
                    throw new Error("Invalid cross reference entry, missing spaces @ 0x%08X".sprintf(offset));
                }
                status = entryLine.charAt(17);
                if (status != CrossReferenceTableEntry.Status.free && status != CrossReferenceTableEntry.Status.used){
                    throw new Error("Invalid cross reference entry, invalid status @ 0x%08X".sprintf(offset + 17));
                }
                for (var j = 0; j < 16; ++j){
                    if (j == 10){
                        continue;
                    }
                    if (!PDFTokenizer.Numeric.isDigit(entryLine.charCodeAt(j))){
                        throw new Error("Invalid cross reference entry, invalid integer @ 0x%08X".sprintf(offset + j)); 
                    }
                }
                objectOffset = parseInt(entryLine.substr(0, 10));
                generation = parseInt(entryLine.substr(11, 5));
                if (this._crossReferenceTable[objectID] === undefined){
                    this._crossReferenceTable[objectID] = CrossReferenceTableEntry(objectOffset, generation, status);
                }
            }
            token = this._tokenizer.readMeaningfulToken(Token.integer, Token.trailer);
        }
        token = this._tokenizer.readMeaningfulToken(Token.dictionaryStart);
        var trailer = this._tokenizer.finishReadingDictionary(PDFTrailer);
        return trailer;
    },

    _objectStreamsById: null,

    _readCrossReferenceStream: function(){
        if (this._objectStreamsById === null){
            this._objectStreamsById = {};
        }
        // generation number - we don't care about it
        var token = this._tokenizer.readToken(Token.integer);
        token = this._tokenizer.readToken(Token.obj);
        this._tokenizer.readMeaningfulToken(Token.dictionaryStart);
        var xref = this._tokenizer.finishReadingDictionary(PDFXrefStream);
        this._tokenizer.readMeaningfulToken(Token.stream);
        this._tokenizer.readToken(Token.endOfLine);
        var offset = this._tokenizer.stream.offset;
        this._defineStreamProperty(xref, offset);

        if (xref.F){
            logger.warn("xref stream external file references not supportd");
            return;
        }

        // Reading stream data without encryption (we can't use _getStreamData
        // because it will try to decrypt the data)
        var length = xref.Length;
        var data = this._tokenizer.stream.read(length);
        if (data.length != length){
            logger.warn("Not enough data for xref stream length");
            return null;
        }

        // Still need to unfilter, though
        data = this._decodeStreamData(xref, offset, data);

        var subsections = xref.Index;
        if (!subsections){
            subsections = [0, xref.Size];
        }

        var objectID;
        var count;
        var field1Size = xref.W[0];
        var field2Size = xref.W[1];
        var field3Size = xref.W[2];
        var field1, field2, field3;
        var entry;
        offset = 0;
        for (var i = 0, l = subsections.length; i < l; i += 2){
            objectID = subsections[i];
            count = subsections[i + 1];
            for (var j = 0; j < count; ++j, ++objectID){
                if (field1Size === 0){
                    field1 = 1;
                }else{
                    field1 = integerFromBytes(data, offset, field1Size);
                    offset += field1Size;
                }
                if (field2Size === 0){
                    field2 = 0;
                }else{
                    field2 = integerFromBytes(data, offset, field2Size);
                    offset += field2Size;
                }
                if (field3Size === 0){
                    field3 = 0;
                }else{
                    field3 = integerFromBytes(data, offset, field3Size);
                    offset += field3Size;
                }
                switch (field1){
                    case 0:
                        entry = CrossReferenceTableEntry(field2, field3, CrossReferenceTableEntry.Status.free);
                        break;
                    case 1:
                        entry = CrossReferenceTableEntry(field2, field3, CrossReferenceTableEntry.Status.used);
                        break;
                    case 2:
                        entry = ObjectStreamEntry(field2, field3);
                        this._objectStreamsById[field2] = null;
                        break;
                    default:
                        // logger.warn("Invalid cross reference stream entry type (%d) for object %d", field1, objectID);
                        entry = null;
                        break;
                }
                if (entry !== null && this._crossReferenceTable[objectID] === undefined){
                    this._crossReferenceTable[objectID] = entry;
                }
            }
        }
    
        return xref;
    },

    _readObjectStreams: function(completion, target){
        if (this._objectStreamsById === null){
            completion.call(target);
            return;
        }
        var indirect;
        var streams = [];
        for (var objectID in this._objectStreamsById){
            indirect = PDFIndirectObject(objectID, 0);
            this._objectStreamsById[objectID] = this._getObject(indirect);
            streams.push(this._objectStreamsById[objectID]);
        }

        if (streams.length === 0){
            completion.call(target);
            return;
        }

        var streamIndex = 0;
        var handleStreamData = function(data){
            var stream = streams[streamIndex];
            stream.tokenizer = PDFTokenizer.initWithData(data);
            stream.tokenizer.allowsIndirectObjects = true;
            stream.tokenizer.delegate = this;
            ++streamIndex;
            if (streamIndex < streams.length){
                streams[streamIndex].getData(handleStreamData, this);
            }else{
                completion.call(target);
            }
        };
        streams[streamIndex].getData(handleStreamData, this);
    },

    // MARK: - Indirect objects

    _getObject: function(indirect){
        var object = indirect;
        var maxLevels = 10;
        var levels = 0;
        var offset;
        var token;
        var prev;
        var entry;
        var tokenizer;
        while (levels < maxLevels && (object instanceof PDFIndirectObject)){
            prev = object;
            entry = this._crossReferenceTable[object.objectID];
            if (!entry){
                logger.info("Requesting indirect object %d %d that doesn't exist as used in cross reference table", indirect.objectID, indirect.generation);
                return null;
            }
            if (entry instanceof ObjectStreamEntry){
                var objectStream = this._objectStreamsById[entry.streamObjectID];
                object = objectStream.object(entry.objectIndex);
            }else{
                if (entry.generation != object.generation || entry.status != CrossReferenceTableEntry.Status.used){
                    logger.info("Requesting indirect object %d %d that doesn't exist as used in cross reference table", indirect.objectID, indirect.generation);
                    return null;
                }
                tokenizer = this._tokenizer;
                offset = entry.offset;
                tokenizer.stream.seek(offset);
                token = tokenizer.readToken(Token.integer);
                if (token.pdfObject != object.objectID){
                    throw new Error("Incorrect object id for %d %d R @ 0x%08X".sprintf(object.objectID, object.generation, offset));
                }
                token = tokenizer.readToken(Token.integer);
                if (token.pdfObject != object.generation){
                    throw new Error("Incorrect generation for %d %d R @ 0x%08X".sprintf(object.objectID, object.generation, offset));
                }
                token = tokenizer.readToken(Token.obj);
                object = tokenizer.readObject();
                token = tokenizer.readMeaningfulToken(Token.endobj, Token.stream);
                if (token == Token.stream){
                    tokenizer.readToken(Token.endOfLine);
                    this._defineStreamProperty(object, tokenizer.stream.offset);
                }
            }
            if (object instanceof PDFObject){
                object.indirect = prev;
            }
            ++levels;
        }
        if (object instanceof PDFIndirectObject){
            throw new Error("Too many levels of indirection for %d %d R".sprintf(indirect.objectID, indirect.generation));
        }
        return object;
    },

    tokenizerDefineIndirectProperty: function(tokenizer, obj, property, indirect){
        var reader = this;
        Object.defineProperty(obj, property, {
            configurable: true,
            enumerable: true,
            get: function PDFReader_getIndirectValue(){
                var resolved = reader._getObject(indirect);
                Object.defineProperty(this, property, {configurable: true, writable: true, enumerable: true, value: resolved});
                return resolved;
            },
            set: function(value){
                Object.defineProperty(this, property, {configurable: true, writable: true, enumerable: true, value: value});
            }
        });
    },

    _getStreamData: function(stream, offset, completion, target){
        // Bail if the stream has an external file reference
        if (stream.F){
            logger.warn("Stream external file references not supportd");
            return null;
        }

        var length = stream.Length;
        this._tokenizer.stream.seek(offset);
        var data = this._tokenizer.stream.read(length);
        if (data.length != length){
            logger.warn("Not enough data for stream length");
            return null;
        }

        var decode = function PDFReader_getStreamData_decode(data){
            data = this._decodeStreamData(stream, offset, data);
            completion.call(target, data);
        };

        if (this._encryption){
            this._encryption.decryptStream(stream, data, decode, this);
        }else{
            decode.call(this, data);
        }
    },

    _decodeStreamData: function(stream, offset, data){
        var filters = PDFFilter.CreateChain(stream.filters());
        for (var i = 0, l = filters.length; data !== null && i < l; ++i){
            try{
                data = filters[i].decode(data);
            }catch (e){
                logger.warn("Stream decode failed @ 0x%08X: %{public}", offset, e);
                data = null;
            }
        }
        return data;
    },

    _defineStreamProperty: function(stream, offset){
        var reader = this;
        Object.defineProperty(stream, 'getData', {
            configurable: true,
            value: function PDFReader_getStreamData(completion, target){
                reader._getStreamData(this, offset, completion, target);
            }
        });
    }

});

PDFReader.Status = {
    open: 0,
    error: 1,
    passwordRequired: 2,
    unsupportedVersion: 3,
    unsupportedEncryption: 4
};

var CrossReferenceTableEntry = function(offset, generation, status){
    if (this === undefined){
        return new CrossReferenceTableEntry(offset, generation, status);
    }
    if (status === undefined){
        status = CrossReferenceTableEntry.Status.used;
    }
    this.offset = offset;
    this.generation = generation;
    this.status = status;
};

CrossReferenceTableEntry.Status = {
    free: 'f',
    used: 'n'
};

var ObjectStreamEntry = function(streamObjectID, objectIndex){
    if (this === undefined){
        return new ObjectStreamEntry(streamObjectID, objectIndex);
    }  
    this.streamObjectID = streamObjectID;
    this.objectIndex = objectIndex;
};

var Token = PDFTokenizer.Token;

var integerFromBytes = function(bytes, offset, size){
    var n = 0;
    var b;
    var s = 8 * (size - 1);
    for (var i = 0; i < size; ++i){
        b = bytes[offset + i];
        n |= (b << s);
        s -= 8;
    }
    return n;
};

})();