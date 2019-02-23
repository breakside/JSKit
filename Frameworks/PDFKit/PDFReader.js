// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/PDFFilter.js"
// #import "PDFKit/PDFEncryption.js"
// #import "PDFKit/PDFTokenizer.js"
// #import "PDFKit/PDFReaderStream.js"
// #import "PDFKit/PDFStreamOperation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, PDFReader, PDFTokenizer, PDFReaderStream, PDFReaderDataStream, PDFStreamOperationIterator, JSData, PDFFilter, PDFEncryption, PDFStreamOperation */
/* global PDFIndirectObject, PDFNameObject, PDFObject, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFStreamObject, PDFTrailerObject, PDFFontObject, PDFType1FontObject, PDFTrueTypeFontObject, PDFImageObject */
'use strict';

(function(){

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
        this._tokenizer.stream.seek(this._tokenizer.stream.length);
        this._tokenizer.stream.seekToStartOfLine();
        var backwardsOffset = this._tokenizer.stream.offset;

        this._tokenizer.readToken(Token.endOfFileComment);
        this._tokenizer.readToken(Token.endOfData, Token.endOfLine);

        // Read the previous token, which should be an integer represeting the
        // cross reference table offset.  (Be sure to skip comment lines)
        this._tokenizer.stream.seek(backwardsOffset);
        this._tokenizer.stream.seekToStartOfLine();
        backwardsOffset = this._tokenizer.stream.offset;
        var token = this._tokenizer.readToken(Token.integer, Token.commentStart);
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
                token = this._tokenizer.readToken(Token.indirect);
                var indirect = PDFIndirectObject(objectID, generation);
                this._readCrossReferenceStream(indirect);
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
                this._tokenizer.readToken(Token.commentStart, Token.endOfLine);
                for (var i = 0; i < count; ++i, ++objectID){
                    if (this._crossReferenceTable[objectID] !== undefined){
                        continue;
                    }
                    offset = this._tokenizer.stream.offset;
                    var entryLine = String.initWithData(this._tokenizer.stream.read(20), String.Encoding.utf8);
                    if (entryLine.length != 20){
                        throw new Error("Not enough space for cross reference line @ %08X".sprintf(offset));
                    }
                    if ((entryLine.charAt(18) != "\r" && entryLine.charAt(18) != " ") || entryLine.charAt(19) != "\n"){
                        throw new Error("Invalid cross reference entry, missing CRLF @ %08X".sprintf(offset + 18));
                    }
                    if (entryLine.charAt(10) != " " || entryLine.charAt(16) != " "){
                        throw new Error("Invalid cross reference entry, missing spaces @ %08X".sprintf(offset));
                    }
                    status = entryLine.charAt(17);
                    if (status != CrossReferenceTableEntry.Status.free && status != CrossReferenceTableEntry.Status.used){
                        throw new Error("Invalid cross reference entry, invalid status @ %08X".sprintf(offset + 17));
                    }
                    for (var j = 0; j < 16; ++j){
                        if (j == 10){
                            continue;
                        }
                        if (!PDFTokenizer.Numeric.isDigit(entryLine.charCodeAt(j))){
                            throw new Error("Invalid cross reference entry, invalid integer @ %08X".sprintf(offset + j)); 
                        }
                    }
                    objectOffset = parseInt(entryLine.substr(0, 10));
                    generation = parseInt(entryLine.substr(11, 5));
                    this._crossReferenceTable[objectID] = CrossReferenceTableEntry(objectOffset, generation, status);
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
                return null;
            }
            offset = entry.offset;
            this._tokenizer.stream.seek(offset);
            token = this._tokenizer.readToken(Token.integer);
            if (token.pdfObject != object.objectID){
                throw new Error("Incorrect object id for %d %d R @ %08X".sprintf(object.objectID, object.generation, offset));
            }
            token = this._tokenizer.readToken(Token.integer);
            if (token.pdfObject != object.generation){
                throw new Error("Incorrect generation for %d %d R @ %08X".sprintf(object.objectID, object.generation, offset));
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
            return null;
        }

        var length = stream.Length;
        this._tokenizer.stream.seek(offset);
        var data = this._tokenizer.stream.read(length);
        if (data.length != length){
            return null;
        }

        var decode = function PDFReader_getStreamData_decode(data){
            var filters = PDFFilter.CreateChain(stream.Filter, stream.DecodeParams);
            for (var i = 0, l = filters.length; data !== null && i < l; ++i){
                try{
                    data = filters[i].decode(data);
                }catch (e){
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
        Object.defineProperty(stream, 'getOperationIterator', {
            configurable: true,
            value: function PDFReader_getStreamOperationIterator(completion, target){
                this.getData(function(data){
                    if (data === null){
                        completion.call(target, null);
                        return;
                    }
                    var iterator = PDFStreamOperationIterator.initWithData(data);
                    completion.call(target, iterator);
                }, this);
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

JSClass('PDFStreamOperationIterator', JSObject, {

    tokenizer: null,
    state: null,
    queue: null,

    initWithData: function(data){
        this.tokenizer = PDFTokenizer.initWithData(data);
        this.queue = [];
    },

    next: function(){
        var operands = [];
        var compatibilityLevel = 0;
        var obj;
        // Certain operators are really just shortcut combinations of other
        // operations.  To simplify the set of operations that callers need
        // to worry about, we'll convert the shortcuts into the their longer
        // combinations.  A queue helps manage this expansion, as one token
        // may add several operations to the queue; only the first operation
        // gets returned, and remaining items are dequeued on subsequent calls
        // to next() before continuing reading tokens.
        while (this.queue.length === 0){
            var token = this.tokenizer.readMeaningfulToken();
            switch (token.toString()){

                // Operands

                case Token.true:
                    if (compatibilityLevel === 0){
                        operands.push(true);
                    }
                    break;
                case Token.false:
                    if (compatibilityLevel === 0){
                        operands.push(false);
                    }
                    break;
                case Token.integer:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.real:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.stringStart:
                case Token.hexStringStart:
                case Token.dictionaryStart:
                case Token.arrayStart:
                    obj = this.tokenizer.finishReadingObject(token);
                    if (compatibilityLevel === 0){
                        operands.push(obj);
                    }
                    break;
                case Token.commentStart:
                    this.tokenizer.finishReadingComment();
                    break;
                case Token.name:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.null:
                    if (compatibilityLevel === 0){
                        operands.push(null);
                    }
                    break;

                // Errors
                // (will appear to consumers like the stream ended)

                case Token.stringEnd:
                case Token.hexStringEnd:
                case Token.arrayEnd:
                case Token.dictionaryEnd:
                case Token.endOfData:
                case Token.endOfFileComment:
                case Token.stream:
                case Token.endstream:
                case Token.obj:
                case Token.endobj:
                case Token.xref:
                case Token.trailer:
                case Token.startxref:
                case Token.indirect:
                case Op.imageData:
                case Op.endImage:
                    this.queue.push(null);
                    break;

                // Compatibility

                case Op.beginCompatibility:
                    ++compatibilityLevel;
                    break;
                case Op.endCompatibility:
                    if (compatibilityLevel === 0){
                        return null;
                    }
                    --compatibilityLevel;
                    break;

                // Inline Images

                case Op.beginImage:
                    if (compatibilityLevel === 0){
                        try{
                            obj = this.finishReadingInlineImage();
                            if (obj === null){
                                return null;
                            }
                        }catch (e){
                            return null;
                        }
                        this.queue.push(PDFStreamOperation(Op.endImage, [obj]));
                    }
                    break;

                // Text
                // Special cases that are really just combinations of other
                // operators.  Handling them here makes it easier on readers
                // since they'll only have to handle the simpler cases.

                case Op.nextLineText:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(Op.nextLine, []));
                        this.queue.push(PDFStreamOperation(Op.text, operands));
                    }
                    break;
                case Op.nextLineTextSpacing:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(Op.wordSpacing, [operands[0]]));
                        this.queue.push(PDFStreamOperation(Op.characterSpacing, [operands[1]]));
                        this.queue.push(PDFStreamOperation(Op.nextLine, []));
                        this.queue.push(PDFStreamOperation(Op.text, [operands[2]]));
                    }
                    break;
                case Op.textArray:
                    // For `[(abc) 1 (def) 2 (ghi) 3] TJ` operations, we'll make up a new
                    // operator, `xTextAdvance`, that should adjust the text matrix, but
                    // not the text line matrix.  The Tm operator won't do because it uses
                    // absolute instead of relative values and update the line matrix too.
                    // This way, consumers of operations will only ever see a single kind
                    // of text drawing operator, Tj, simplifying their logic.
                    if (compatibilityLevel === 0){
                        for (var i = 0, l = operands[0].length; i < l; ++i){
                            var op = operands[0][i];
                            if (typeof(op) == 'number'){
                                // TODO: consider vertical writing direction and set y instead of x if applicable (should be negative to move down)
                                // TODO: consider RTL writing direction and set x to negative to move left
                                this.queue.push(PDFStreamOperation(Op.xTextAdvance, [op, 0]));
                            }else{
                                this.queue.push(PDFStreamOperation(Op.text, [op]));
                            }
                        }
                    }
                    break;

                // Aliases
                // (operators that are really just aliases for others)

                case Token.fillPathAlias:
                    this.queue.push(PDFStreamOperation(Op.fillPath));
                    break;

                // Functions
                // (currently unused and ingored by treating them like compatibility markers)

                case Token.functionStart:
                    ++compatibilityLevel;
                    break;
                case Token.functionEnd:
                    if (compatibilityLevel === 0){
                        return null;
                    }
                    --compatibilityLevel;
                    break;

                // TODO: Marked Content

                // Operators
                // (allowing any operator, even unknown, to be read by caller)

                default:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(token, operands));
                    }
                    break;
            }
        }
        // TODO: validate known operations (argument lengths and types)
        return this.queue.shift();
    },

    finishReadingInlineImage: function(){
        var token = this.tokenizer.readMeaningfulToken(Token.name, Op.imageData);
        var parameters = {};
        var key;
        var value;
        var data = null;
        while (token != Op.imageData){
            key = token.pdfObject;
            value = this.tokenizer.readObject();
            parameters[key] = value;
            token = this.tokenizer.readMeaningfulToken(Token.name, Op.imageData);
        }

        var filters = parameters.Filter || parameters.F;
        if (!filters){
            var w = parameters.Width || parameters.W || 0;
            var h = parameters.Height || parameters.H || 0;
            var bitsPerComponent = parameters.BitsPerComponent || parameters.BPC || 8;
            var colorSpace = parameters.ColorSpace || parameters.CS || null;
            var components = 0;
            if (colorSpace !== null){
                switch (colorSpace.toString()){
                    case "DeviceGray":
                    case "G":
                        components = 1;
                        break;
                    case "DeviceRGB":
                    case "RGB":
                        components = 3;
                        break;
                    case "DeviceCMYK":
                    case "CMYK":
                        components = 4;
                        break;
                    default:
                        // Ugh, need to lookup in resources, which we don't have
                        break;
                }
            }
            var count;
            if (components !== 0){
                count = w * h * components * bitsPerComponent / 8;
                data = this.tokenizer.stream.read(count);
                this.tokenizer.readMeaningfulToken(Op.endImage);
            }else{
                // We don't know the number of components, but it should be 1..4
                count = w * h * bitsPerComponent / 8;

                // Trying 1...
                data = this.tokenizer.stream.read(count);
                var offset = this.tokenizer.stream.offset;
                try{
                    this.tokenizer.readMeaningfulToken(Op.endImage);
                }catch (e){
                    // Trying 2...
                    this.tokenizer.stream.seek(offset);
                    var data2 = this.tokenizer.stream.read(count);
                    offset = this.tokenizer.stream.offset;
                    try{
                        this.tokenizer.readMeaningfulToken(Op.endImage);
                        data = JSData.initWithChunks([data.bytes, data2.bytes]);
                    }catch (e2){
                        // Trying 3...
                        this.tokenizer.stream.seek(offset);
                        var data3 = this.tokenizer.stream.read(count);
                        offset = this.tokenizer.stream.offset;
                        try{
                            this.tokenizer.readMeaningfulToken(Op.endImage);
                            data = JSData.initWithChunks([data.bytes, data2.bytes, data3.bytes]);
                        }catch (e3){
                            // Trying 4...
                            this.tokenizer.stream.seek(offset);
                            var data4 = this.tokenizer.stream.read(count);
                            data = JSData.initWithChunks([data.bytes, data2.bytes, data3.bytes, data4.bytes]);
                            this.tokenizer.readMeaningfulToken(Op.endImage);
                        }
                    }
                }
            }
        }else{
            if (filters instanceof PDFNameObject){
                filters = [filters];
            }
            switch (filters[0]){
                case "ASCIIHexDecode":
                case "AHx":
                case "ASCII85Decode":
                case "A85":
                    // TODO: scan for >
                    break;
                default:
                    // TODO: scan for EI?
                    // Filters should be able to tell when the reach their end of data
                    // perhaps the filter code needs to be updated to be more incremental
                    // so it can tell us when it's done rather than us having to know the
                    // length of the input data
                    break;
            }
        }
        var byte = this.tokenizer.stream.byte();
        var foundE = false;
        while (byte !== null){
            if (foundE && byte == 0x49){
                break;
            }
            foundE = byte == 0x45;
            byte = this.tokenizer.stream.byte();
        }
        // FIXME: should collect data, decode, and return
        return {parameters: parameters, data: data};
    }

});

var Token = PDFTokenizer.Token;
var Op = PDFStreamOperation.Operator;

})();