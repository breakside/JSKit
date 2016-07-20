// #feature Uint8Array
// #import "Foundation/JSObject.js"
// #import "Foundation/JSData.js"
// #import "Foundation/UnicodeChar.js"
/* global JSObject, JSClass, UnicodeChar, JSString, JSRange, JSData */
'use strict';

// TODO: handle normalization? http://unicode.org/reports/tr15/

JSClass("JSString", JSObject, {

    // -------------------------------------------------------------------------
    // MARK: - Properties

    length: 0,
    nativeString: null,

    // -------------------------------------------------------------------------
    // MARK: - Constructors

    init: function(){
        this.initWithNativeString('');
    },

    initWithNativeString: function(nativeString){
        this.nativeString = nativeString;
        this.length = this.nativeString.length;
    },

    initWithFormat: function(format){
        var args = Array.prototype.splice.call(arguments, 1);
        this.initWithNativeString(format.sprintf(args));
    },

    // -------------------------------------------------------------------------
    // MARK: - Changing a String

    appendString: function(string){
        this.replaceCharactersInRangeWithString(JSRange(this.length, 0), string);
    },

    replaceCharactersInRangeWithString: function(range, string){
        var i, l;
        var indexPair;
        if (typeof(string) == "string"){
            string = JSString.initWithNativeString(string);
        }
        if (string.length > 0){
            if (range.location >= this.length){
                this.nativeString += string.nativeString;
            }else{
                this.nativeString = this.nativeString.substr(0, range.location) + string.nativeString + this.nativeString.substr(range.location + range.length);
            }
            this.length = this.nativeString.length;
        }else if (range.length){
            this.deleteCharactersInRange(range);
        }
    },

    deleteCharactersInRange: function(range){
        if (range.length > 0){
            this.nativeString = this.nativeString.substr(0, range.location) + this.nativeString.substr(range.location + range.length);
            this.length = this.nativeString.length;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessing Characters & Words

    unicodeAtIndex: function(index){
        if (index < 0 || index >= this.length){
            throw new Error("JSString index %d out of range [0, %d]".sprintf(index, this.length - 1));
        }
        var iterator = JSString._UnicodeIterator(this, index);
        return iterator.character();
    },

    rangeForUserPerceivedCharacterAtIndex: function (index){
        if (index >= this.length){
            return JSRange(this.length, 0);
        }
        var iterator = JSString._UnicodeIterator(this, index);
        var startIndex = iterator.index;
        var endIndex = iterator.nextIndex;
        var c1 = null;
        var c2 = iterator.character();
        while (startIndex > 0){
            iterator.decrement();
            c1 = iterator.character();
            if (!this.isGraphemeClusterBoundary(c1, c2)){
                startIndex = iterator.index;
                c2 = c1;
            }else{
                break;
            }
        }
        iterator = JSString._UnicodeIterator(this, index);
        c1 = iterator.character();
        while (endIndex < this.length){
            iterator.increment();
            c2 = iterator.character();
            if (!this.isGraphemeClusterBoundary(c1, c2)){
                endIndex = iterator.nextIndex;
                c1 = c2;
            }else{
                break;
            }
        }
        return JSRange(startIndex, endIndex - startIndex);
    },

    rangeForWordAtIndex: function(index){
        var iterator = JSString._UnicodeIterator(this, index);
        var startIndex = iterator.index;
        var endIndex = iterator.nextIndex;
        while (!this.isWordBoundary(iterator.index)){
            iterator.decrement();
            startIndex = iterator.index;
        }
        iterator = JSString._UnicodeIterator(this, endIndex);
        while (!this.isWordBoundary(iterator.index)){
            iterator.increment();
            endIndex = iterator.nextIndex;
        }
        return JSRange(startIndex, endIndex - startIndex);
    },

    stringForWordAtIndex: function(index){
        var range = this.rangeForWordAtIndex(index);
        return this.substringInRange(range);
    },

    indexOfNextWordFromIndex: function(index){
        var range = this.rangeForWordAtIndex(index);
        index = range.location + range.length;
        var L = this.length;
        var word;
        var a, b;
        while (index < L){
            range = this.rangeForWordAtIndex(index);
            word = this.nativeString.substr(range.location, range.length);
            if (word.search(/[^\s]/) >= 0){
                return index;
            }
            index = range.location + range.length;
        }
        return L;
    },

    indexOfPreviousWordFromIndex: function(index){
        var range = this.rangeForWordAtIndex(index);
        index = range.location - 1;
        var word;
        var a, b;
        while (index >= 0){
            range = this.rangeForWordAtIndex(index);
            word = this.nativeString.substr(range.location, range.length);
            if (word.search(/[^\s]/) >= 0){
                return range.location;
            }
            index = range.location - 1;
        }
        return 0;
    },

    // -------------------------------------------------------------------------
    // MARK: - Substrings & Variants

    substringInRange: function(range){
        return JSString.initWithNativeString(this.nativeString.substr(range.location, range.length));
    },

    uppercaseString: function(){
        return JSString.initWithNativeString(this.nativeString.toUpperCase());
    },

    lowercaseStrinc: function(){
        return JSString.initWithNativeString(this.nativeString.toLowerCase());
    },

    // -------------------------------------------------------------------------
    // MARK: - Comparison

    isEqualToString: function(otherString){
        // TODO: consider using normalization when comparing
        return this.nativeString == otherString.nativeString;
    },

    isEqual: function(other){
        if (other !== null && other.isKindOfClass && other.isKindOfClass('JSString')){
            return this.isEqualToString(other);
        }
        return this.nativeString == other;
    },

    // -------------------------------------------------------------------------
    // MARK: - Encoding

    dataUsingUTF8Encoding: function(){
        // TODO: use TextEncoder if available
        var utf8 = new Uint8Array(this.length * 4);
        var c;
        var j = 0;
        var iterator = JSString._UnicodeIterator(this, 0);
        while (iterator.index < this.length){
            c = iterator.character().code;
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
        utf8 = new Uint8Array(utf8.buffer, utf8.byteOffset, j);
        return JSData.initWithBytes(utf8);
    },

    toString: function(){
        return this.nativeString;
    },

    // -------------------------------------------------------------------------
    // MARK: - Private helpers for finding word and character breaks

    isWordBoundary: function(index){
        // See http://www.unicode.org/reports/tr29/

        var iterator = JSString._UnicodeIterator(index);

        // WB1: sot ÷
        if (iterator.index === 0){
            return true;
        }
        // WB1: ÷ eot
        if (iterator.index === this.length){
            return true;
        }

        var c2 = iterator.character();
        iterator.decrement();
        var c1 = iterator.character();
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
        if (c2.Format || c2.Extend){
            return false;
        }
        while (iterator.index > 0 && (c1.Format || c1.Extend)){
            iterator.decrement();
            c1 = iterator.character();
        }
        if (iterator.index > 0){
            iterator.decrement();
            c0 = iterator.character();
            while (iterator.index > 0 && (c0.Format || c0.Extend)){
                iterator.decrement();
                c0 = iterator.character();
            }
        }

        // WB5: AHLetter × AHLetter
        if (c1.wordBreakAHLetter && c2.wordBreakAHLetter){
            return false;
        }
        // WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
        iterator = JSString._UnicodeIterator(index);
        if (iterator.index < this.length){
            iterator.increment();
            c3 = iterator.character();
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
    },

    isGraphemeClusterBoundary: function(c1, c2){
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

});

JSString._UnicodeIterator = function(str, index){
    if (this === JSString){
        return new JSString._UnicodeIterator(str, index);
    }
    this.str = str;
    this.index = index;
    this.updateCurrentCharacter();
};

JSString._UnicodeIterator.prototype = {
    index: 0,
    nextIndex: 0,
    currentCharacter: null,

    updateCurrentCharacter: function(){
        if (this.index < 0){
            this.index = -1;
            this.nextIndex = 0;
            this.currentCharacter = null;
        }else if(this.index >= this.str.length){
            this.index = this.str.length;
            this.nextIndex = this.str.length;
            this.currentCharacter = null;
        }else{
            var A = this.str.nativeString.charCodeAt(this.index);
            var B = 0;
            var code = 0;
            this.nextIndex = this.index + 1;
            if (A >= 0xD800 && A < 0xDC00){
                if (this.index < this.str.length - 1){
                    B = this.str.nativeString.charCodeAt(this.index + 1);
                    if (B >= 0xDC00 && B < 0xE000){
                        code = (((A & 0x3FFF) << 10) | (B & 0x3FF)) + 0x10000;
                        this.currentCharacter = UnicodeChar(code);
                        ++this.nextIndex;
                    }else{
                        this.currentCharacter = UnicodeChar(0xFFFD);
                    }
                }else{
                    this.currentCharacter = UnicodeChar(0xFFFD);
                }
            }else if (A >= 0xDC00 && A < 0xE000){
                if (this.index > 0){
                    B = A;
                    A = this.str.nativeString.charCodeAt(this.index - 1);
                    if (A >= 0xD800 && A < 0xDC00){
                        --this.index;
                        code = (((A & 0x3FFF) << 10) | (B & 0x3FF)) + 0x10000;
                        this.currentCharacter = UnicodeChar(code);
                    }else{
                        this.currentCharacter = UnicodeChar(0xFFFD);
                    }
                }else{
                    this.currentCharacter = UnicodeChar(0xFFFD);
                }
            }else{
                this.currentCharacter = UnicodeChar(A);
            }
        }
    },

    increment: function(){
        this.index = this.nextIndex;
        this.updateCurrentCharacter();
        return this;
    },

    decrement: function(){
        this.index -= 1;
        this.updateCurrentCharacter();
        return this;
    },

    character: function(){
        return this.currentCharacter;
    }
};