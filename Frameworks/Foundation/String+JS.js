// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "CoreTypes.js"
// #import "UnicodeChar.js"
// #import "JSData.js"
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
    0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0
];

var base64URLDecodingMap = [
//     0     1     2     3     4     5     6     7     8     9     A     B     C     D     E     F
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC1, 0xC1, 0xC1, 0xC1, 0xC1, 0xC0, 0xC0,
    0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0,
    0xC1, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0, 0x3E, 0xC0, 0xC0,
    0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0xC0, 0xC0, 0xC0, 0xC1, 0xC0, 0xC0,
    0xC0, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,
    0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0xC0, 0xC0, 0xC0, 0xC0, 0x3F,
    0xC0, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0xC0, 0xC0, 0xC0, 0xC0, 0xC0
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
            utf8: "utf-8",
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

    rangeForParagraphAtIndex: {
        enumerable: false,
        value: function String_rangeForParagraphAtIndex(index){
            var iterator1 = this.userPerceivedCharacterIterator(index);
            var startIndex = iterator1.range.location;
            var iterator2 = UserPerceivedCharacterIterator(iterator1);
            iterator1.decrement();
            while (!iterator1.isParagraphBreak){
                startIndex = iterator1.range.location;
                iterator1.decrement();
            }
            while (!iterator2.isParagraphBreak){
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

    utf16be: {
        configurable: true,
        enumerable: false,
        value: function String_utf16be(){
            var utf16 = JSData.initWithLength(this.length * 2);
            var dataView = utf16.dataView();
            var j = 0;
            for (var i = 0, l = this.length; i < l; ++i, j += 2){
                dataView.setUint16(j, this.charCodeAt(i));
            }
            return utf16;
        }
    },

    utf16le: {
        configurable: true,
        enumerable: false,
        value: function String_utf16le(){
            var utf16 = JSData.initWithLength(this.length * 2);
            var dataView = utf16.dataView();
            var j = 0;
            for (var i = 0, l = this.length; i < l; ++i, j += 2){
                dataView.setUint16(j, this.charCodeAt(i), true);
            }
            return utf16;
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
            if (encoding == String.Encoding.utf16be){
                return this.utf16be();
            }
            if (encoding == String.Encoding.utf16le){
                return this.utf16le();
            }
            return null;
        }
    },

    dataByDecodingBase64URL: {
        enumerable: false,
        value: function String_dataByDecodingBase64URL(){
            return this._dataByDecodingBase64(base64URLDecodingMap);
        }
    },

    dataByDecodingBase64: {
        enumerable: false,
        value: function String_dataByDecodingBase64(){
            return this._dataByDecodingBase64(base64DecodingMap);
        }
    },

    _dataByDecodingBase64: {
        enumerable: false,
        value: function String_dataByDecodingBase64(map){
            var group = new Uint32Array(1);
            var bytes = JSData.initWithLength(this.length * 3 / 4);
            var offset = 0;
            var decoded;
            var remaining = 4;
            var c;
            for (var i = 0, l = this.length; i < l; ++i){
                c = this.charCodeAt(i);
                if (c >= 128){
                    throw new Error("Invalid input byte in base64 at %d: %#02x".sprintf(i, this.charCodeAt(i)));
                }
                decoded = map[c];
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
                if (isNaN(b)){
                    throw new Error("Invalid hex character at %d".sprintf(i));
                }
                data[o] = b;
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
            var parser = String.FormatParser(this, formatter, args);
            parser.delegate = {
                parserFoundString: function(parser, string){
                    formatted += string;
                },

                parserFoundReplacementInRange: function(parser, replacement, range, argIndex){
                    formatted += replacement;
                },
            };
            parser.parse();
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
        value: function String_leftPaddedString(padding, width){
            var padded = '';
            var chars = Math.max(0, width - this.length);
            for (var i = 0; i < chars; ++i){
                padded += padding;
            }
            padded += this;
            return padded;
        }
    },

    rightPaddedString: {
        enumerable: false,
        value: function String_rightPaddedString(padding, width){
            var padded = this;
            var chars = Math.max(0, width - this.length);
            for (var i = 0; i < chars; ++i){
                padded += padding;
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

    capitalizedString: {
        enumerable: false,
        value: function String_capitalizedString(){
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

    removingFileExtension: {
        value: function String_removingFileExtension(){
            var ext = this.fileExtension;
            return this.substr(0, this.length - ext.length);
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
            return this.character !== null && (this.character.code == 0x20 || this.character.code == 0x09 || this.character.code == 0x0A || this.character.code == 0x0B || this.character.code == 0x0C || this.character.code == 0x0D);
            // TODO: consider other whitespace
        }
    },

    isLineBreakOpportunity: {
        enumerable: false,
        get: function UnicodeIterator_isLineBreakOpportunity(){
            // https://www.unicode.org/reports/tr14/
            var before = UnicodeIterator(this);
            before.decrement();
            var lbc = UnicodeChar.LineBreakingClass;

            // LB2 Never break at the start of text.
            if (before._character === null){
                return false;
            }

            // LB3 Always break at the end of text.
            if (this._character === null){
                return true;
            }

            var c1 = this._character.lineBreakingClass;
            var c0 = before._character.lineBreakingClass;

            // LB4 Always break after hard line breaks.
            if (c0 === lbc.mandatoryBreak) {
                return true;
            }

            // LB5 Treat CR followed by LF, as well as CR, LF, and NL as hard line breaks.
            if (c0 === lbc.carriageReturn) {
                if (c1 === lbc.lineFeed) {
                    return false;
                }
                return true;
            }
            if (c0 === lbc.lineFeed || c0 === lbc.nextLine) {
                return true;
            }

            // LB6 Do not break before hard line breaks.
            if (c1 === lbc.mandatoryBreak || c1 === lbc.carriageReturn || c1 === lbc.lineFeed || c1 === lbc.nextLine) {
                return false;
            }

            // LB7 Do not break before spaces or zero width space.
            if (c1 === lbc.space){
                return false;
            }
            if (c1 === lbc.zeroWidthSpace){
                return false;
            }

            // LB8 Break before any character following a zero-width space, even if one or more spaces intervene.
            if (c0 === lbc.zeroWidthSpace){
                if (c1 === lbc.space){
                    return false;
                }
                return true;
            }

            // LB8a Do not break after a zero width joiner.
            if (c0 === lbc.zeroWidthJoiner){
                return false;
            }

            // LB9 Do not break a combining character sequence; treat it as if it has the line breaking class of the base character in all of the following rules. Treat ZWJ as if it were CM.
            while (c0 !== null && (c0 === lbc.combiningMark || c0 === lbc.zeroWidthJoiner)) {
                before.decrement();
                if (before._character !== null){
                    c0 = before._character.lineBreakingClass;
                }else{
                    c0 = null;
                }
            }
            if (c0 === null){
                return false;
            }

            // LB10 Treat any remaining combining mark or ZWJ as AL.
            if (c1 === lbc.combiningMark || c1 === lbc.zeroWidthJoiner){
                c1 = lbc.alphabetic;
            }

            // LB11 Do not break before or after Word joiner and related characters.
            if (c1 === lbc.wordJoiner){
                return false;
            }
            if (c0 === lbc.wordJoiner){
                return false;
            }

            // LB12 Do not break after NBSP and related characters.
            if (c0 === lbc.glue){
                return false;
            }

            // LB12a Do not break before NBSP and related characters, except after spaces and hyphens.
            if (c1 === lbc.glue){
                if (c0 === lbc.space || c0 === lbc.breakAfter || c0 === lbc.hyphen){
                    return true;
                }
                return false;
            }

            // LB13 Do not break before ‘]’ or ‘!’ or ‘;’ or ‘/’, even after spaces.
            if (c1 === lbc.closePunctuation){
                return false;
            }
            if (c1 === lbc.closingParenthesis){
                return false;
            }
            if (c1 === lbc.exclamation){
                return false;
            }
            if (c1 === lbc.infixNumeric){
                return false;
            }
            if (c1 === lbc.symbolsBreakAfter){
                return false;
            }

            // LB14 Do not break after ‘[’, even after spaces.
            if (c0 === lbc.openPunctuation){
                return false;
            }

            // LB15 Do not break within ‘”[’, even with intervening spaces.
            if (c0 === lbc.quotation && c1 === lbc.openPunctuation){
                return false;
            }

            // LB16 Do not break between closing punctuation and a nonstarter (lb=NS), even with intervening spaces.
            if ((c0 === lbc.closePunctuation || c0 === lbc.closingParenthesis) && c1 === lbc.nonstarters){
                return false;
            }

            // LB17 Do not break within ‘——’, even with intervening spaces.
            if (c0 === lbc.breakOpportunity && c1 === lbc.breakOpportunity){
                return false;
            }

            // LB18 Break after spaces.
            if (c0 === lbc.space){
                // But first check for for intervening spaces in LB14-LB17
                while (c0 !== null && c0 === lbc.space){
                    before.decrement();
                    if (before._character !== null){
                        c0 = before._character.lineBreakingClass;
                    }else{
                        c0 = null;
                    }
                }
                // LB14
                if (c0 === lbc.openPunctuation){
                    return false;
                }
                // LB15
                if (c0 === lbc.quotation && c1 === lbc.openPunctuation){
                    return false;
                }
                // LB16
                if ((c0 === lbc.closePunctuation || c0 === lbc.closingParenthesis) && c1 === lbc.nonstarters){
                    return false;
                }
                // LB17
                if (c0 === lbc.breakOpportunity && c1 === lbc.breakOpportunity){
                    return false;
                }
                return true;
            }

            // LB19 Do not break before or after quotation marks, such as ‘ ” ’.
            if (c0 === lbc.quotation || c1 === lbc.quotation){
                return false;
            }

            // LB20 Break before and after unresolved CB.
            if (c0 === lbc.contingentBreak || c1 === lbc.contingentBreak){
                return false;
            }

            // LB21 Do not break before hyphen-minus, other hyphens, fixed-width spaces, small kana, and other non-starters, or after acute accents.
            if (c1 === lbc.breakAfter){
                return false;
            }
            if (c1 === lbc.hyphen){
                return false;
            }
            if (c1 === lbc.nonstarters){
                return false;
            }
            if (c0 === lbc.breakBefore){
                return false;
            }

            // LB21a Don't break after Hebrew + Hyphen.
            if (c0 === lbc.hyphen || c0 === lbc.breakAfter){
                before.decrement();
                if (before._character !== null && before._character.lineBreakingClass === lbc.hebrewLetter){
                    return false;
                }
                before.increment();
            }

            // LB22 Do not break before ellipses.
            if (c1 === lbc.inseperable){
                return false;
            }

            // LB23 Do not break between digits and letters.
            if ((c0 === lbc.alphabetic || c0 === lbc.hebrewLetter) && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.numeric && (c1 === lbc.alphabetic || c1 === lbc.hebrewLetter)){
                return false;
            }

            // LB23a Do not break between numeric prefixes and ideographs, or between ideographs and numeric postfixes.
            if (c0 === lbc.prefixNumeric && (c1 === lbc.ideographic || c1 === lbc.emojiBase || c1 === lbc.emojiModifier)){
                return false;
            }
            if ((c0 === lbc.ideographic || c0 === lbc.emojiBase || c0 === lbc.emojiModifier) && c1 === lbc.prefixNumeric){
                return false;
            }

            // LB24 Do not break between numeric prefix/postfix and letters, or between letters and prefix/postfix.
            if ((c0 === lbc.prefixNumeric || c0 === lbc.postfixNumeric) && (c1 === lbc.alphabetic || c1 === lbc.hebrewLetter)){
                return false;
            }
            if ((c0 === lbc.alphabetic || c0 === lbc.hebrewLetter) && (c1 === lbc.prefixNumeric || c1 === lbc.postfixNumeric)){
                return false;
            }

            // LB25 Do not break between the following pairs of classes relevant to numbers:
            if (c0 === lbc.closePunctuation && c1 === lbc.postfixNumeric){
                return false;
            }
            if (c0 === lbc.closingParenthesis && c1 === lbc.postfixNumeric){
                return false;
            }
            if (c0 === lbc.closePunctuation && c1 === lbc.prefixNumeric){
                return false;
            }
            if (c0 === lbc.closingParenthesis && c1 === lbc.prefixNumeric){
                return false;
            }
            if (c0 === lbc.numeric && c1 === lbc.postfixNumeric){
                return false;
            }
            if (c0 === lbc.numeric && c1 === lbc.prefixNumeric){
                return false;
            }
            if (c0 === lbc.postfixNumeric && c1 === lbc.openPunctuation){
                return false;
            }
            if (c0 === lbc.postfixNumeric && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.prefixNumeric && c1 === lbc.openPunctuation){
                return false;
            }
            if (c0 === lbc.prefixNumeric && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.hyphen && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.infixNumeric && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.numeric && c1 === lbc.numeric){
                return false;
            }
            if (c0 === lbc.symbolsBreakAfter && c1 === lbc.numeric){
                return false;
            }

            // LB26 Do not break a Korean syllable.
            if (c0 === lbc.hangulLJambo){
                if (c1 === lbc.hangulLJambo){
                    return false;
                }
                if (c1 === lbc.hangulVJambo){
                    return false;
                }
                if (c1 === lbc.hangulVJambo){
                    return false;
                }
            }
            if ((c0 === lbc.hangulVJambo || c0 === lbc.hangulLV) && (c1 === lbc.hangulVJambo || c1 === lbc.hangulTJambo)){
                return false;
            }
            if ((c0 === lbc.hangulTJambo || c0 === lbc.hangulLVT) && c1 === lbc.hangulTJambo){
                return false;
            }

            // LB27 Treat a Korean Syllable Block the same as ID.
            if (c1 === lbc.postfixNumeric){
                if (c0 === lbc.hangulLJambo){
                    return false;
                }
                if (c0 === lbc.hangulVJambo){
                    return false;
                }
                if (c0 === lbc.hangulTJambo){
                    return false;
                }
                if (c0 === lbc.hangulLV){
                    return false;
                }
                if (c0 === lbc.hangulLVT){
                    return false;
                }
            }
            if (c0 === lbc.prefixNumeric){
                if (c1 === lbc.hangulLJambo){
                    return false;
                }
                if (c1 === lbc.hangulVJambo){
                    return false;
                }
                if (c1 === lbc.hangulTJambo){
                    return false;
                }
                if (c1 === lbc.hangulLV){
                    return false;
                }
                if (c1 === lbc.hangulLVT){
                    return false;
                }
            }

            // LB28 Do not break between alphabetics (“at”).
            if ((c0 === lbc.alphabetic || c0 === lbc.hebrewLetter) && (c1 === lbc.alphabetic || c1 === lbc.hebrewLetter)){
                return false;
            }

            // LB29 Do not break between numeric punctuation and alphabetics (“e.g.”).
            if (c0 === lbc.infixNumeric && (c1 === lbc.alphabetic || c1 === lbc.hebrewLetter)){
                return false;
            }

            // LB30 Do not break between letters, numbers, or ordinary symbols and opening or closing parentheses.
            if ((c0 === lbc.alphabetic || c0 === lbc.hebrewLetter || c0 === lbc.numeric) && c1 === lbc.openPunctuation){
                return false;
            }
            if (c0 === lbc.openPunctuation && (c1 === lbc.alphabetic || c1 === lbc.hebrewLetter || c1 === lbc.numeric)){
                return false;
            }

            // LB30a Break between two regional indicator symbols if and only if there are an even number of regional indicators preceding the position of the break.

            // LB30b Do not break between an emoji base (or potential emoji) and an emoji modifier.
            if (c0 === lbc.emojiBase && c1 === lbc.emojiModifier){
                return false;
            }

            // LB31 Break everywhere else.
            return true;
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
    },

    isParagraphBreak: {
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
            return this._unicodeIterator.character.isParagraphBreak;
        }
    },

    isLineBreakOpportunity: {
        enumerable: false,
        get: function UserPerceivedCharacterIterator_isLineBreakOpportunity(){
            return this._unicodeIterator.isLineBreakOpportunity;
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

String.FormatParser = function(format, formatter, args){
    if (this === undefined || this === String){
        return new String.FormatParser(format, formatter, args);
    }
    this.format = format;
    this.formatter = formatter;
    this.args = args;
};

String.FormatParser.prototype = {
    parse: function(){
        var formatter = this.formatter;
        var args = this.args;
        var format = this.format;
        var range = JSRange.Zero;
        var formatting = false;
        var using_numbered_args = false;
        var found_first_format = false;
        var argIndex = -1;
        var sub;
        var uppercase;
        var replacement;
        var options = {
            width: null,
            precision: null
        };
        for (var i = 0, l = format.length; i < l; ++i){
            var c = format[i];
            if (formatting){
                if (c == '%'){
                    range.length = i + 1 - range.location;
                    if (this.delegate && this.delegate.parserFoundReplacementInRange){
                        this.delegate.parserFoundReplacementInRange(this, "%", range, -1);
                    }
                    range.location = i + 1;
                    range.length = 0;
                }else{
                    if (using_numbered_args){
                        sub = '';
                        while (c != '$'){
                            sub += c;
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + format);
                            }
                            c = format[i];
                            if ((c < '0' || c > '9') && c != '$'){
                                throw new Error("Invalid format string, invalid arg index char: " + c + "; " + format);
                            }
                        }
                        argIndex = parseInt(sub, 10) - 1;
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + format);
                        }
                        c = format[i];
                    }else{
                        ++argIndex;
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
                                throw new Error("Invalid format string, unexpected end: " + format);
                            }
                            c = format[i];
                        }
                    }
                    if (c >= '1' && c <= '9'){
                        sub = '';
                        do {
                            sub += c;
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + format);
                            }
                            c = format[i];
                        } while (c >= '0' && c <= '9');
                        options.width = parseInt(sub, 10);
                    }
                    if (c == '.'){
                        options.precision = 0;
                        sub = '';
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + format);
                        }
                        c = format[i];
                        while (c >= '0' && c <= '9') {
                            sub += c;
                            ++i;
                            if (i >= l){
                                throw new Error("Invalid format string, unexpected end: " + format);
                            }
                            c = format[i];
                        }
                        if (sub.length){
                            options.precision = parseInt(sub, 10);
                        }
                    }
                    var method = c;
                    if (c == '{'){
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + format);
                        }
                        c = format[i];
                        method = '';
                        while (c != '}' && i < l){
                            method += c;
                            ++i;
                            c = format[i];
                        }
                        if (c !== '}'){
                            throw new Error("Invalid format string, unexpected end: " + format);
                        }
                    }
                    if (method in formatter){
                        range.length = i + 1 - range.location;
                        replacement = formatter[method](args[argIndex], options);
                        if (this.delegate && this.delegate.parserFoundReplacementInRange){
                            this.delegate.parserFoundReplacementInRange(this, replacement, range, argIndex);
                        }
                        range.location = i + 1;
                        range.length = 0;
                    }else{
                        throw new Error("Invalid format string, unknown conversion specifier: " + c + "; " + format);
                    }
                }
                formatting = false;
            }else{
                switch (c){
                    case '%':
                        if (range.length > 0 && this.delegate && this.delegate.parserFoundString){
                            this.delegate.parserFoundString(this, format.substringInRange(range));
                        }
                        range.location = i;
                        range.length = 0;
                        formatting = true;
                        if (!found_first_format){
                            found_first_format = true;
                            using_numbered_args = format.substr(i + 1, 5).match(/^[1-9][0-9]*\$/);
                        }
                        break;
                    default:
                        range.length++;
                        break;
                }
            }
        }
        if (range.length > 0 && this.delegate && this.delegate.parserFoundString){
            this.delegate.parserFoundString(this, format.substringInRange(range));
        }
        if (!using_numbered_args && argIndex < args.length - 1){
            throw new Error("Invalid format string, unused arguments: " + format);
        }
    }
};

})();

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (prefix) {
        return this.substr(0, prefix.length) === prefix;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (suffix) {
        return this.substr(this.length - suffix.length, suffix.length) === suffix;
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