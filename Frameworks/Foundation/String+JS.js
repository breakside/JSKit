// #import "Foundation/CoreTypes.js"
// #import "Foundation/UnicodeChar.js"
// #import "Foundation/JSData.js"
/* global UnicodeChar, JSRange, JSData */
'use strict';

(function(){

var base64DecodingMap = [
//     0     1     2     3     4     5     6     7     8     9     A     B     C     D     E     F
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC1, 0xC1, 0xC1, 0xC1, 0xC1, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC1, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0x3E, 0xC0, 0xC0, 0xC0, 0x3F,
    0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0xC0, 0xC0, 0xC0, 0xC1, 0xC0, 0xC0,
    0xC0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,
    0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0
];

Object.defineProperties(String, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a String

    initWithFormat: {
        enumerable: false,
        value: function String_initWithFormat(format){
            var args = Array.prototype.splice.call(arguments, 1);
            return format.sprintf.apply(format, args);
        }
    },

    initWithData: {
        enumerable: false,
        value: function String_initWithData(data, encoding){
            if (data === null){
                return null;
            }
            if (encoding == String.Encoding.utf8){
                return data.stringByDecodingUTF8();
            }
            if (encoding == String.Encoding.utf16be){
                return data.stringByDecodingUTF16BE();
            }
            if (encoding == String.Encoding.utf16le){
                return data.stringByDecodingUTF16LE();
            }
            if (encoding == String.Encoding.latin1){
                return data.stringByDecodingLatin1();
            }
            throw new Error("Unsupported encoding: %s".sprintf(encoding));
        }
    },

    fromUnicode: {
        enumerable: false,
        value: function String_fromUnicode(code){
            if (code instanceof UnicodeChar){
                code = code.code;
            }
            if (code < 0x10000){
                return String.fromCharCode(code);
            }
            var u = code - 0x10000;
            var A = 0xD800 | ((u >> 10) & 0x3FF);
            var B = 0xDC00 | (u & 0x3FF);
            return String.fromCharCode(A) + String.fromCharCode(B);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - String Encodings

    Encoding: {
        enumerable: false,
        configurable: false,
        value: {
            utf8: "utf8",
            utf16be: "utf16be",
            utf16le: "utf16le",
            iso8859_1: "iso8859-1",
            latin1: "iso8859-1"
        }
    }

});

Object.defineProperties(String.prototype, {

    // -------------------------------------------------------------------------
    // MARK: - Accessing Characters & Words

    unicodeIterator: {
        enumerable: false,
        value: function String_unicodeIterator(startIndex){
            if (startIndex === undefined){
                startIndex = 0;
            }
            return new UnicodeIterator(this, startIndex);
        }
    },

    userPerceivedCharacterIterator: {
        enumerable: false,
        value: function String_userPerceivedCharacterIterator(startIndex){
            if (startIndex === undefined){
                startIndex = 0;
            }
            return new UserPerceivedCharacterIterator(this, startIndex);
        }
    },

    unicodeAtIndex: {
        enumerable: false,
        value: function String_unicodeAtIndex(index){
            if (index < 0 || index >= this.length){
                throw new Error("String index %d out of range [0, %d]".sprintf(index, this.length - 1));
            }
            var iterator = UnicodeIterator(this, index);
            return iterator.character;
        }
    },

    rangeForUserPerceivedCharacterAtIndex: {
        enumerable: false,
        value: function String_rangeForUserPerceivedCharacterAtIndex(index){
            if (index >= this.length){
                return JSRange(this.length, 0);
            }
            var iterator = this.userPerceivedCharacterIterator(index);
            return iterator.range;
        }
    },

    rangeForWordAtIndex: {
        enumerable: false,
        value: function String_rangeForWordAtIndex(index){
            if (index > 0 && index >= this.length){
                index -= 1;
            }
            var iterator = UnicodeIterator(this, index);
            var startIndex = iterator.index;
            var endIndex = iterator.nextIndex;
            while (!iterator.isWordBoundary){
                iterator.decrement();
                startIndex = iterator.index;
            }
            iterator = UnicodeIterator(this, endIndex);
            while (!iterator.isWordBoundary){
                iterator.increment();
                endIndex = iterator.index;
            }
            return JSRange(startIndex, endIndex - startIndex);
        }
    },

    stringForWordAtIndex: {
        enumerable: false,
        value: function String_stringForWordAtIndex(index){
            var range = this.rangeForWordAtIndex(index);
            return this.substringInRange(range);
        }
    },

    indexOfWordEndAfterIndex: {
        enumerable: false,
        value: function String_indexOfNextWordFromIndex(index){
            var range = JSRange(index, 0);
            while (range.end < this.length && !this._isWordLikeRange(range)){
                range = this.rangeForWordAtIndex(range.end);
            }
            return range.end;
        }
    },

    indexOfWordStartBeforeIndex: {
        enumerable: false,
        value: function String_indexOfPreviousWordFromIndex(index){
            var range = JSRange(index, 0);
            while (range.location > 0 && !this._isWordLikeRange(range)){
                range = this.rangeForWordAtIndex(range.location - 1);
            }
            return range.location;
        }
    },

    _isWordLikeRange: {
        enumerable: false,
        value: function String_isWhitespaceRange(range){
            var iterator = this.unicodeIterator(range.location);
            while (iterator.index < range.end){
                if (iterator.character.wordBreakAHLetter || iterator.character.wordBreakNumeric){
                    return true;
                }
                iterator.increment();
            }
            return false;
        }
    },

    rangeForLineAtIndex: {
        enumerable: false,
        value: function String_rangeForLineAtIndex(index){
            var iterator1 = this.userPerceivedCharacterIterator(index);
            var startIndex = iterator1.range.location;
            var iterator2 = UserPerceivedCharacterIterator(iterator1);
            iterator1.decrement();
            while (!iterator1.isMandatoryLineBreak){
                startIndex = iterator1.range.location;
                iterator1.decrement();
            }
            while (!iterator2.isMandatoryLineBreak){
                iterator2.increment();
            }
            var endIndex = iterator2.range.end;
            return JSRange(startIndex, endIndex - startIndex);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Changing a String

    stringByAppendingString: {
        enumerable: false,
        value: function String_stringByAppendingString(string){
            return this.stringByReplacingCharactersInRangeWithString(JSRange(this.length, 0), string);
        }
    },

    stringByReplacingCharactersInRangeWithString: {
        enumerable: false,
        value: function String_stringByReplacingCharactersInRangeWithString(range, string){
            var i, l;
            var indexPair;
            if (string.length > 0){
                if (range.location >= this.length){
                    return this + string;
                }
                return this.substr(0, range.location) + string + this.substr(range.end);
            }
            return this.stringByDeletingCharactersInRange(range);
        }
    },

    stringByDeletingCharactersInRange: {
        enumerable: false,
        value: function String_stringByDeletingCharactersInRange(range){
            if (range.length > 0){
                return this.substr(0, range.location) + this.substr(range.end);
            }
            return this;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Substrings & Variants

    substringInRange: {
        enumerable: false,
        value: function String_substringInRange(range){
            return this.substr(range.location, range.length);
        }
    },

    uppercaseString: {
        enumerable: false,
        value: function String_uppercaseString(){
            return this.toUpperCase();
        }
    },

    lowercaseString: {
        enumerable: false,
        value: function String_lowercaseString(){
            return this.toLowerCase();
        }
    },

    trimmedSplit: {
        enumerable: false,
        value: function String_trimmedSplit(splitOn){
            var parts = this.split(splitOn);
            for (var i = 0, l = parts.length; i < l; ++i){
                parts[i] = parts[i].trim();
            }
            return parts;
        }
    },

    splitAtIndex: {
        enumerable: false,
        value: function String_splitAtIndex(index){
            return [this.substr(0, index), this.substr(index)];
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Encoding

    utf8: {
        enumerable: false,
        value: function String_utf8(){
            // TODO: use TextEncoder if available
            var utf8 = JSData.initWithLength(this.length * 4);
            var c;
            var j = 0;
            var iterator = UnicodeIterator(this, 0);
            while (iterator.index < this.length){
                c = iterator.character.code;
                if (c < 0x80){
                    utf8[j] = c;
                    j += 1;
                }else if (c < 0x800){
                    utf8[j] = 0xC0 | (c >>> 6);
                    utf8[j + 1] = 0x80 | (c & 0x3F);
                    j += 2;
                }else if (c < 0x10000){
                    utf8[j] = 0xE0 | (c >>> 12);
                    utf8[j + 1] = 0x80 | ((c >>> 6) & 0x3F);
                    utf8[j + 2] = 0x80 | (c & 0x3F);
                    j += 3;
                }else if (c < 0x400000){
                    utf8[j] = 0xF0 | (c >>> 18);
                    utf8[j + 1] = 0x80 | ((c >>> 12) & 0x3F);
                    utf8[j + 2] = 0x80 | ((c >>> 6) & 0x3F);
                    utf8[j + 3] = 0x80 | (c & 0x3F);
                    j += 4;
                }
                iterator.increment();
            }
            return utf8.truncatedToLength(j);
        }
    },

    latin1: {
        enumerable: false,
        value: function String_latin1(){
            var bytes = JSData.initWithLength(this.length);
            var c;
            var iterator = UnicodeIterator(this, 0);
            var i = 0;
            while (iterator.index < this.length){
                c = iterator.character.code;
                if (c > 0xFF){
                    throw new Error("Cannot encode byte %d at index %d to iso-8859-1".sprintf(c, iterator.index));
                }
                bytes[i++] = c;
                iterator.increment();
            }
            return bytes;
        }
    },

    dataUsingEncoding: {
        enumerable: false,
        value: function String_dataUsingEncoding(encoding){
            if (encoding == String.Encoding.utf8){
                return this.utf8();
            }
            if (encoding == String.Encoding.latin1){
                return this.latin1();
            }
            return null;
        }
    },

    dataByDecodingBase64: {
        enumerable: false,
        value: function String_dataByDecodingBase64(){
            var group = new Uint32Array(1);
            var bytes = JSData.initWithLength(this.length * 3 / 4);
            var offset = 0;
            var decoded;
            var remaining = 4;
            for (var i = 0, l = this.length; i < l; ++i){
                decoded = base64DecodingMap[this.charCodeAt(i)];
                if (decoded == 0xC0){
                    throw new Error("Invalid input byte in base64 at %d: %#02x".sprintf(i, this.charCodeAt(i)));
                }
                if (decoded != 0xC1){
                    group[0] = (group[0] << 6) | decoded;
                    --remaining;
                    if (remaining === 0){
                        bytes[offset++] = (group[0] >> 16) & 0xFF;
                        bytes[offset++] = (group[0] >> 8) & 0xFF;
                        bytes[offset++] = group[0] & 0xFF;
                        remaining = 4;
                        group[0] = 0;
                    }
                }
            }
            if (remaining == 2){
                bytes[offset++] = (group[0] >> 4) & 0xFF;
            }else if (remaining == 1){
                bytes[offset++] = (group[0] >> 10) & 0xFF;
                bytes[offset++] = (group[0] >> 2) & 0xFF;
            }else if (remaining == 3){
                throw new Error("Expecting more input for base64 decode");
            }
            return bytes.truncatedToLength(offset);
        }
    },

    dataByDecodingHex: {
        value: function String_dataByDecodingHex(){
            var data = JSData.initWithLength(Math.ceil(this.length / 2));
            var o = 0;
            var b;
            for (var i = 0, l = this.length; i < l; i += 2, ++o){
                b = parseInt(this.substr(i, 2), 16);
                if (!isNaN(b)){
                    data[o] = b;
                }
            }
            return data;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Formatting

    format: {
        enumerable: false,
        value: function String_format(formatter, args){
            var formatted = "";
            var formatting = false;
            var using_numbered_args = false;
            var found_first_format = false;
            var arg;
            var sub;
            var index;
            var uppercase;
            var options = {
                width: null,
                precision: null
            };
            for (var i = 0, l = this.length; i < l; ++i){
                var c = this[i];
                if (formatting){
                    if (c == '%'){
                        formatted += c;
                    }else{
                        if (using_numbered_args){
                            sub = '';
                            while (c != '$'){
                                sub += c;
                                ++i;
                                if (i >= l){
                                    throw new Error("Invalid format string, unexpected end: " + this);
                                }
                                c = this[i];
                                if ((c < '0' || c > '9') && c != '$'){
                                    throw new Error("Invalid format string, invalid arg index char: " + c + "; " + this);
                                }
                            }
                            index = parseInt(sub, 10) - 1;
                            if (index < 0 || index >= args.length){
                                throw new Error("Invalid format string, unknown arg index: " + index + "; " + this);
                            }
                            arg = args[index];
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + this);
                            }
                            c = this[i];
                        }else{
                            if (args.length === 0){
                                throw new Error("Invalid format string, not enough arguments: " + this);
                            }
                            arg = args.shift();
                        }
                        options.width = null;
                        options.precision = null;
                        if (formatter.flag_map){
                            for (var f in formatter.flag_map){
                                options[formatter.flag_map[f]] = false;
                            }
                            while (c in formatter.flag_map){
                                options[formatter.flag_map[c]] = true;
                                ++i;
                                if (i >= l){
                                    throw new Error("Invalid format string, unexpected end: " + this);
                                }
                                c = this[i];
                            }
                        }
                        if (c >= '1' && c <= '9'){
                            sub = '';
                            do {
                                sub += c;
                                ++i;
                                if (i >= l){
                                    throw new Error("Invalid format string, unexpected end: " + this);
                                }
                                c = this[i];
                            } while (c >= '0' && c <= '9');
                            options.width = parseInt(sub, 10);
                        }
                        if (c == '.'){
                            options.precision = 0;
                            sub = '';
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + this);
                            }
                            c = this[i];
                            while (c >= '0' && c <= '9') {
                                sub += c;
                                ++i;
                                if (i >= l){
                                    throw new Error("Invalid format string, unexpected end: " + this);
                                }
                                c = this[i];
                            }
                            if (sub.length){
                                options.precision = parseInt(sub, 10);
                            }
                        }
                        var format = c;
                        if (c == '{'){
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + this);
                            }
                            c = this[i];
                            format = '';
                            while (c != '}' && i < l){
                                format += c;
                                ++i;
                                c = this[i];
                            }
                            if (c !== '}'){
                                throw new Error("Invalid format string, unexpected end: " + this);
                            }
                        }
                        if (format in formatter){
                            formatted += formatter[format](arg, options);
                        }else{
                            throw new Error("Invalid format string, unknown conversion specifier: " + c + "; " + this);
                        }
                    }
                    formatting = false;
                }else{
                    switch (c){
                        case '%':
                            formatting = true;
                            if (!found_first_format){
                                found_first_format = true;
                                using_numbered_args = this.substr(i + 1, 5).match(/^[1-9][0-9]*\$/);
                            }
                            break;
                        default:
                            formatted += c;
                            break;
                    }
                }
            }
            if (!using_numbered_args && args.length){
                throw new Error("Invalid format string, unused arguments: " + this);
            }
            return formatted;
        }
    },

    sprintf: {
        enumerable: false,
        value: function String_sprintf(){
            return this.format.call(this, String.printf_formatter, Array.prototype.slice.call(arguments));
        }
    },

    leftPaddedString: {
        enumerable: false,
        value: function String_leftPaddedString(pad_char, width){
            var padded = '';
            var chars = Math.max(0, width - this.length);
            for (var i = 0; i < chars; ++i){
                padded += pad_char;
            }
            padded += this;
            return padded;
        }
    },

    rightPaddedString: {
        enumerable: false,
        value: function String_rightPaddedString(pad_char, width){
            var padded = this;
            var chars = Math.max(0, width - this.length);
            for (var i = 0; i < chars; ++i){
                padded += pad_char;
            }
            return padded;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Utilities

    parseNumberArray: {
        enumerable: false,
        value: function String_parseNumberArray(){
            var input = this.split(',');
            var output = [];
            var s;
            for (var i = 0, l = input.length; i < l; ++i){
                try{
                    s = parseFloat(input[i].trim());
                    output.push(s);
                }catch (e){
                }
            }
            return output;
        }
    },

    ucFirst: {
        enumerable: false,
        value: function String_ucFirst(){
            var iterator = this.userPerceivedCharacterIterator();
            return this.substr(0, iterator.range.length).toUpperCase() + this.substr(iterator.range.length);
        }
    },

    stringByMaskingWithCharacter: {
        value: function String_stringByMaskingWithCharacter(mask, userPerceived){
            var masked = "";
            if (userPerceived){
                var iterator = this.userPerceivedCharacterIterator();
                while (iterator.firstCharacter !== null){
                    masked += mask;
                    iterator.increment();
                }
            }else{
                for (var i = 0, l = this.length; i < l; ++i){
                    masked += mask;
                }
            }
            return masked;
        }
    },

    fileExtension: {
        get: function String_getFileExtension(){
            var index = this.lastIndexOf('.');
            if (index > 0){
                return this.substr(index);
            }
            return '';
        }
    },

    replacingTemplateParameters: {
        value: function String_replacingTemplateParameters(parameters, open, close){
            if (open === undefined){
                open = "{{";
            }
            if (close === undefined){
                if (open == "${"){
                    close = "}";
                }else{
                    close = "}}";
                }
            }
            var replaced = "";
            var index = 0;
            var openIndex = this.indexOf(open, index);
            var closeIndex;
            var nextOpenIndex;
            var name;
            while (openIndex >= 0){
                closeIndex = this.indexOf(close, openIndex + open.length);
                nextOpenIndex = this.indexOf(open, openIndex + open.length);
                if (closeIndex < 0 && nextOpenIndex < 0){
                    // no closing or next opening, we're done
                    break;
                }
                if (closeIndex >= 0 && (nextOpenIndex < 0 || nextOpenIndex > closeIndex)){
                    // we have a closing, and it comes before the next opening
                    name = this.substr(openIndex + open.length, closeIndex - openIndex - open.length);
                    if (name in parameters){
                        // we have a match
                        replaced += this.substr(index, openIndex - index);
                        replaced += parameters[name];
                        index = closeIndex + close.length;
                    }
                }
                openIndex = nextOpenIndex;
            }
            if (index === 0){
                return this;
            }
            replaced += this.substr(index);
            return replaced;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Private helpers for finding word and character breaks

    isWordBoundary: {
        enumerable: false,
        value: function String_isWordBoundary(index){
            // See http://www.unicode.org/reports/tr29/

            var iterator = UnicodeIterator(this, index);

            // WB1: sot ÷
            if (iterator.index <= 0){
                return true;
            }
            // WB1: ÷ eot
            if (iterator.index === this.length){
                return true;
            }

            var c2 = iterator.character;
            iterator.decrement();
            var c1 = iterator.character;
            var c3 = null;
            var c0 = null;
            // WB3: CR × LF
            if (c1.wordBreakCR && c2.wordBreakLF){
                return false;
            }
            // WB3a: (Newline | CR | LF) ÷
            if (c1.wordBreakCR || c1.wordBreakLF || c1.wordBreakNewline){
                return true;
            }
            // WB3b: ÷ (Newline | CR | LF)
            if (c2.wordBreakCR || c2.wordBreakLF || c2.wordBreakNewline){
                return true;
            }

            // WB4: X (Extend | Format)* → X
            // ...the same as Any × (Format | Extend)
            if (c2.wordBreakFormat || c2.wordBreakExtend){
                return false;
            }
            while (iterator.index > 0 && (c1.wordBreakFormat || c1.wordBreakExtend)){
                iterator.decrement();
                c1 = iterator.character;
            }
            if (iterator.index > 0){
                iterator.decrement();
                c0 = iterator.character;
                while (iterator.index > 0 && (c0.wordBreakFormat || c0.wordBreakExtend)){
                    iterator.decrement();
                    c0 = iterator.character;
                }
            }

            // WB5: AHLetter × AHLetter
            if (c1.wordBreakAHLetter && c2.wordBreakAHLetter){
                return false;
            }
            // WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
            iterator = UnicodeIterator(this, index);
            if (iterator.index < this.length){
                iterator.increment();
                c3 = iterator.character;
            }
            if (c3 !== null && c1.wordBreakAHLetter && (c2.wordBreakMidLetter || c2.wordBreakMidNumLetQ) && c3.wordBreakAHLetter){
                return false;
            }
            // WB7: AHLetter (MidLetter | MidNumLetQ) × AHLetter
            if (c0 !== null && c0.wordBreakAHLetter && (c1.wordBreakMidLetter || c1.wordBreakMidNumLetQ) && c2.wordBreakAHLetter){
                return false;
            }
            // WB7a: Hebrew_Letter × Single_Quote
            if (c1.wordBreakHebrewLetter && c2.wordBreakSingleQuote){
                return false;
            }
            // WB7b: Hebrew_Letter × Double_Quote Hebrew_Letter
            if (c3 !== null && c1.wordBreakHebrewLetter && c2.wordBreakDoubleQuote && c3.wordBreakHebrewLetter){
                return false;
            }
            // WB7c: Hebrew_Letter Double_Quote × Hebrew_Letter
            if (c0 !== null && c0.wordBreakHebrewLetter && c1.wordBreakDoubleQuote && c2.wordBreakHebrewLetter){
                return false;
            }
            // WB8: Numeric × Numeric
            if (c1.wordBreakNumeric && c2.wordBreakNumeric){
                return false;
            }
            // WB9: AHLetter × Numeric
            if (c1.wordBreakAHLetter && c2.wordBreakNumeric){
                return false;
            }
            // WB10: Numeric × AHLetter
            if (c1.wordBreakNumeric && c2.wordBreakAHLetter){
                return false;
            }
            // WB11: Numeric (MidNum | MidNumLetQ) × Numeric
            if (c0 !== null && c0.wordBreakNumeric && (c1.wordBreakMidNum || c1.wordBreakMidNumLetQ) && c2.wordBreakNumeric){
                return false;
            }
            // WB12: Numeric × (MidNum | MidNumLetQ) Numeric
            if (c3 !== null && c1.wordBreakNumeric && (c2.wordBreakMidNum || c2.wordBreakMidNumLetQ) && c3.wordBreakNumeric){
                return false;
            }
            // WB13: Katakana × Katakana
            if (c1.wordBreakKatakana && c2.wordBreakKatakana){
                return false;
            }
            // WB13a: (AHLetter | Numeric | Katakana | ExtendNumLet) × ExtendNumLet
            if ((c1.wordBreakAHLetter || c1.wordBreakNumeric || c1.wordBreakKatakana || c1.wordBreakExtendNumLet) && c2.wordBreakExtendNumLet){
                return false;
            }
            // WB13b: ExtendNumLet × (AHLetter | Numeric | Katakana)
            if (c1.wordBreakExtendNumLet && (c2.wordBreakAHLetter || c2.wordBreakNumeric || c2.wordBreakKatakana)){
                return false;
            }
            // WB13c: Regional_Indicator × Regional_Indicator
            if (c1.wordBreakRegionalIndicator && c2.wordBreakRegionalIndicator){
                return false;
            }
            // Custom: space × space
            // FIXME: Use all whitespace characters, not just 0x20
            if (c1.code == 0x20 && c2.code == 0x20){
                return false;
            }
            // WB14: Any ÷ Any
            return true;
        }
    }

});

Object.defineProperties(String, {

    isGraphemeClusterBoundary: {
        enumerable: false,
        value: function String_isGraphemeClusterBoundary(c1, c2){
            if (c1 === null || c2 === null){
                return true;
            }
            // GB3: CR × LF
            if (c1.graphemeClusterBreakCR && c2.graphemeClusterBreakLF){
                return false;
            }
            // GB4: ( Control | CR | LF ) ÷
            if (c1.graphemeClusterBreakControl || c1.graphemeClusterBreakCR || c1.graphemeClusterBreakLF){
                return true;
            }
            // GB5:  ÷ ( Control | CR | LF )
            if (c2.graphemeClusterBreakControl || c2.graphemeClusterBreakCR || c2.graphemeClusterBreakLF){
                return true;
            }
            // GB6: L × ( L | V | LV | LVT )
            if (c1.graphemeClusterBreakL && (c2.graphemeClusterBreakL || c2.graphemeClusterBreakV || c2.graphemeClusterBreakLV || c2.graphemeClusterBreakLVT)){
                return false;
            }
            // GB7: ( LV | V ) × ( V | T )
            if ((c1.graphemeClusterBreakLV || c1.graphemeClusterBreakV) && (c2.graphemeClusterBreakV || c2.graphemeClusterBreakT)){
                return false;
            }
            // GB8: ( LVT | T) × T
            if ((c1.graphemeClusterBreakLVT || c1.graphemeClusterBreakT) && c2.graphemeClusterBreakT){
                return false;
            }
            // GB8a: Regional_Indicator × Regional_Indicator
            if (c1.graphemeClusterBreakRegionalIndicator && c2.graphemeClusterBreakRegionalIndicator){
                return false;
            }
            // GB9: × Extend
            if (c2.graphemeClusterBreakExtend){
                return false;
            }
            // GB9a: × SpacingMark
            if (c2.graphemeClusterBreakSpacingMark){
                return false;
            }
            // GB9b: Prepend ×
            if (c1.graphemeClusterBreakPrepend){
                return false;
            }
            // GB10: Any ÷ Any
            return true;
        }
    }
});

var UnicodeIterator = function(str, index){
    if (this === undefined){
        return new UnicodeIterator(str, index);
    }
    if (str instanceof UnicodeIterator){
        this._string = str._string;
        this._index = str._index;
        this._nextIndex = str._nextIndex;
        this._character = str._character;
    }else{
        this._string = str;
        this._index = index;
        this._update();
    }
};

Object.defineProperties(UnicodeIterator.prototype, {

    _string: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null,
    },

    _index: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: 0
    },

    _nextIndex: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: 0
    },

    _character: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
    },

    _update: {
        enumerable: false,
        configurable: false,
        value: function UnicodeIterator_update(){
            // TODO: use String.codePointAt
            if (this._index < 0){
                this._index = -1;
                this._nextIndex = 0;
                this._character = null;
            }else if(this._index >= this._string.length){
                this._index = this._string.length;
                this._nextIndex = this._string.length;
                this._character = null;
            }else{
                var A = this._string.charCodeAt(this._index);
                var B = 0;
                var code = 0;
                this._nextIndex = this._index + 1;
                if (A >= 0xD800 && A < 0xDC00){
                    if (this._index < this._string.length - 1){
                        B = this._string.charCodeAt(this._index + 1);
                        if (B >= 0xDC00 && B < 0xE000){
                            code = (((A & 0x3FF) << 10) | (B & 0x3FF)) + 0x10000;
                            this._character = UnicodeChar(code);
                            ++this._nextIndex;
                        }else{
                            this._character = UnicodeChar(0xFFFD);
                        }
                    }else{
                        this._character = UnicodeChar(0xFFFD);
                    }
                }else if (A >= 0xDC00 && A < 0xE000){
                    if (this._index > 0){
                        B = A;
                        A = this._string.charCodeAt(this._index - 1);
                        if (A >= 0xD800 && A < 0xDC00){
                            --this._index;
                            code = (((A & 0x3FF) << 10) | (B & 0x3FF)) + 0x10000;
                            this._character = UnicodeChar(code);
                        }else{
                            this._character = UnicodeChar(0xFFFD);
                        }
                    }else{
                        this._character = UnicodeChar(0xFFFD);
                    }
                }else{
                    this._character = UnicodeChar(A);
                }
            }

        }
    },

    index: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_getIndex(){
            return this._index;
        }
    },

    nextIndex: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_getNextIndex(){
            return this._nextIndex;
        }
    },

    character: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_getCharacter(){
            return this._character;
        }
    },

    increment: {
        enumerable: true,
        configurable: false,
        value: function UnicodeIterator_increment(){
            this._index = this._nextIndex;
            this._update();
            return this;
        }
    },

    decrement: {
        enumerable: true,
        configurable: false,
        value: function UnicodeIterator_decrement(){
            this._index -= 1;
            this._update();
            return this;
        }
    },

    isWordBoundary: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_isWordBoundary(){
            return this._string.isWordBoundary(this.index);
        }
    },

    isWhiteSpace: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_isWhiteSpace(){
            return this.character !== null && (this.character.code == 0x20 || this.character.code == 0x0A || this.character.code == 0x0B || this.character.code == 0x0C || this.character.code == 0x0D);
            // TODO: consider other whitespace
        }
    }

});

