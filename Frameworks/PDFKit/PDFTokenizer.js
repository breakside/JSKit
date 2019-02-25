// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
/* global JSClass, JSObject, JSReadOnlyProperty, PDFTokenizer, PDFReaderStream, PDFReaderDataStream, JSData */
/* global PDFIndirectObject, PDFNameObject, PDFObject, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFStreamObject, PDFTrailerObject, PDFFontObject, PDFType1FontObject, PDFTrueTypeFontObject, PDFFontDescriptorObject, PDFImageObject */
'use strict';

(function(){

JSClass("PDFTokenizer", JSObject, {

    stream: null,
    allowsIndirectObjects: false,
    delegate: null,

    initWithStream: function(stream){
        this.stream = stream;
    },

    initWithData: function(data){
        var stream = PDFReaderDataStream.initWithData(data);
        this.initWithStream(stream);
    },

    // MARK: - Tokens

    _readAnyToken: function(){
        var byte = this.stream.byte();
        var _token;
        while (byte !== null && PDFTokenizer.Whitespace.isNonbreakingWhitespace(byte)){
            byte = this.stream.byte();
        }
        if (byte === null){
            return Token.endOfData;
        }
        if (byte == PDFTokenizer.Delimiters.percentSign){
            byte = this.stream.byte();
            if (byte == PDFTokenizer.Delimiters.percentSign){
                byte = this.stream.byte();
                if (byte == 0x45){
                    byte = this.stream.byte();
                    if (byte == 0x4F){
                        byte = this.stream.byte();
                        if (byte == 0x46){
                            return Token.endOfFileComment;
                        }
                        if (byte !== null){
                            this.stream.seekRelative(-1);
                        }
                    }
                    if (byte !== null){
                        this.stream.seekRelative(-1);
                    }
                }
                if (byte !== null){
                    this.stream.seekRelative(-1);
                }
            }
            if (byte !== null){
                this.stream.seekRelative(-1);
            }
            return Token.commentStart;
        }
        if (byte == PDFTokenizer.Delimiters.leftParenthesis){
            return Token.stringStart;
        }
        if (byte == PDFTokenizer.Delimiters.rightParenthesis){
            return Token.stringEnd;
        }
        if (byte == PDFTokenizer.Delimiters.lessThanSign){
            byte = this.stream.byte();
            if (byte == PDFTokenizer.Delimiters.lessThanSign){
                return Token.dictionaryStart;
            }
            if (byte !== null){
                this.stream.seekRelative(-1);
            }
            return Token.hexStringStart;
        }
        if (byte == PDFTokenizer.Delimiters.greaterThanSign){
            byte = this.stream.byte();
            if (byte == PDFTokenizer.Delimiters.greaterThanSign){
                return Token.dictionaryEnd;
            }
            if (byte !== null){
                this.stream.seekRelative(-1);
            }
            return Token.hexStringEnd;
        }
        if (byte == PDFTokenizer.Delimiters.solidus){
            _token = new String("name");
            _token.pdfObject = this._finishReadingName();
            return _token;
        }
        if (byte == PDFTokenizer.Delimiters.leftBracket){
            return Token.arrayStart;
        }
        if (byte == PDFTokenizer.Delimiters.rightBracket){
            return Token.arrayEnd;
        }
        if (byte == PDFTokenizer.Delimiters.leftBrace){
            return Token.functionStart;
        }
        if (byte == PDFTokenizer.Delimiters.rightBrace){
            return Token.functionEnd;
        }
        if (byte == PDFTokenizer.Whitespace.carriageReturn){
            byte = this.stream.byte();
            if (byte != PDFTokenizer.Whitespace.lineFeed && byte !== null){
                this.stream.seekRelative(-1);
            }
            return Token.endOfLine;
        }
        if (byte == PDFTokenizer.Whitespace.lineFeed){
            return Token.endOfLine;
        }
        if (PDFTokenizer.Numeric.isNumeric(byte)){
            var isReal = byte == PDFTokenizer.Numeric.dot;
            var isNegative = byte == PDFTokenizer.Numeric.minus;
            var numberString = String.fromCharCode(byte);
            byte = this.stream.byte();
            if (!isReal){
                while (PDFTokenizer.Numeric.isDigit(byte)){
                    numberString += String.fromCharCode(byte);
                    byte = this.stream.byte();
                }
                if (byte == PDFTokenizer.Numeric.dot){
                    isReal = true;
                    numberString += ".";
                    byte = this.stream.byte();
                }
            }
            if (isReal){
                while (PDFTokenizer.Numeric.isDigit(byte)){
                    numberString += String.fromCharCode(byte);
                    byte = this.stream.byte();
                }
            }
            if (byte !== null && !PDFTokenizer.Whitespace.isWhitespace(byte) && !PDFTokenizer.Delimiters.isDelimiter(byte)){
                throw new Error("Expecting whitespace or delimter after number, got %02X @ 0x%08X".sprintf(byte, this.stream.offset - 1));
            }
            if (byte !== null){
                this.stream.seekRelative(-1);
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
        while (byte !== null && !PDFTokenizer.Whitespace.isWhitespace(byte) && !PDFTokenizer.Delimiters.isDelimiter(byte)){
            bytes[length++] = byte;
            byte = this.stream.byte();
        }
        if (byte !== null){
            this.stream.seekRelative(-1);
        }
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, length);
        var token = bytes.stringByDecodingUTF8();
        return token;
    },

    readToken: function(){
        var offset = this.stream.offset;
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
        throw new Error("Expecting %s, got %s @ 0x%08X".sprintf(expecting.join('|'), token, offset));
    },

    readMeaningfulToken: function(){
        var offset = this.stream.offset;
        var token = this.readToken();
        while (token == Token.commentStart || token == Token.endOfLine){
            if (token == Token.commentStart){
                this.finishReadingComment();
            }
            token = this.readToken();
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
        throw new Error("Expecting %s, got %s @ 0x%08X".sprintf(expecting.join('|'), token, offset));
    },

    // MARK: - Objects

    finishReadingComment: function(){
        this.stream.readLine();
    },

    _finishReadingName: function(){
        // empty name is valid
        var byte = this.stream.byte();
        var bytes = new Uint8Array(128);
        var length = 0;
        var a, b;
        while (!PDFTokenizer.Whitespace.isWhitespace(byte) && !PDFTokenizer.Delimiters.isDelimiter(byte)){
            if (byte == PDFTokenizer.NameEscape.numberSign){
                a = this.stream.byte();
                if (!PDFTokenizer.Hexadecimal.isHexadecimal(a)){
                    throw new Error("Expecting hex char @ 0x%08X".sprintf(this.stream.offset - 1));
                }
                b = this.stream.byte();
                if (!PDFTokenizer.Hexadecimal.isHexadecimal(b)){
                    throw new Error("Expecting hex char @ 0x%08X".sprintf(this.stream.offset - 1));
                }
                byte = PDFTokenizer.Hexadecimal.outputHexadecimal(a, b);
            }
            bytes[length++] = byte;
            byte = this.stream.byte();
        }
        if (byte !== null){
            this.stream.seekRelative(-1);
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
        var byte = this.stream.byte();
        var bytes = [];
        var b, c;
        var carriageReturn = false;
        while (byte != PDFTokenizer.Delimiters.rightParenthesis || openParenthesisCount > 0) {
            if (byte === null){
                throw new Error("Expecting ), got EOD");
            }
            if (byte == PDFTokenizer.Delimiters.leftParenthesis){
                // balanced parenthesis do not need to be escaped, so track
                // how many are open so we can tell when a closing paren delimits
                // the end of the string
                ++openParenthesisCount;
            }else if (byte == PDFTokenizer.Delimiters.rightParenthesis){
                --openParenthesisCount;
            }else if (byte == PDFTokenizer.StringEscape.reverseSolidus){
                // Escape characters
                byte = this.stream.byte();
                if (byte === null){
                    throw new Error("Expecting escaped char, got EOD");
                }
                if (PDFTokenizer.StringEscape.isOctal(byte)){
                    // Octal escapes are 1-3 bytes long
                    b = this.stream.byte();
                    if (PDFTokenizer.StringEscape.isOctal(b)){
                        c = this.stream.byte();
                        if (!PDFTokenizer.StringEscape.isOctal(c)){
                            c = b;
                            b = byte;
                            byte = 0;
                        }
                    }else{
                        c = byte;
                        byte = 0;
                        b = 0;
                    }
                    byte = PDFTokenizer.StringEscape.outputOctal(byte, b, c);
                }else if (byte == PDFTokenizer.Whitespace.carriageReturn){
                    byte = this.stream.byte();
                    if (byte != PDFTokenizer.Whitespace.lineFeed && byte !== null){
                        this.stream.seekRelative(-1);
                    }
                    carriageReturn = false;
                    continue;
                }else if (byte == PDFTokenizer.Whitespace.lineFeed){
                    carriageReturn = false;
                    continue;
                }else{
                    byte = PDFTokenizer.StringEscape.outputByte(byte);
                }
            }
            if (byte == PDFTokenizer.Whitespace.lineFeed && carriageReturn){
                bytes[bytes.length - 1] = byte;
                carriageReturn = false;
            }else{
                carriageReturn = byte == PDFTokenizer.Whitespace.carriageReturn;
                if (carriageReturn){
                    byte = PDFTokenizer.Whitespace.lineFeed;
                }
                bytes.push(byte);
            }
            byte = this.stream.byte();
        }
        bytes = Uint8Array.from(bytes);
        return JSData.initWithBytes(bytes);
    },

    _finishReadingHexadecimalString: function(){
        var byte = this.stream.byte();
        var bytes = [];
        var a = null;
        while (byte != PDFTokenizer.Delimiters.greaterThanSign){
            if (PDFTokenizer.Hexadecimal.isHexadecimal(byte)){
                if (a === null){
                    a = byte;
                }else{
                    bytes.push(PDFTokenizer.Hexadecimal.outputHexadecimal(a, byte));
                    a = null;
                }
            }else if (!PDFTokenizer.Whitespace.isWhitespace(byte)){
                throw new Error("Expecting hexadecimal byte @ 0x%08X".sprintf(this.stream.offset - 1));
            }
            byte = this.stream.byte();
        }
        if (a !== null){
            bytes.push(PDFTokenizer.Hexadecimal.outputHexadecimal(a, 0));
        }
        bytes = Uint8Array.from(bytes);
        return JSData.initWithBytes(bytes);
    },

    readObject: function(){
        var token = this.readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart);
        return this.finishReadingObject(token);
    },

    finishReadingObject: function(token){
        var offset = this.stream.offset;
        switch (token.toString()){
            case Token.true:
                return true;
            case Token.false:
                return false;
            case Token.null:
                return null;
            case Token.integer:
                if (this.allowsIndirectObjects){
                    // might be an indirect reference, so we'll read ahead to see
                    // if another integer and an R follows.  If not, we need to back up.
                    try{
                        var token2 = this.readMeaningfulToken(Token.integer);
                        this.readMeaningfulToken(Token.indirect);
                        return PDFIndirectObject(token.pdfObject, token2.pdfObject);
                    }catch (e){
                        this.stream.seek(offset);
                    }
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
                return this.finishReadingDictionary();
        }
    },

    _finishReadingArray: function(){
        // Note this is not a true array, but can function like one with the added
        // benefit of automatically resolving indirect references.
        var array = {};
        array.length = 0;
        var token = this.readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart, Token.arrayEnd);
        var obj;
        while (token != Token.arrayEnd){
            obj = this.finishReadingObject(token);
            this._defineProperty(array, array.length, obj);
            ++array.length;
            token = this.readMeaningfulToken(Token.true, Token.false, Token.null, Token.integer, Token.real, Token.name, Token.stringStart, Token.hexStringStart, Token.arrayStart, Token.dictionaryStart, Token.arrayEnd);
        }
        return array;
    },

    finishReadingDictionary: function(cls){
        var dict = {};
        var token = this.readMeaningfulToken(Token.name, Token.dictionaryEnd);
        var key;
        var value;
        var property;
        while (token == Token.name){
            key = token.pdfObject;
            value = this.readObject();
            dict[key] = value;
            token = this.readMeaningfulToken(Token.name, Token.dictionaryEnd);
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

    _defineProperty: function(obj, property, value){
        if (this.allowsIndirectObjects && (value instanceof PDFIndirectObject) && this.delegate && this.delegate.tokenizerDefineIndirectProperty){
            this.delegate.tokenizerDefineIndirectProperty(this, obj, property, value);
        }else{
            Object.defineProperty(obj, property, {
                configurable: true,
                writable: true,
                enumerable: true,
                value: value
            });
        }
    }

});

var Token = PDFTokenizer.Token = {

    // Objects / Main Document
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

PDFTokenizer.Whitespace = {
    null: 0x00,
    horizontalTab: 0x09,
    lineFeed: 0x0A,
    formFeed: 0x0C,
    carriageReturn: 0x0D,
    space: 0x20,

    isWhitespace: function(byte){
        return byte !== null && (
            byte == PDFTokenizer.Whitespace.null || 
            byte == PDFTokenizer.Whitespace.horizontalTab || 
            byte == PDFTokenizer.Whitespace.lineFeed || 
            byte == PDFTokenizer.Whitespace.formFeed || 
            byte == PDFTokenizer.Whitespace.carriageReturn || 
            byte == PDFTokenizer.Whitespace.space
        );
    },

    isNonbreakingWhitespace: function(byte){
        return byte !== null && (
            byte == PDFTokenizer.Whitespace.null || 
            byte == PDFTokenizer.Whitespace.horizontalTab || 
            byte == PDFTokenizer.Whitespace.formFeed || 
            byte == PDFTokenizer.Whitespace.space
        );
    }
};

PDFTokenizer.Delimiters = {
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
            byte == PDFTokenizer.Delimiters.leftParenthesis ||
            byte == PDFTokenizer.Delimiters.rightParenthesis ||
            byte == PDFTokenizer.Delimiters.lessThanSign ||
            byte == PDFTokenizer.Delimiters.greaterThanSign ||
            byte == PDFTokenizer.Delimiters.leftBracket ||
            byte == PDFTokenizer.Delimiters.rightBracket ||
            byte == PDFTokenizer.Delimiters.leftBrace ||
            byte == PDFTokenizer.Delimiters.rightBrace ||
            byte == PDFTokenizer.Delimiters.solidus ||
            byte == PDFTokenizer.Delimiters.percentSign
        );
    }
};

PDFTokenizer.Numeric = {
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
            (byte >= PDFTokenizer.Numeric.zero && byte <= PDFTokenizer.Numeric.nine) ||
            byte == PDFTokenizer.Numeric.plus ||
            byte == PDFTokenizer.Numeric.minus ||
            byte == PDFTokenizer.Numeric.dot
        );
    },

    isDigit: function(byte){
        return byte !== null && (
            (byte >= PDFTokenizer.Numeric.zero && byte <= PDFTokenizer.Numeric.nine)
        );   
    }
};

PDFTokenizer.StringEscape = {
    reverseSolidus: 0x5C,
    lineFeed: 0x6E,
    carriageReturn: 0x72,
    horizontalTab: 0x74,
    backspace: 0x62,
    formFeed: 0x66,
    leftParenthesis: 0x28,
    rightParenthesis: 0x29,

    isOctal: function(byte){
        return byte !== null && byte >= PDFTokenizer.Numeric.zero && byte <= PDFTokenizer.Numeric.seven;
    },

    outputOctal: function(a, b, c){
        a -= PDFTokenizer.Numeric.zero;
        b -= PDFTokenizer.Numeric.zero;
        c -= PDFTokenizer.Numeric.zero;
        return a * 64 + b * 8 + c;
    },

    outputByte: function(escapedByte){
        switch (escapedByte){
            case PDFTokenizer.StringEscape.reverseSolidus:
                return PDFTokenizer.StringEscape.reverseSolidus;
            case PDFTokenizer.StringEscape.lineFeed:
                return PDFTokenizer.Whitespace.lineFeed;
            case PDFTokenizer.StringEscape.carriageReturn:
                return PDFTokenizer.Whitespace.carriageReturn;
            case PDFTokenizer.StringEscape.horizontalTab:
                return PDFTokenizer.Whitespace.horizontalTab;
            case PDFTokenizer.StringEscape.backspace:
                return 0x08;
            case PDFTokenizer.StringEscape.formFeed:
                return PDFTokenizer.Whitespace.formFeed;
            case PDFTokenizer.StringEscape.leftParenthesis:
                return PDFTokenizer.StringEscape.leftParenthesis;
            case PDFTokenizer.StringEscape.rightParenthesis:
                return PDFTokenizer.StringEscape.rightParenthesis;
            default:
                return escapedByte;
        }
    }
};

PDFTokenizer.Hexadecimal = {
    A: 0x41,
    F: 0x46,
    a: 0x61,
    f: 0x66,

    isHexadecimal: function(byte){
        return byte !== null && (
            (byte >= PDFTokenizer.Numeric.zero && byte <= PDFTokenizer.Numeric.nine) ||
            (byte >= PDFTokenizer.Hexadecimal.A && byte <= PDFTokenizer.Hexadecimal.F) ||
            (byte >= PDFTokenizer.Hexadecimal.a && byte <= PDFTokenizer.Hexadecimal.f)
        );
    },

    outputHexadecimal: function(a, b){
        return PDFTokenizer.Hexadecimal._factor(a) * 16 + PDFTokenizer.Hexadecimal._factor(b);
    },

    _factor: function(byte){
        if (byte >= PDFTokenizer.Numeric.zero && byte <= PDFTokenizer.Numeric.nine){
            return byte - PDFTokenizer.Numeric.zero;
        }
        if (byte >= PDFTokenizer.Hexadecimal.A && byte <= PDFTokenizer.Hexadecimal.F){
            return byte - PDFTokenizer.Hexadecimal.A + 10;
        }
        return byte - PDFTokenizer.Hexadecimal.a + 10;
    }
};

PDFTokenizer.NameEscape = {
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

    // Similarly, Resources don't have a specified type, but can be identified by its properties
    if (('ExtGState' in dict) || ('ColorSpace' in dict) || ('Pattern' in dict) || ('Shading' in dict) || ('XObject' in dict) || ('Font' in dict) || ('ProcSet' in dict) || ('Properties' in dict)){
        return PDFResourcesObject;
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
    PDFFontDescriptorObject,
    PDFImageObject,
];
var i, l;
for (i = 0, l = types.length; i < l; ++i){
    PDFObjectClassesByType[types[i].prototype.Type] = types[i];
}
for (i = 0, l = typesWithSubtypes.length; i < l; ++i){
    if (!(typesWithSubtypes[i].prototype.Type in PDFObjectClassesBySubtype)){
        PDFObjectClassesBySubtype[typesWithSubtypes[i].prototype.Type] = {};
    }
    PDFObjectClassesBySubtype[typesWithSubtypes[i].prototype.Type][[typesWithSubtypes[i].prototype.Subtype]] = typesWithSubtypes[i];
}

})();