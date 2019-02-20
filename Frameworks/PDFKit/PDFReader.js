// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/PDFFilter.js"
// #import "PDFKit/PDFEncryption.js"
/* global JSClass, JSObject, JSReadOnlyProperty, PDFReader, PDFReaderStream, PDFReaderDataStream, JSData, PDFFilter, PDFEncryption */
/* global PDFIndirectObject, PDFNameObject, PDFObject, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFStreamObject, PDFTrailerObject, PDFFontObject, PDFType1FontObject, PDFTrueTypeFontObject, PDFImageObject, PDFColorSpaceObject */
'use strict';

(function(){

JSClass("PDFReader", JSObject, {

    // MARK: - Creating a reader

    initWithStream: function(stream){
        this._stream = stream;
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
        this._encryption = PDFEncryption.initWithDocumentId(id.latin1(), encrypt);
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

    _stream: null,
    _crossReferenceTable: null,
    _trailer: null,
    _document: null,

    // MARK: - File Structure

    _readVersion: function(){
        var data = this._stream.readLine();
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
        var minorVersion = data.bytes[7] - PDFReader.Numeric.zero;
        if (minorVersion < 0){
            throw new Error("Invalid minor version number: %d".sprintf(minorVersion));
        }
    },

    _readEndOfFile: function(){
        // Go to the end of the file and read the final line, expecting %%EOF
        this._stream.seek(this._stream.length);
        this._stream.seekToStartOfLine();
        var backwardsOffset = this._stream.offset;

        this._readToken(Token.endOfFileComment);
        this._readToken(Token.endOfData, Token.endOfLine);

        // Read the previous token, which should be an integer represeting the
        // cross reference table offset.  (Be sure to skip comment lines)
        this._stream.seek(backwardsOffset);
        this._stream.seekToStartOfLine();
        backwardsOffset = this._stream.offset;
        var token = this._readToken(Token.integer, Token.commentStart);
        while (token == Token.commentStart){
            this._stream.seek(backwardsOffset);
            this._stream.seekToStartOfLine();
            backwardsOffset = this._stream.offset;
            token = this._readToken(Token.integer, Token.commentStart);
        }
        this._readToken(Token.endOfLine, Token.commentStart);
        var crossReferenceTableOffset = token.pdfObject;

        // Read the previous token, verifying that it is startxref.
        // (Be sure to skip comment lines)
        this._stream.seek(backwardsOffset);
        this._stream.seekToStartOfLine();
        backwardsOffset = this._stream.offset;
        token = this._readToken(Token.startxref, Token.commentStart);
        while (token == Token.commentStart){
            this._stream.seek(backwardsOffset);
            this._stream.seekToStartOfLine();
            backwardsOffset = this._stream.offset;
            token = this._readToken(Token.startxref, Token.commentStart);
        }
        this._readToken(Token.endOfLine, Token.commentStart);
        return crossReferenceTableOffset;
    },

    _readCrossReferenceTable: function(offset){
        var maxSections = 1024;
        var sectionCount = 0;
        while (offset !== null && sectionCount < maxSections){
            this._stream.seek(offset);
            var token = this._readToken(Token.xref, Token.integer);
            var objectID;
            var generation;
            if (token == Token.integer){
                objectID = token.pdfObject;
                token = this._readToken(Token.integer);
                generation = token.pdfObject;
                token = this._readToken(Token.indirect);
                var indirect = PDFIndirectObject(objectID, generation);
                this._readCrossReferenceStream(indirect);
                return;
            }
            token = this._readMeaningfulToken(Token.integer);
            var count;
            var objectOffset;
            var status;
            while (token == Token.integer){
                objectID = token.pdfObject;
                token = this._readToken(Token.integer);
                count = token.pdfObject;
                this._readToken(Token.commentStart, Token.endOfLine);
                for (var i = 0; i < count; ++i, ++objectID){
                    if (this._crossReferenceTable[objectID] !== undefined){
                        continue;
                    }
                    offset = this._stream.offset;
                    var entryLine = String.initWithData(this._stream.read(20), String.Encoding.utf8);
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
                        if (!PDFReader.Numeric.isDigit(entryLine.charCodeAt(j))){
                            throw new Error("Invalid cross reference entry, invalid integer @ %08X".sprintf(offset + j)); 
                        }
                    }
                    objectOffset = parseInt(entryLine.substr(0, 10));
                    generation = parseInt(entryLine.substr(11, 5));
                    this._crossReferenceTable[objectID] = CrossReferenceTableEntry(objectOffset, generation, status);
                }
                token = this._readMeaningfulToken(Token.integer, Token.trailer);
            }
            token = this._readMeaningfulToken(Token.dictionaryStart);
            var trailer = this._finishReadingDictionary(PDFTrailerObject);
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

    // MARK: - Tokens

    _readAnyToken: function(){
        var byte = this._stream.byte();
        var _token;
        while (byte !== null && PDFReader.Whitespace.isNonbreakingWhitespace(byte)){
            byte = this._stream.byte();
        }
        if (byte === null){
            return Token.endOfData;
        }
        if (byte == PDFReader.Delimiters.percentSign){
            byte = this._stream.byte();
            if (byte == PDFReader.Delimiters.percentSign){
                byte = this._stream.byte();
                if (byte == 0x45){
                    byte = this._stream.byte();
                    if (byte == 0x4F){
                        byte = this._stream.byte();
                        if (byte == 0x46){
                            return Token.endOfFileComment;
                        }
                        if (byte !== null){
                            this._stream.seekRelative(-1);
                        }
                    }
                    if (byte !== null){
                        this._stream.seekRelative(-1);
                    }
                }
                if (byte !== null){
                    this._stream.seekRelative(-1);
                }
            }
            if (byte !== null){
                this._stream.seekRelative(-1);
            }
            return Token.commentStart;
        }
        if (byte == PDFReader.Delimiters.leftParenthesis){
            return Token.stringStart;
        }
        if (byte == PDFReader.Delimiters.rightParenthesis){
            return Token.stringEnd;
        }
        if (byte == PDFReader.Delimiters.lessThanSign){
            byte = this._stream.byte();
            if (byte == PDFReader.Delimiters.lessThanSign){
                return Token.dictionaryStart;
            }
            if (byte !== null){
                this._stream.seekRelative(-1);
            }
            return Token.hexStringStart;
        }
        if (byte == PDFReader.Delimiters.greaterThanSign){
            byte = this._stream.byte();
            if (byte == PDFReader.Delimiters.greaterThanSign){
                return Token.dictionaryEnd;
            }
            if (byte !== null){
                this._stream.seekRelative(-1);
            }
            return Token.hexStringEnd;
        }
        if (byte == PDFReader.Delimiters.solidus){
            _token = new String("name");
            _token.pdfObject = this._finishReadingName();
            return _token;
        }
        if (byte == PDFReader.Delimiters.leftBracket){
            return Token.arrayStart;
        }
        if (byte == PDFReader.Delimiters.rightBracket){
            return Token.arrayEnd;
        }
        if (byte == PDFReader.Delimiters.leftBrace){
            return Token.functionStart;
        }
        if (byte == PDFReader.Delimiters.rightBrace){
            return Token.functionEnd;
        }
        if (byte == 0x52){  // R
            return Token.indirect;
        }
        if (byte == PDFReader.Whitespace.carriageReturn){
            byte = this._stream.byte();
            if (byte != PDFReader.Whitespace.lineFeed && byte !== null){
                this._stream.seekRelative(-1);
            }
            return Token.endOfLine;
        }
        if (byte == PDFReader.Whitespace.lineFeed){
            return Token.endOfLine;
        }
        if (PDFReader.Numeric.isNumeric(byte)){
            var isReal = byte == PDFReader.Numeric.dot;
            var isNegative = byte == PDFReader.Numeric.minus;
            var numberString = String.fromCharCode(byte);
            byte = this._stream.byte();
            if (!isReal){
                while (PDFReader.Numeric.isDigit(byte)){
                    numberString += String.fromCharCode(byte);
                    byte = this._stream.byte();
                }
                if (byte == PDFReader.Numeric.dot){
                    isReal = true;
                    numberString += ".";
                    byte = this._stream.byte();
                }
            }
            if (isReal){
                while (PDFReader.Numeric.isDigit(byte)){
                    numberString += String.fromCharCode(byte);
                    byte = this._stream.byte();
                }
            }
            if (byte !== null && !PDFReader.Whitespace.isWhitespace(byte) && !PDFReader.Delimiters.isDelimiter(byte)){
                throw new Error("Expecting whitespace or delimter after number, got %02X @ %08X".sprintf(byte, this._stream.offset - 1));
            }
            if (byte !== null){
                this._stream.seekRelative(-1);
            }
            if (isReal){
                _token = new String("real");
                _token.pdfObject = parseFloat(numberString);
            }else{
                _token = new String("integer");
                _token.pdfObject = parseInt(numberString);
            }
            return _token;
        }
        var bytes = new Uint8Array(128);
        var length = 0;
        while (!PDFReader.Whitespace.isWhitespace(byte) && !PDFReader.Delimiters.isDelimiter(byte)){
            bytes[length++] = byte;
            byte = this._stream.byte();
        }
        if (byte !== null){
            this._stream.seekRelative(-1);
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        var token = bytes.stringByDecodingUTF8();
        return token;
    },

    _readToken: function(){
        var offset = this._stream.offset;
        var token = this._readAnyToken();
        if (arguments.length === 0){
            return token;
        }
        var expecting = Array.prototype.slice.call(arguments, 0);
        for (var i = 0, l = expecting.length; i < l; ++i){
            if (token == expecting[i]){
                return token;
            }
        }
        throw new Error("Expecting %s, got %s @ %08X".sprintf(expecting.join('|'), token, offset));
    },

    _readMeaningfulToken: function(){
        var offset = this._stream.offset;
        var token = this._readToken();
        while (token == Token.commentStart || token == Token.endOfLine){
            if (token == Token.commentStart){
                this._stream.readLine();
            }
            token = this._readToken();
        }
        if (arguments.length === 0){
            return token;
        }
        var expecting = Array.prototype.slice.call(arguments, 0);
        for (var i = 0, l = expecting.length; i < l; ++i){
            if (token == expecting[i]){
                return token;
            }
        }
        throw new Error("Expecting %s, got %s @ %08X".sprintf(expecting.join('|'), token, offset));
    },

    // MARK: - Objects

    _finishReadingName: function(){
        // empty name is valid
        var byte = this._stream.byte();
        var bytes = new Uint8Array(128);
        var length = 0;
        var a, b;
        while (!PDFReader.Whitespace.isWhitespace(byte) && !PDFReader.Delimiters.isDelimiter(byte)){
            if (byte == PDFReader.NameEscape.numberSign){
                a = this._stream.byte();
                if (!PDFReader.Hexadecimal.isHexadecimal(a)){
                    throw new Error("Expecting hex char @ %08X".sprintf(this._stream.offset - 1));
                }
                b = this._stream.byte();
                if (!PDFReader.Hexadecimal.isHexadecimal(b)){
                    throw new Error("Expecting hex char @ %08X".sprintf(this._stream.offset - 1));
                }
                byte = PDFReader.Hexadecimal.outputHexadecimal(a, b);
            }
            bytes[length++] = byte;
            byte = this._stream.byte();
        }
        if (byte !== null){
            this._stream.seekRelative(-1);
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        // Getting the unescaped bytes is straightforward, but we're left with
        // a problem.
        //
        // - Names are used for things like dictionary keys, so we need them to be javascript strings
        // - The names have no particular string encoding, so we need to be careful turning the bytes into a string
        //
        // iso8859-1 encoding simply turns each byte into a character, making it nice and
        // reversable should we need to write exactly the same bytes we read.
        //
        // The strings may not print nicely, but they'll still represent the exact data read.
        // Most keys are plain ascii, so iso8859-1 gives us what we want even for printing.
        // Certain names are required to be encoded in utf8.  If we encounter one of those names,
        // code can call use the `.valueDecodingUTF8()` function instead of the `.value`
        // property on the `PDFNameObject` instance, which will reinterpret the bytes as utf8.
        var value = bytes.stringByDecodingLatin1();
        return PDFNameObject(value);
    },

    _finishReadingString: function(){
        var openParenthesisCount = 0;
        var byte = this._stream.byte();
        var bytes = [];
        var b, c;
        var carriageReturn = false;
        while (byte != PDFReader.Delimiters.rightParenthesis || openParenthesisCount > 0) {
            if (byte === null){
                throw new Error("Expecting ), got EOD");
            }
            if (byte == PDFReader.Delimiters.leftParenthesis){
                // balanced parenthesis do not need to be escaped, so track
                // how many are open so we can tell when a closing paren delimits
                // the end of the string
                ++openParenthesisCount;
            }else if (byte == PDFReader.Delimiters.rightParenthesis){
                --openParenthesisCount;
            }else if (byte == PDFReader.StringEscape.reverseSolidus){
                // Escape characters
                byte = this._stream.byte();
                if (byte === null){
                    throw new Error("Expecting escaped char, got EOD");
                }
                if (PDFReader.StringEscape.isOctal(byte)){
                    // Octal escapes are 1-3 bytes long
                    b = this._stream.byte();
                    if (PDFReader.StringEscape.isOctal(b)){
                        c = this._stream.byte();
                        if (!PDFReader.StringEscape.isOctal(c)){
                            c = b;
                            b = byte;
                            byte = 0;
                        }
                    }else{
                        c = byte;
                        byte = 0;
                        b = 0;
                    }
                    byte = PDFReader.StringEscape.outputOctal(byte, b, c);
                }else if (byte == PDFReader.Whitespace.carriageReturn){
                    byte = this._stream.byte();
                    if (byte != PDFReader.Whitespace.lineFeed && byte !== null){
                        this._stream.seekRelative(-1);
                    }
                    carriageReturn = false;
                    continue;
                }else if (byte == PDFReader.Whitespace.lineFeed){
                    carriageReturn = false;
                    continue;
                }else{
                    byte = PDFReader.StringEscape.outputByte(byte);
                }
            }
            if (byte == PDFReader.Whitespace.lineFeed && carriageReturn){
                bytes[bytes.length - 1] = byte;
                carriageReturn = false;
            }else{
                carriageReturn = byte == PDFReader.Whitespace.carriageReturn;
                if (carriageReturn){
                    byte = PDFReader.Whitespace.lineFeed;
                }
                bytes.push(byte);
            }
            byte = this._stream.byte();
        }
        bytes = Uint8Array.from(bytes);
        return this._decodedStringFromBytes(bytes);
    },

    _finishReadingHexadecimalString: function(){
        var byte = this._stream.byte();
        var bytes = [];
        var a = null;
        while (byte != PDFReader.Delimiters.greaterThanSign){
            if (PDFReader.Hexadecimal.isHexadecimal(byte)){
                if (a === null){
                    a = byte;
                }else{
                    bytes.push(PDFReader.Hexadecimal.outputHexadecimal(a, byte));
                    a = null;
                }
            }else if (!PDFReader.Whitespace.isWhitespace(byte)){
                throw new Error("Expecting hexadecimal byte @ %08X".sprintf(this._stream.offset - 1));
            }
            byte = this._stream.byte();
        }
        if (a !== null){
            bytes.push(PDFReader.Hexadecimal.outputHexadecimal(a, 0));
        }
        bytes = Uint8Array.from(bytes);
        return this._decodedStringFromBytes(bytes);
    },

    _decodedStringFromBytes: function(bytes){
        // TODO: decode data to string using proper encoding
        return bytes.stringByDecodingLatin1();
    },

    _readObject: function(){
        var token = this._readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart);
        return this._finishReadingObject(token);
    },

    _finishReadingObject: function(token){
        var offset = this._stream.offset;
        switch (token.toString()){
            case Token.true:
                return true;
            case Token.false:
                return false;
            case Token.null:
                return null;
            case Token.integer:
                // might be an indirect reference, so we'll read ahead to see
                // if another integer and an R follows.  If not, we need to back up.
                try{
                    var token2 = this._readMeaningfulToken(Token.integer);
                    this._readMeaningfulToken(Token.indirect);
                    return PDFIndirectObject(token.pdfObject, token2.pdfObject);
                }catch (e){
                    this._stream.seek(offset);
                }
                return token.pdfObject;
            case Token.real:
                return token.pdfObject;
            case Token.name:
                return token.pdfObject;
            case Token.stringStart:
                return this._finishReadingString();
            case Token.hexStringStart:
                return this._finishReadingHexadecimalString();
            case Token.arrayStart:
                return this._finishReadingArray();
            case Token.dictionaryStart:
                return this._finishReadingDictionary();
        }
    },

    _finishReadingArray: function(){
        // Note this is not a true array, but can function like one with the added
        // benefit of automatically resolving indirect references.
        var array = {};
        array.length = 0;
        var token = this._readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart, Token.arrayEnd);
        var obj;
        while (token != Token.arrayEnd){
            obj = this._finishReadingObject(token);
            this._defineProperty(array, array.length, obj);
            ++array.length;
            token = this._readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart, Token.arrayEnd);
        }
        return array;
    },

    _finishReadingDictionary: function(cls){
        var dict = {};
        var token = this._readMeaningfulToken(Token.name, Token.dictionaryEnd);
        var key;
        var value;
        var property;
        while (token == Token.name){
            key = token.pdfObject;
            value = this._readObject();
            dict[key] = value;
            token = this._readMeaningfulToken(Token.name, Token.dictionaryEnd);
        }
        if (!cls){
            cls = PDFObjectClassForDictionary(dict);
        }
        var instance = cls();
        for (key in dict){
            this._defineProperty(instance, key, dict[key]);
        }
        return instance;
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
            this._stream.seek(offset);
            token = this._readToken(Token.integer);
            if (token.pdfObject != object.objectID){
                throw new Error("Incorrect object id for %d %d R @ %08X".sprintf(object.objectID, object.generation, offset));
            }
            token = this._readToken(Token.integer);
            if (token.pdfObject != object.generation){
                throw new Error("Incorrect generation for %d %d R @ %08X".sprintf(object.objectID, object.generation, offset));
            }
            token = this._readToken(Token.obj);
            tmp = object;
            object = this._readObject();
            if (object instanceof PDFObject){
                object.indirect = tmp;
            }
            token = this._readMeaningfulToken(Token.endobj, Token.stream);
            if (token == Token.stream){
                this._readToken(Token.endOfLine);
                this._defineStreamProperty(object, this._stream.offset);
            }
            ++levels;
        }
        if (object instanceof PDFIndirectObject){
            throw new Error("Too many levels of indirection for %d %d R".sprintf(indirect.objectID, indirect.generation));
        }
        return object;
    },

    _defineProperty: function(obj, property, value){
        var reader = this;
        if (value instanceof PDFIndirectObject){
            Object.defineProperty(obj, property, {
                configurable: true,
                get: function PDFReader_getIndirectValue(){
                    var obj = reader._getObject(value);
                    Object.defineProperty(this, property, {configurable: true, writable: true, enumerable: true, value: obj});
                    return obj;
                },
                set: function(value){
                    reader._defineProperty(this, property, {configurable: true, writable: true, enumerable: true, value: value});
                }
            });
        }else{
            Object.defineProperty(obj, property, {
                configurable: true,
                writable: true,
                value: value
            });
        }
    },

    _getStreamData: function(stream, offset, completion, target){
        // Bail if the stream has an external file reference
        if (stream.F){
            return null;
        }

        var length = stream.Length;
        this._stream.seek(offset);
        var data = this._stream.read(length);
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

    _defineStreamProperty: function(obj, offset){
        var reader = this;
        Object.defineProperty(obj, 'getData', {
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

var Token = {

    true: "true",
    false: "false",
    integer: "integer",
    real: "real",
    stringStart: "(",
    stringEnd: ")",
    hexStringStart: "<",
    hexStringEnd: ">",
    dictionaryStart: "<<",
    dictionaryEnd: ">>",
    arrayStart: "[",
    arrayEnd: "]",
    functionStart: "{",
    functionEnd: "}",
    commentStart: "%",
    name: "name",
    stream: "stream",
    endstream: "endstream",
    null: "null",
    indirect: "R",
    obj: "obj",
    endobj: "endobj",
    xref: "xref",
    trailer: "trailer",
    startxref: "startxref",
    endOfLine: "\\n",
    endOfFileComment: "%%EOF",
    endOfData: "<eod>"

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

JSClass("PDFReaderStream", JSObject, {

    length: JSReadOnlyProperty(),
    offset: JSReadOnlyProperty(),

    byte: function(){
    },

    seek: function(offset){
    },

    byteBackwards: function(){
        this.back();
        var byte = this.byte();
        this.back();
        return byte;
    },

    seekRelative: function(offset){
        this.seek(this.offset + offset);
    },

    seekToStartOfLine: function(offset){
        var length = 0;
        var byte = this.byteBackwards();
        if (byte == PDFReader.Whitespace.lineFeed){
            byte = this.byteBackwards();
        }
        if (byte == PDFReader.Whitespace.carriageReturn){
            byte = this.byteBackwards();
        }
        while (byte !== null && byte != PDFReader.Whitespace.carriageReturn && byte != PDFReader.Whitespace.lineFeed && length < 256){
            byte = this.byteBackwards();
        }
        if (byte == PDFReader.Whitespace.carriageReturn || byte == PDFReader.Whitespace.lineFeed){
            byte = this.byte();
        }
    },

    readLine: function(){
        var bytes = new Uint8Array(256);
        var length = 0;
        var byte = this.byte();
        while (byte !== null && byte != PDFReader.Whitespace.carriageReturn && byte != PDFReader.Whitespace.lineFeed && length < 256){
            bytes[length++] = byte;
            byte = this.byte();
        }
        if (byte == PDFReader.Whitespace.carriageReturn){
            byte = this.byte();
            if (byte != PDFReader.Whitespace.lineFeed && byte !== null){
                this.seekRelative(-1);
            }
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        return JSData.initWithBytes(bytes);
    },

    read: function(count){
        var bytes = new Uint8Array(count);
        var length = 0;
        var byte;
        while (length < count){
            byte = this.byte();
            if (byte === null){
                break;
            }
            bytes[length++] = byte;
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        return JSData.initWithBytes(bytes);
    },

});

JSClass("PDFReaderDataStream", PDFReaderStream, {

    _data: null,
    _offset: null,

    initWithData: function(data){
        this._data = data;
        this._offset = 0;
    },

    byte: function(){
        if (this._offset >= this._data.length){
            return null;
        }
        return this._data.bytes[this._offset++];
    },

    byteBackwards: function(){
        if (this._offset === 0){
            return null;
        }
        return this._data.bytes[--this._offset];
    },

    seek: function(offset){
        this._offset = offset;
    },

    getOffset: function(){
        return this._offset;
    },

    getLength: function(){
        return this._data.length;
    }

});

PDFReader.Whitespace = {
    null: 0x00,
    horizontalTab: 0x09,
    lineFeed: 0x0A,
    formFeed: 0x0C,
    carriageReturn: 0x0D,
    space: 0x20,

    isWhitespace: function(byte){
        return byte !== null && (
            byte == PDFReader.Whitespace.null || 
            byte == PDFReader.Whitespace.horizontalTab || 
            byte == PDFReader.Whitespace.lineFeed || 
            byte == PDFReader.Whitespace.formFeed || 
            byte == PDFReader.Whitespace.carriageReturn || 
            byte == PDFReader.Whitespace.space
        );
    },

    isNonbreakingWhitespace: function(byte){
        return byte !== null && (
            byte == PDFReader.Whitespace.null || 
            byte == PDFReader.Whitespace.horizontalTab || 
            byte == PDFReader.Whitespace.formFeed || 
            byte == PDFReader.Whitespace.space
        );
    }
};

PDFReader.Delimiters = {
    leftParenthesis: 0x28,
    rightParenthesis: 0x29,
    lessThanSign: 0x3C,
    greaterThanSign: 0x3E,
    leftBracket: 0x5B,
    rightBracket: 0x5D,
    leftBrace: 0x7B,
    rightBrace: 0x7D,
    solidus: 0x2F,
    percentSign: 0x25,

    isDelimiter: function(byte){
        return byte !== null && (
            byte == PDFReader.Delimiters.leftParenthesis ||
            byte == PDFReader.Delimiters.rightParenthesis ||
            byte == PDFReader.Delimiters.lessThanSign ||
            byte == PDFReader.Delimiters.greaterThanSign ||
            byte == PDFReader.Delimiters.leftBracket ||
            byte == PDFReader.Delimiters.rightBracket ||
            byte == PDFReader.Delimiters.leftBrace ||
            byte == PDFReader.Delimiters.rightBrace ||
            byte == PDFReader.Delimiters.solidus ||
            byte == PDFReader.Delimiters.percentSign
        );
    }
};

PDFReader.Numeric = {
    zero: 0x30,
    one: 0x31,
    two: 0x32,
    three: 0x33,
    four: 0x34,
    five: 0x35,
    six: 0x35,
    seven: 0x37,
    eight: 0x38,
    nine: 0x39,
    plus: 0x2B,
    minus: 0x2D,
    dot: 0x2E,


    isNumeric: function(byte){
        return byte !== null && (
            (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine) ||
            byte == PDFReader.Numeric.plus ||
            byte == PDFReader.Numeric.minus ||
            byte == PDFReader.Numeric.dot
        );
    },

    isDigit: function(byte){
        return byte !== null && (
            (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine)
        );   
    }
};

PDFReader.StringEscape = {
    reverseSolidus: 0x5C,
    lineFeed: 0x6E,
    carriageReturn: 0x72,
    horizontalTab: 0x74,
    backspace: 0x62,
    formFeed: 0x66,
    leftParenthesis: 0x28,
    rightParenthesis: 0x29,

    isOctal: function(byte){
        return byte !== null && byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.seven;
    },

    outputOctal: function(a, b, c){
        a -= PDFReader.Numeric.zero;
        b -= PDFReader.Numeric.zero;
        c -= PDFReader.Numeric.zero;
        return a * 64 + b * 8 + c;
    },

    outputByte: function(escapedByte){
        switch (escapedByte){
            case PDFReader.StringEscape.reverseSolidus:
                return PDFReader.StringEscape.reverseSolidus;
            case PDFReader.StringEscape.lineFeed:
                return PDFReader.Whitespace.lineFeed;
            case PDFReader.StringEscape.carriageReturn:
                return PDFReader.Whitespace.carriageReturn;
            case PDFReader.StringEscape.horizontalTab:
                return PDFReader.Whitespace.horizontalTab;
            case PDFReader.StringEscape.backspace:
                return 0x08;
            case PDFReader.StringEscape.formFeed:
                return PDFReader.Whitespace.formFeed;
            case PDFReader.StringEscape.leftParenthesis:
                return PDFReader.StringEscape.leftParenthesis;
            case PDFReader.StringEscape.rightParenthesis:
                return PDFReader.StringEscape.rightParenthesis;
            default:
                return escapedByte;
        }
    }
};

PDFReader.Hexadecimal = {
    A: 0x41,
    F: 0x46,
    a: 0x61,
    f: 0x66,

    isHexadecimal: function(byte){
        return byte !== null && (
            (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine) ||
            (byte >= PDFReader.Hexadecimal.A && byte <= PDFReader.Hexadecimal.F) ||
            (byte >= PDFReader.Hexadecimal.a && byte <= PDFReader.Hexadecimal.f)
        );
    },

    outputHexadecimal: function(a, b){
        return PDFReader.Hexadecimal._factor(a) * 16 + PDFReader.Hexadecimal._factor(b);
    },

    _factor: function(byte){
        if (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine){
            return byte - PDFReader.Numeric.zero;
        }
        if (byte >= PDFReader.Hexadecimal.A && byte <= PDFReader.Hexadecimal.F){
            return byte - PDFReader.Hexadecimal.A + 10;
        }
        return byte - PDFReader.Hexadecimal.a + 10;
    }
};

PDFReader.NameEscape = {
    numberSign: 0x23
};

var PDFObjectClassesByType = {};
var PDFObjectClassesBySubtype = {};

var PDFObjectClassForDictionary = function(dict){
    var type = dict.Type;
    if (type instanceof PDFNameObject){
        if (type in PDFObjectClassesByType){
            return PDFObjectClassesByType[type];
        }
        if (type in PDFObjectClassesBySubtype){
            var subtype = dict.Subtype;
            if (subtype instanceof PDFNameObject){
                if (subtype in PDFObjectClassesBySubtype[type]){
                    return PDFObjectClassesBySubtype[type][subtype];
                }
            }
        }
    }
    // We want stream objects to be instantiated as PDFStreamObject instances,
    // which have special properties for accessing the stream data.
    //
    // Unfortunately, plain streams don't have a Type field that allows them to be easily
    // identified without any other context.
    //
    // - The `Length` property, however, is required and doesn't appear to be used by other types.
    //
    // - Another way to solve it would be for PDFReader to use contextual information
    //   to know if it's reading a stream or not.  For exmample, after reading a dictionary,
    //   PDFReader already checks for the `stream` keyword.  However, we've already
    //   parsed the dictionary and assigned a type by then.  The objet would have to
    //   be re-instantiated as a PDFStreamObject, which is tricky becasue of the lazy
    //   reader properties for indirect objects.
    //
    // - Objects themeselves could hold information about the expected type of their properties,
    //   but this is problematic because PDF allows certain properties to have multiple types.
    //   For example, Page.Contents can be a stream or an array of streams.  This complicates
    //   specifiying types for each property because the type isn't known until the property is read.
    if ('Length' in dict){
        return PDFStreamObject;
    }
    return PDFObject;
};


var types = [
    PDFDocumentObject,
    PDFPageTreeNodeObject,
    PDFPageObject,
    PDFGraphicsStateParametersObject
];
var typesWithSubtypes = [
    PDFType1FontObject,
    PDFTrueTypeFontObject,
    PDFImageObject,
];
var i, l;
for (i = 0, l = types.length; i < l; ++i){
    PDFObjectClassesByType[types[i].prototype.Type] = types[i];
}
for (i = 0, l = typesWithSubtypes.length; i < l; ++i){
    if (!(types[i].prototype.Type in PDFObjectClassesBySubtype)){
        PDFObjectClassesBySubtype[types[i].prototype.Type] = {};
    }
    PDFObjectClassesBySubtype[types[i].prototype.Type][[types[i].prototype.Subtype]] = types[i];
}

})();