var UserPerceivedCharacterIterator = function(str, index){
    if (this === undefined){
        return new UserPerceivedCharacterIterator(str, index);
    }
    if (str instanceof UserPerceivedCharacterIterator){
        this._unicodeIterator = new UnicodeIterator(str._unicodeIterator);
        this._nextUnicodeIterator = new UnicodeIterator(str._nextUnicodeIterator);
    }else{
        this._unicodeIterator = new UnicodeIterator(str, index);
        this._nextUnicodeIterator = new UnicodeIterator(this._unicodeIterator);
        var c1 = null;
        var c2 = this._unicodeIterator.character;
        do {
            c1 = c2;
            this._nextUnicodeIterator.increment();
            c2 = this._nextUnicodeIterator.character;
        } while (!String.isGraphemeClusterBoundary(c1, c2));
        c1 = this._unicodeIterator.character;
        c2 = null;
        do {
            c2 = c1;
            this._unicodeIterator.decrement();
            c1 = this._unicodeIterator.character;
        } while (!String.isGraphemeClusterBoundary(c1, c2));
        this._unicodeIterator.increment();
    }
};

Object.defineProperties(UserPerceivedCharacterIterator.prototype, {

    _unicodeIterator: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
    },

    _nextUnicodeIterator: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
    },

    index: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_getIndex(){
            return this._unicodeIterator._index;
        }
    },

    nextIndex: {
        enumerable: true,
        configurable: false,
        get: function UnicodeIterator_getNextIndex(){
            return this._nextUnicodeIterator._index;
        }
    },

    range: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_range(){
            return new JSRange(this.index, this.nextIndex - this.index);
        }
    },

    utf16: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_utf16(){
            return this._unicodeIterator._string.substringInRange(this.range);
        }
    },

    firstCharacter: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_firstCharacter(){
            return this._unicodeIterator._character;
        }
    },

    increment: {
        enumerable: true,
        configurable: false,
        value: function UserPerceivedCharacterIterator_increment(){
            this._unicodeIterator = UnicodeIterator(this._nextUnicodeIterator);
            var c1 = null;
            var c2 = this._unicodeIterator.character;
            do {
                c1 = c2;
                this._nextUnicodeIterator.increment();
                c2 = this._nextUnicodeIterator.character;
            } while (!String.isGraphemeClusterBoundary(c1, c2));
            return this;
        }
    },

    decrement: {
        enumerable: true,
        configurable: false,
        value: function UserPerceivedCharacterIterator_decrement(){
            if (this._unicodeIterator.index >= 0){
                this._nextUnicodeIterator = UnicodeIterator(this._unicodeIterator);
                this._unicodeIterator.decrement();
                if (this._unicodeIterator.index >= 0){
                    var c2 = null;
                    var c1 = this._unicodeIterator.character;
                    do {
                        c2 = c1;
                        this._unicodeIterator.decrement();
                        c1 = this._unicodeIterator.character;
                    } while (!String.isGraphemeClusterBoundary(c1, c2));
                    this._unicodeIterator.increment();
                }
            }
            return this;
        }
    },

    isWordBoundary: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_isWordBoundary(){
            return this._unicodeIterator.isWordBoundary;
        }
    },

    isWhiteSpace: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_isWhiteSpace(){
            return this._unicodeIterator.isWhiteSpace;
        }
    },

    isMandatoryLineBreak: {
        enumerable: true,
        configurable: false,
        get: function UserPerceivedCharacterIterator_isMandatoryLineBreak(){
            if (this._unicodeIterator.character === null){
                return true;
            }
            // Note that even though we're only checking the first character,
            // it will match the multi-char CRLF sequence, which is considered
            // to be a single user perceived character.  In this case, only
            // the CR is checked, but since no other user perceived character
            // can start with CR, we know the second character must be LF.
            return this._unicodeIterator.character.isLineBreak;
        }
    }

});

