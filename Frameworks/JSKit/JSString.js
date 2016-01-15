// #feature Uint8Array
// #import "JSKit/JSObject.js"
// #import "JSKit/JSData.js"
// #import "Unicode/Unicode.js"
/* global JSObject, JSClass, UnicodeChar, JSString, JSRange, JSData */
'use strict';

// TODO: handle normalization? http://unicode.org/reports/tr15/

JSClass("JSString", JSObject, {

    // #mark - Properties

    length: 0,
    nativeString: null,

    // #mark - Constructors

    init: function(){
        this.initWithNativeString('');
    },

    initWithNativeString: function(nativeString){
        this.nativeString = nativeString;
        this.findSurrogateIndexes();
        this.length = this.nativeString.length - this.surrogateIndexes.length;
    },

    initWithFormat: function(format){
        var args = Array.prototype.splice.call(arguments, 1);
        this.initWithNativeString(format.sprintf(args));
    },

    // #mark - Changing a String

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
            if (range.location == this.length){
                this.nativeString += string.nativeString;
                for (i = 0, l = string.surrogateIndexes.length; i < l; ++i){
                    indexPair = string.surrogateIndexes[i];
                    this.surrogateIndexes.push({nativeIndex: indexPair.nativeIndex + this.nativeString.length, unicodeIndex: indexPair.unicodeIndex + this.length});
                }
            }else{
                var a = this.nativeIndexForUnicodeIndex(range.location);
                var b = this.nativeIndexForUnicodeIndex(range.location + range.length);
                var nativeRange = JSRange(a, b - a);
                this.nativeString = this.nativeString.substr(0, nativeRange.location) + string.nativeString + this.nativeString.substr(nativeRange.location + nativeRange.length);
                var nativeDiff = string.nativeString.length - nativeRange.length;
                var diff = string.length - range.length;
                for (i = this.surrogateIndexes.length - 1; i >= 0; --i){
                    indexPair = this.surrogateIndexes[i];
                    if (indexPair.unicodeIndex >= range.location + range.length){
                        indexPair.unicodeIndex += diff;
                        indexPair.nativeIndex += nativeDiff;
                    }else if (indexPair.unicodeIndex >= range.location){
                        this.surrogateIndexes.splice(i, 1);
                    }else{
                        break;
                    }
                }
                var index = i + 1;
                for (i = 0, l = string.surrogateIndexes.length; i < l; ++i){
                    indexPair = string.surrogateIndexes[i];
                    this.surrogateIndexes.splice(index, 0, {nativeIndex: indexPair.nativeIndex + nativeRange.location, unicodeIndex: indexPair.unicodeIndex + range.location});
                    ++index;
                }
            }
            this.length = this.length + string.length - range.length;
        }else if (range.length){
            this.deleteCharactersInRange(range);
        }
    },

    deleteCharactersInRange: function(range){
        if (range.length > 0){
            var a = this.nativeIndexForUnicodeIndex(range.location);
            var b = this.nativeIndexForUnicodeIndex(range.location + range.length);
            var nativeRange = JSRange(a, b - a);
            this.nativeString = this.nativeString.substr(0, nativeRange.location) + this.nativeString.substr(nativeRange.location + nativeRange.length);
            var indexPair;
            for (var i = this.surrogateIndexes.length - 1; i >= 0; --i){
                indexPair = this.surrogateIndexes[i];
                if (indexPair.unicodeIndex >= range.location + range.length){
                    indexPair.unicodeIndex -= range.length;
                    indexPair.nativeIndex -= nativeRange.length;
                }else if (indexPair.unicodeIndex >= range.location){
                    this.surrogateIndexes.splice(i, 1);
                }else{
                    break;
                }
            }
            this.length -= range.length;
        }
    },

    // #mark - Accessing Characters & Words

    unicodeAtIndex: function(index){
        if (index < 0 || index >= this.length){
            throw new Error("JSString index %d out of range [0, %d]".sprintf(index, this.length - 1));
        }
        index = this.nativeIndexForUnicodeIndex(index);
        var code = this.nativeString.charCodeAt(index);
        var low, high;
        if (code >= 0xD800 && code < 0xDC00){
            high = code;
            low = this.nativeString.charCodeAt(index + 1);
            code = ((high - 0xD800) << 10) | (low - 0xDC00) + 0x10000;
        }
        return UnicodeChar(code);
    },

    rangeForUserPerceivedCharacterAtIndex: function (index){
        var startIndex = index;
        var endIndex = index + 1;
        var L = this.length;
        while (!this.isGraphemeClusterBoundary(startIndex)){
            startIndex -= 1;
        }
        while (!this.isGraphemeClusterBoundary(endIndex)){
            endIndex += 1;
        }
        return JSRange(startIndex, endIndex - startIndex);
    },

    rangeForWordAtIndex: function(index){
        var L = this.length;
        var startIndex = index == L ? index - 1 : index;
        var endIndex = startIndex + 1;
        while (startIndex > 0 && !this.isWordBoundary(startIndex, L)){
            --startIndex;
        }
        while (endIndex < L && !this.isWordBoundary(endIndex, L)){
            ++endIndex;
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
            a = this.nativeIndexForUnicodeIndex(range.location);
            b = this.nativeIndexForUnicodeIndex(range.location + range.length);
            word = this.nativeString.substr(a, b - a);
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
            a = this.nativeIndexForUnicodeIndex(range.location);
            b = this.nativeIndexForUnicodeIndex(range.location + range.length);
            word = this.nativeString.substr(a, b - a);
            if (word.search(/[^\s]/) >= 0){
                return range.location;
            }
            index = range.location - 1;
        }
        return 0;
    },

    // #mark - Substrings & Variants

    stringForCharactersInRange: function(range){
        var nativeRange = JSRange(this.nativeIndexForUnicodeIndex(range.location), 0);
        nativeRange.length = this.nativeIndexForUnicodeIndex(range.location + range.length) - nativeRange.location;
        var nativeSubstring = this.nativeString.substr(nativeRange.location, nativeRange.length);
        return JSString.initWithNativeString(nativeSubstring);
    },

    // TODO: uppercase
    // TODO: lowercase

    // #mark - Comparison

    isEqualToString: function(otherString){
        // TODO: consider using normalization when comparing
        return this.nativeString == otherString.nativeString;
    },

    // #mark - Encoding

    dataUsingUTF8Encoding: function(){
        // TODO: use TextEncoder if available
        var utf8 = new Uint8Array(this.length * 4);
        var c;
        var j = 0;
        for (var i = 0, l = this.length; i < l; ++i){
            c = this.unicodeAtIndex(i).code;
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
        }
        utf8 = new Uint8Array(utf8.buffer, utf8.byteOffset, j);
        return JSData.initWithBytes(utf8);
    },

    toString: function(){
        return this.nativeString;
    },

    // #mark - Private Properties

    surrogateIndexes: null,

    // #mark - Private helpers for mapping native string to unicode chars

    // The mapping looks like this
    // [{nativeIndex: 2, unicodeIndex: 2}, {nativeIndex: 6, unicodeIndex: 5}]
    // For a string that looks like this
    // native string:   a b \uD852 \uDF62 c d \uD852 \uDF62
    // native indexes:  0 1 2      3      4 5 6      7      8
    // unicode indexes: 0 1 2             3 4 5             6

    nativeIndexForUnicodeIndex: function(index){
        if (this.surrogateIndexes.length === 0){
            return index;
        }
        if (index <= this.surrogateIndexes[0].unicodeIndex){
            return index;
        }
        var min = 1;
        var max = this.surrogateIndexes.length - 1;
        var mid = 1;
        var indexPair = this.surrogateIndexes[0];
        while (min <= max){
            mid = min + Math.floor((max - min) / 2);
            indexPair = this.surrogateIndexes[mid];
            if (indexPair.unicodeIndex == index){
                return indexPair.nativeIndex;
            }else if (index < indexPair.unicodeIndex){
                max = mid - 1;
            }else if (index > indexPair.unicodeIndex){
                min = mid + 1;
            }
        }
        if (index < indexPair.unicodeIndex){
            indexPair = this.surrogateIndexes[mid - 1];
        }
        return indexPair.nativeIndex + 1 + (index - indexPair.unicodeIndex);
    },

    unicodeIndexForNativeIndex: function(index){
        if (this.surrogateIndexes.length === 0){
            return index;
        }
        if (index <= this.surrogateIndexes[0].nativeIndex){
            return index;
        }
        var min = 1;
        var max = this.surrogateIndexes.length - 1;
        var mid = 1;
        var indexPair = this.surrogateIndexes[0];
        while (min <= max){
            mid = min + Math.floor((max - min) / 2);
            indexPair = this.surrogateIndexes[mid];
            if (indexPair.nativeIndex == index){
                return indexPair.unicodeIndex;
            }else if (index < indexPair.nativeIndex){
                max = mid - 1;
            }else if (index > indexPair.nativeIndex){
                min = mid + 1;
            }
        }
        if (index < indexPair.nativeIndex){
            indexPair = this.surrogateIndexes[mid - 1];
        }
        return indexPair.unicodeIndex - 1 - (index - indexPair.nativeIndex);
    },

    findSurrogateIndexes: function(){
        var L = this.nativeString.length;
        var index = this.nativeString.search(/[\uD800-\uDC00]/);
        var code;
        this.surrogateIndexes = [];
        if (index >= 0){
            var unicodeIndex = index;
            this.surrogateIndexes.push({nativeIndex: index, unicodeIndex: unicodeIndex});
            index += 2;
            unicodeIndex += 1;
            while (index < L){
                code = this.nativeString.charCodeAt(index);
                if (code >= 0xD800 && code < 0xDC00){
                    this.surrogateIndexes.push({nativeIndex: index, unicodeIndex: unicodeIndex});
                    index += 2;
                }else{
                    index += 1;
                }
                unicodeIndex += 1;
            }
        }
    },

    // #mark - Private helpers for finding word and character breaks

    characterIndexForWordBreakingBeforeIndex: function(index){
        var unicode = this.unicodeAtIndex(index);
        while ((unicode.Extended || unicode.Format) && index > 0){
            --index;
            unicode = this.unicodeAtIndex(index);
        }
        return index;
    },

    characterIndexForWordBreakingAfterIndex: function(index, L){
        var unicode = this.unicodeAtIndex(index);
        while ((unicode.Extended || unicode.Format) && index < L - 1){
            ++index;
            unicode = this.unicodeAtIndex(index);
        }
        if (unicode.Extended || unicode.Format){
            return null;
        }
        return index;
    },

    isWordBoundary: function(index, L){
        // See http://www.unicode.org/reports/tr29/

        // WB1: sot ÷
        if (index === 0){
            return true;
        }
        // WB1: ÷ eot
        if (index === L){
            return true;
        }
        var c1 = this.unicodeAtIndex(index - 1);
        var c2 = this.unicodeAtIndex(index);
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
        var c2Index = this.characterIndexForWordBreakingBeforeIndex(index);
        var c1Index = this.characterIndexForWordBreakingBeforeIndex(c2Index - 1);
        c1 = this.unicodeAtIndex(c1Index);
        c2 = this.unicodeAtIndex(c2Index);

        // WB5: AHLetter × AHLetter
        if (c1.wordBreakAHLetter && c2.wordBreakAHLetter){
            return false;
        }
        // WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
        if (c2Index < L - 1){
            var c3Index = this.characterIndexForWordBreakingAfterIndex(c2Index + 1, L);
            if (c3Index != null){
                c3 = this.unicodeAtIndex(c3Index);
            }
        }
        if (c3 !== null && c1.wordBreakAHLetter && (c2.wordBreakMidLetter || c2.wordBreakMidNumLetQ) && c3.wordBreakAHLetter){
            return false;
        }
        // WB7: AHLetter (MidLetter | MidNumLetQ) × AHLetter
        if (c1Index > 1){
            var c0Index = this.characterIndexForWordBreakingBeforeIndex(c1Index - 1);
            c0 = this.unicodeAtIndex(c0Index);
        }
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

    isGraphemeClusterBoundary: function(index, L){
        // GB1: sot ÷
        if (index === 0){
            return true;
        }
        // GB2: ÷ eot
        if (index >= L){
            return true;
        }
        var c1 = this.unicodeAtIndex(index - 1);
        var c2 = this.unicodeAtIndex(index);
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