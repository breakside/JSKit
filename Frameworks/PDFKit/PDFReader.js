// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
/* global JSClass, JSObject, PDFReader, JSData, PDFIndirectObject, PDFNameObject */
'use strict';

JSClass("PDFReader", JSObject, {

    offest: 0,
    length: 0,
    data: null,

    initWithData: function(data){
        this.data = data;
        this.length = data.length;
        this.offset = 0;
    },

    _readByte: function(){
        return this.data[this.offset++];
    },

    _backByte: function(){
        --this.offset;
    },

    _readObject: function(){
        var byte = this._readByte();
        if (byte === undefined){
            return undefined;
        }
        if (byte == PDFReader.Delimiters.solidus){
            return this._readNameObject();
        }
        if (byte == PDFReader.Delimiters.leftParenthesis){
            return this._readStringObject();
        }
        if (byte == PDFReader.Delimiters.lessThanSign){
            byte = this._readByte();
            if (byte == PDFReader.Delimiters.lessThanSign){
                return this._readDictionaryObject();
            }
            this.__backByte();
            return this._readHexadecimalStringObject();
        }
        if (byte == PDFReader.Delimiters.leftBracket){
            return this._readArrayObject();
        }
        if (byte == 't'){
            return this._readTrueObject();
        }
        if (byte == 'f'){
            return this._readFalseObject();
        }
        if (byte == 'n'){
            return this._readNullObject();
        }
        if (PDFReader.Numeric.isNumeric(byte)){
            return this._readNumberObject();
        }
        // TODO: stream objects
        // TODO: indirect objects
        // TODO: skip comments
    },

    _readNameObject: function(){
        // empty name is valid
        var byte = this._readByte();
        var data;
        var a, b;
        while (!PDFReader.Whitespace.isWhitespace(byte) && !PDFReader.Delimiters.isDelimiter(byte)){
            if (byte == PDFReader.NameEscape.numberSign){
                a = this._readByte();
                if (!PDFReader.Hexadecimal.isHexadecimal(a)){
                    throw this._newParseError("Expecting hex char", a);
                }
                b = this._readByte();
                if (!PDFReader.Hexadecimal.isHexadecimal(b)){
                    throw this._newParseError("Expecting hex char", b);
                }
                byte = PDFReader.Hexadecimal.ouputHexadecimal(a, b);
            }
            // TODO: add byte to data
        }
        this._backByte();
        // TODO: return name object
    },

    _readStringObject: function(){
        var openParenthesisCount = 0;
        var byte = this._readByte();
        var b, c;
        // TODO: convert CRLF to LF
        // TODO: ignore line endings immediately after \
        while (byte != PDFReader.Delimiters.rightParenthesis || openParenthesisCount > 0) {
            if (byte === undefined){
                throw this._newParseError("Expecting )");
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
                byte = this._readByte();
                if (byte === undefined){
                    throw this._newParseError("Expecting escape char");
                }
                if (PDFReader.StringEscape.isOctal(byte)){
                    // Octal escapes are always three bytes long
                    b = this._readByte();
                    if (!PDFReader.StringEscape.isOctal(b)){
                        throw this._newParseError("Expecting octal char", b);
                    }
                    c = this._readByte();
                    if (!PDFReader.StringEscape.isOctal(c)){
                        throw this._newParseError("Expecting octal char", c);
                    }
                    byte = PDFReader.StringEscape.outputOctal(byte, b, c);
                }else{
                    byte = PDFReader.StringEscape.outputByte(byte);
                }
            }
            // TODO: add to string
            byte = this._readByte();
        }
        // TODO: decode data to string using proper encoding
        return string;
    },

    _readHexadecimalStringObject: function(){
        var byte = this._readByte();
        // ignore whitespace
        // treat missing trailing digit as 0
        // TODO:
    },

    _readNumberObject: function(){
        // TODO:
    },

    _readTrueObject: function(){
        this._readLiteral(['r', 'u', 'e']);
        return true;
    },

    _readFalseObject: function(){
        this._readLiteral(['a', 'l', 's', 'e']);
        return false;
    },

    _readNullObject: function(){
        this._readLiteral(['u', 'l', 'l']);
        return null;
    },

    _readLiteral: function(expected){
        var x;
        var byte;
        for (var i = 0, l = expected.length; i < l; ++i){
            byte = this._readByte();
            x = expected[i].charCodeAt(0);
            if (byte !== x){
                throw this._newParseError("Expecting '%s'".sprintf(expected[i]), byte);
            }
        }
    },

    _readArrayObject: function(){
        var array = [];
        var byte = this._readByte();
        while (byte != PDFReader.Delimiters.rightBracket) {
            if (byte === undefined){
                throw this._newParseError("Expecting object or ]");
            }
            if (!PDFReader.isWhitespace(byte)){
                this._backByte();
                array.push(this._readObject());
            }
            byte = this._readByte();
        }
        return array;
    },

    _readDictionaryObject: function(cls){
        if (cls === undefined){
            cls = {};
        }else{
            cls = cls.prototype;
        }
        var byte = this._readByte();
        var key = null;
        var obj = null;
        var dict = Object.create(cls);
        while (byte != PDFReader.Delimiters.greaterThanSign){
            if (byte === undefined){
                throw this._newParseError("Expecting object or >>");
            }
            if (!PDFReader.isWhitespace(byte)){
                this._backByte();
                obj = this._readObject();
                if (obj === undefined){
                    throw this._newParseError("Expecting object");
                }
                if (key === null){
                    // TODO: verify that obj is a name object
                    key = obj;
                }else{
                    if (obj !== null){
                        dict[key.value] = obj;
                    }
                    key = null;
                }
            }
        }
        byte = this._readByte();
        if (byte != PDFReader.Delimiters.greaterThanSign){
            throw this._newParseError("Expecting >", byte);
        }
        if (key !== null){
            throw this._newParseError("Expecting object, got >>");
        }
        return dict;
    },

    _readWhitespace: function(){
        var byte = this._readByte();
        while (PDFReader.Whitespace.isWhitespace(byte)){
            byte = this._readByte();
        }
        if (byte !== undefined){
            this._backByte();
        }
    },

    _newParseError: function(message, byte){
        if (byte === undefined){
            return new Error("%s, got EOD: offset %08x".sprintf(this.offset));
        }
        return new Error("%s, got %02x: offset %08x".sprintf(this.offset, byte));
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
        return byte !== undefined && (
            byte == PDFReader.Whitespace.null || 
            byte == PDFReader.Whitespace.horizontalTab || 
            byte == PDFReader.Whitespace.lineFeed || 
            byte == PDFReader.Whitespace.formFeed || 
            byte == PDFReader.Whitespace.carriageReturn || 
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
        return byte !== undefined && (
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
        return byte !== undefined && (
            (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine) ||
            byte == PDFReader.Numeric.plus ||
            byte == PDFReader.Numeric.minus ||
            byte == PDFReader.Numeric.dot
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
        return byte !== undefined && byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.seven;
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
        return byte !== undefined && (
            (byte >= PDFReader.Numeric.zero && byte <= PDFReader.Numeric.nine) ||
            (byte >= PDFReader.Hexadecimal.A && byte <= PDFReader.Hexadecimal.F) ||
            (byte >= PDFReader.Hexadecimal.a && byte <= PDFReader.Hexadecimal.f)
        );
    },

    ouputHexadecimal: function(a, b){
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