String.printf_formatter = {

    flag_map: {
        "'": 'thousands',
        '-': 'left_justified',
        '+': 'signed',
        '#': 'alternate',
        '0': 'zero'
    },

    d: function(arg, options){
        var str = Math.floor(arg).toString(10);
        // TODO: obey any other options
        if (options.width){
            if (options.zero){
                str = str.leftPaddedString('0', options.width);
            }else if (options.left_justified){
                str = str.rightPaddedString(' ', options.width);
            }else{
                str = str.leftPaddedString(' ', options.width);
            }
        }
        return str;
    },

    x: function(arg, options){
        // TODO: obey any other options
        var str = arg.toString(16);
        if (options.width){
            if (options.zero){
                str = str.leftPaddedString('0', options.width);
            }else if (options.left_justified){
                str = str.rightPaddedString(' ', options.width);
            }else{
                str = str.leftPaddedString(' ', options.width);
            }
        }
        if (options.uppercase){
            str = str.toUpperCase();
        }
        if (options.alternate){
            str = '0x' + str;
        }
        return str;
    },

    X: function(arg, options){
        options.uppercase = true;
        return this.x(arg, options);
    },

    s: function(arg, options){
        var str = (arg !== null && arg !== undefined && arg.toString) ? arg.toString() : arg;
        if (options.width){
            if (options.left_justified){
                str = str.rightPaddedString(' ', options.width);
            }else{
                str = str.leftPaddedString(' ', options.width);
            }
        }
        return str;
    },

    f: function(arg, options){
        // TODO: obey any other options
        if (Math.abs(arg) < 0.000001){
            arg = 0;
        }
        return (arg !== null && arg !== undefined && arg.toString) ? arg.toString() : arg;
    },

    b: function(arg, options){
        return arg ? 'true' : 'false';
    }
};

})();

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}

if (!String.fromCodePoint){
    String.fromCodePoint = function(){
        var code;
        var units = [];
        var u;
        for (var i = 0; i < arguments.length; ++i){
            code = arguments[i];
            if (code < 0x10000){
                units.push(code);
            }else{
                u = code - 0x10000;
                units.push(0xD800 | ((u >> 10) & 0x3FF));
                units.push(0xDC00 | (u & 0x3FF));
            }
        }
        return String.fromCharCode.apply(undefined, units);
    };
}