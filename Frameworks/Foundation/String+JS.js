// #import "Foundation/CoreTypes.js"
// #import "Foundation/UnicodeChar.js"
// #import "Foundation/JSData.js"
/* global UnicodeChar, JSRange, JSData */
'use strict';

(function(){

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
            if (encoding == String.Encoding.utf8){
                return data.bytes.stringByDecodingUTF8();
            }else{
                throw new Error("Unsupported encoding: %s".sprintf(encoding));
            }
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
            utf8: "utf8"
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

    indexOfNextWordFromIndex: {
        enumerable: false,
        value: function String_indexOfNextWordFromIndex(index){
            var range = this.rangeForWordAtIndex(index);
            index = range.end;
            var L = this.length;
            var word;
            var a, b;
            while (index < L){
                range = this.rangeForWordAtIndex(index);
                word = this.substringInRange(range);
                if (word.search(/[^\s]/) >= 0){
                    return index;
                }
                index = range.end;
            }
            return L;
        }
    },

    indexOfPreviousWordFromIndex: {
        enumerable: false,
        value: function String_indexOfPreviousWordFromIndex(index){
            var range = this.rangeForWordAtIndex(index);
            index = range.location - 1;
            var word;
            var a, b;
            while (index >= 0){
                range = this.rangeForWordAtIndex(index);
                word = this.substringInRange(range);
                if (word.search(/[^\s]/) >= 0){
                    return range.location;
                }
                index = range.location - 1;
            }
            return 0;
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

    // -------------------------------------------------------------------------
    // MARK: - Encoding

    utf8: {
        enumerable: false,
        value: function String_utf8(){
            // TODO: use TextEncoder if available
            var utf8 = new Uint8Array(this.length * 4);
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
            var bytes = new Uint8Array(utf8.buffer, utf8.byteOffset, j);
            return JSData.initWithBytes(bytes);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Formatting
    sprintf: {
        enumerable: false,
        value: function String_sprintf(){
            var formatted = "";
            var formatting = false;
            var using_numbered_args = false;
            var found_first_format = false;
            var args = Array.prototype.slice.call(arguments);
            var arg;
            var sub;
            var index;
            var flags = {};
            var width;
            var precision;
            var uppercase;
            var flag_map = {
                "'": 'thousands',
                '-': 'left_justified',
                '+': 'signed',
                ' ': 'space',
                '#': 'alternate',
                '0': 'zero'
            };
            for (var i = 0, l = this.length; i < l; ++i){
                var c = this[i];
                if (formatting){
                    if (c == '%'){
                        formatted += c;
                    }else{
                        if (using_numbered_args){
                            while (c != '$'){
                                sub += c;
                                ++i;
                                if (i >= l){
                                    throw new Error("Invalid format string, unexpected end: " + this);
                                }
                                c = this[i];
                                if (c < '0' || c > '9'){
                                    throw new Error("Invalid format string, invalid arg index char: " + c + "; " + this);
                                }
                            }
                            index = parseInt(sub, 10) - 1;
                            if (index < 0 || index >= args.length){
                                throw new Error("Invalid format string, unknown arg index: " + index + "; " + this);
                            }
                            arg = args[index];
                        }else{
                            if (args.length === 0){
                                throw new Error("Invalid format string, not enough arguments: " + this);
                            }
                            arg = args.shift();
                        }
                        flags = {};
                        while (c in flag_map){
                            flags[flag_map[c]] = true;
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + this);
                            }
                            c = this[i];
                        }
                        width = null;
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
                            width = parseInt(sub, 10);
                        }
                        precision = null;
                        if (c == '.'){
                            precision = 0;
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
                                precision = parseInt(sub, 10);
                            }
                        }
                        uppercase = false;
                        switch (c){
                            case 'd':
                                // TODO: obey any other flags
                                sub = arg.toString(10);
                                if (width){
                                    sub = sub.leftPaddedString('0', width);
                                }
                                formatted += sub;
                                break;
                            case 'X':
                                uppercase = true;
                                // intentional fallthrough
                            case 'x':
                                // TODO: obey any other flags
                                sub = arg.toString(16);
                                if (width){
                                    sub = sub.leftPaddedString('0', width);
                                }
                                if (uppercase){
                                    sub = sub.toUpperCase();
                                }
                                if (flags.alternate){
                                    sub = '0x' + sub;
                                }
                                formatted += sub;
                                break;
                            case 's':
                                // TODO: obey any flags
                                formatted += arg.toString ? arg.toString() : arg;
                                break;
                            case 'f':
                                if (Math.abs(arg) < 0.000001){
                                    arg = 0;
                                }
                                formatted += arg.toString ? arg.toString() : arg;
                                break;
                            default:
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
    }

});

var UserPerceivedCharacterIterator = function(str, index){
    if (this === undefined){
        return new UserPerceivedCharacterIterator(str, index);
    }
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
    }

});


})();

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}