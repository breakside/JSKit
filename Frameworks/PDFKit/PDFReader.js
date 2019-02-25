// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/PDFFilter.js"
// #import "PDFKit/PDFEncryption.js"
// #import "PDFKit/PDFTokenizer.js"
// #import "PDFKit/PDFReaderStream.js"
// #import "PDFKit/PDFStreamOperation.js"
/* global JSClass, JSObject, JSLog, JSReadOnlyProperty, PDFReader, PDFTokenizer, PDFReaderStream, PDFReaderDataStream, PDFStreamOperationIterator, JSData, PDFFilter, PDFEncryption, PDFStreamOperation */
/* global PDFIndirectObject, PDFNameObject, PDFObject, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFStreamObject, PDFTrailerObject, PDFFontObject, PDFType1FontObject, PDFTrueTypeFontObject, PDFImageObject */
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
        this._crossReferenceTable = [];
        this._readVersion();
        var offset = this._readEndOfFile();
        this._readCrossReferenceTable(offset);
        var encrypt = this._trailer.Encrypt;
        if (!encrypt){
            completion.call(target, PDFReader.Status.open, this._trailer.Root);
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
    },

    // MARK: - Encryption

    _encryption: null,

    authenticate: function(userPassword, completion, target){
        this._encryption.authenticateUser(userPassword, function PDFReader_authenticate_result(success){
            if (success){
                completion.call(target, PDFReader.Status.open, this._trailer.Root);
                return;
            }
            completion.call(target, PDFReader.Status.passwordRequired, null);
        }, this);
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
        if (data.bytes[0] != 0x25){  // %
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[1] != 0x50){  // P
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[2] != 0x44){  // D
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[3] != 0x46){  // F
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[4] != 0x2D){  // -
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[5] != 0x31){  // 1
            throw new Error("Expecting %PDF-1.x at start");
        }
        if (data.bytes[6] != 0x2E){  // .
            throw new Error("Expecting %PDF-1.x at start");
        }
        var minorVersion = data.bytes[7] - PDFTokenizer.Numeric.zero;
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

    _readCrossReferenceTable: function(offset){
        var maxSections = 1024;
        var sectionCount = 0;
        while (offset !== null && sectionCount < maxSections){
            this._tokenizer.stream.seek(offset);
            var token = this._tokenizer.readToken(Token.xref, Token.integer);
            var objectID;
            var generation;
            if (token == Token.integer){
                objectID = token.pdfObject;
                token = this._tokenizer.readToken(Token.integer);
                generation = token.pdfObject;
                token = this._tokenizer.readToken(Token.obj);
                logger.warn("Cross reference stream not supported");
                return;
            }
            token = this._tokenizer.readMeaningfulToken(Token.integer);
            var count;
            var objectOffset;
            var status;
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
            var trailer = this._tokenizer.finishReadingDictionary(PDFTrailerObject);
            offset = trailer.Prev;
            if (this._trailer === null){
                this._trailer = trailer;
            }
            ++sectionCount;
        }
        if (this._crossReferenceTable.length > this._trailer.Size){
            this._crossReferenceTable.splice(this._trailer.Size);
        }
    },

    _readCrossReferenceStream: function(indirect){
        // TODO:
    },

    // MARK: - Indirect objects

    _getObject: function(indirect){
        var object = indirect;
        var maxLevels = 10;
        var levels = 0;
        var offset;
        var token;
        var tmp;
        var entry;
        while (levels < maxLevels && (object instanceof PDFIndirectObject)){
            entry = this._crossReferenceTable[object.objectID];
            if (!entry || entry.generation != object.generation || entry.status != CrossReferenceTableEntry.Status.used){
                logger.info("Requesting indirect object that doesn't exist as used in cross reference table");
                return null;
            }
            offset = entry.offset;
            this._tokenizer.stream.seek(offset);
            token = this._tokenizer.readToken(Token.integer);
            if (token.pdfObject != object.objectID){
                throw new Error("Incorrect object id for %d %d R @ 0x%08X".sprintf(object.objectID, object.generation, offset));
            }
            token = this._tokenizer.readToken(Token.integer);
            if (token.pdfObject != object.generation){
                throw new Error("Incorrect generation for %d %d R @ 0x%08X".sprintf(object.objectID, object.generation, offset));
            }
            token = this._tokenizer.readToken(Token.obj);
            tmp = object;
            object = this._tokenizer.readObject();
            if (object instanceof PDFObject){
                object.indirect = tmp;
            }
            token = this._tokenizer.readMeaningfulToken(Token.endobj, Token.stream);
            if (token == Token.stream){
                this._tokenizer.readToken(Token.endOfLine);
                this._defineStreamProperty(object, this._tokenizer.stream.offset);
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
            var filters = PDFFilter.CreateChain(stream.Filter, stream.DecodeParams);
            for (var i = 0, l = filters.length; data !== null && i < l; ++i){
                try{
                    data = filters[i].decode(data);
                }catch (e){
                    logger.warn("Stream decode failed @ 0x%08X: %{public}", offset, e);
                    data = null;
                }
            }
            completion.call(target, data);
        };

        if (this._encryption){
            this._encryption.decryptStream(stream, data, decode, this);
        }else{
            decode.call(this, data);
        }
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

var Token = PDFTokenizer.Token;

})();