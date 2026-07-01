// Copyright 2021 Breakside Inc.
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

// #import Foundation
"use strict";

(function(){

JSClass("CSSTokenizer", JSObject, {

    cssText: "",
    offset: 0,
    length: 0,

    initWithCSSText: function(cssText){
        this.cssText = cssText;
        this.length = this.cssText.length;
    },

    isAtValidEscapeSequence: function(offset){
        if (offset === undefined){
            offset = 0;
        }
        var i = this.offset + offset;
        return (i < this.length - 1) && this.cssText.charCodeAt(i) == 0x5C && !CSSTokenizer.isNewline(this.cssText.charCodeAt(i + 1));
    },

    isAtIdentifierStart: function(offset){
        if (offset === undefined){
            offset = 0;
        }
        var i = this.offset + offset;
        if (i < this.length){
            var c = this.cssText.charCodeAt(i);
            if (CSSTokenizer.isIdentifierStart(c)){
                return true;
            }
            if (c == 0x2D){
                if (i < this.length - 1){
                    c = this.cssText.charCodeAt(i + 1);
                    if (c == 0x2D || CSSTokenizer.isIdentifierStart(c)){
                        return true;
                    }
                    if (this.isAtValidEscapeSequence(1)){
                        return true;
                    }
                    return false;
                }
                return false;
            }
            if (this.isAtValidEscapeSequence()){
                return true;
            }
            return false;
        }
        return false;
    },

    isAtNumber: function(offset){
        if (offset === undefined){
            offset = 0;
        }
        var i = this.offset + offset;
        if (i < this.length){
            var c = this.cssText.charCodeAt(i);
            if (c == 0x2B || c == 0x2D){
                if (i < this.length - 1 && CSSTokenizer.isDigit(this.cssText.charCodeAt(i + 1))){
                    return true;
                }
                return i < this.length - 2 && this.cssText.charCodeAt(i + 1) == 0x2E && CSSTokenizer.isDigit(this.cssText.charCodeAt(i + 2));
            }else if (c == 0x2E){
                return i < this.length - 1 && CSSTokenizer.isDigit(this.cssText.charCodeAt(i + 1));
            }else if (CSSTokenizer.isDigit(c)){
                return true;
            }
        }
        return false;
    },

    consumeEscapedCodePoint: function(){
        ++this.offset;
        var i0 = this.offset;
        if (this.offset < this.length){
            var c = this.cssText.charCodeAt(this.offset);
            if (CSSTokenizer.isHexDigit(c)){
                ++this.offset;
                while (this.offset < this.length && this.offset < i0 + 6 && CSSTokenizer.isHexDigit(this.cssText.charCodeAt(this.offset))){
                    ++this.offset;
                }
                var n = parseInt(this.cssText.substring(i0, this.offset), 16);
                if (CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
                    ++this.offset;
                }
                if (n === 0 || n > 0x10FFFF || (n >= 0xD800 && n <= 0xDFFF)){
                    return 0xFFFD;
                }
                return String.fromCodePoint(n);
            }else{
                return this.cssText[this.offset++];
            }
        }
        throw new Error("Found end of document in esape sequence");
    },

    consumeIdentifier: function(){
        var value = "";
        var c;
        while (this.offset < this.length){
            c = this.cssText.charCodeAt(this.offset);
            if (CSSTokenizer.isIdentifier(c)){
                value += this.cssText[this.offset];
                ++this.offset;
            }else if (this.isAtValidEscapeSequence()){
                value += this.consumeEscapedCodePoint();
            }else{
                return value;
            }
        }
        return value;
    },

    consumeNumber: function(){
        var type = "integer";
        var str = "";
        var c = this.cssText.charCodeAt(this.offset);
        if (c == 0x2B || c == 0x2D){
            str += this.cssText[this.offset];
            ++this.offset;
        }
        while (this.offset < this.length && CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset))){
            str += this.cssText[this.offset];
            ++this.offset;
        }
        if (this.offset < this.length - 1){
            if (this.cssText.charCodeAt(this.offset) == 0x2E && CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset + 1))){
                type = "number";
                str += this.cssText[this.offset];
                ++this.offset;
                while (this.offset < this.length && CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset))){
                    str += this.cssText[this.offset];
                    ++this.offset;
                }
            }
        }
        if (this.offset < this.length - 1){
            if ((this.cssText.charCodeAt(this.offset) == 0x45) || (this.cssText.charCodeAt(this.offset) == 0x65)){
                if (CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset + 1))){
                    type = "number";
                    str += this.cssText[this.offset];
                    ++this.offset;
                    while (CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset))){
                        str += this.cssText[this.offset];
                        ++this.offset;
                    }
                }else if (this.offset < this.length -2 && this.cssText.charCodeAt(this.offset + 1) == 0x2E && CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset + 2))){
                    type = "number";
                    str += this.cssText[this.offset];
                    ++this.offset;
                    str += this.cssText[this.offset];
                    ++this.offset;
                    while (CSSTokenizer.isDigit(this.cssText.charCodeAt(this.offset))){
                        str += this.cssText[this.offset];
                        ++this.offset;
                    }
                }
            }
        }
        return {type: type, str: str};
    },

    consumeNumeric: function(){
        var info = this.consumeNumber();
        var n;
        if (info.type === "integer"){
            n = parseInt(info.str);
        }else{
            n = parseFloat(info.str);
        }
        if (this.offset < this.length){
            if (this.isAtIdentifierStart()){
                var units = this.consumeIdentifier();
                return new CSSDimensionToken(n, units);
            }
            var c = this.cssText.charCodeAt(this.offset);
            if (c === 0x25){
                ++this.offset;
                return new CSSPercentageToken(n);
            }
        }
        return new CSSNumberToken(n);
    },

    consumeURL: function(){
        var url = "";
        var c;
        while (this.offset < this.length && CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
            ++this.offset;
        }
        while (this.offset < this.length){
            c = this.cssText.charCodeAt(this.offset);
            if (c == 0x29){
                ++this.offset;
                return new CSSURLToken(url);
            }else if (CSSTokenizer.isWhitespace(c)){
                ++this.offset;
                while (this.offset < this.length && CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
                    ++this.offset;
                }
                if (this.offset < this.length){
                    if (this.cssText.charCodeAt(this.offset) == 0x29){
                        ++this.offset;
                        return new CSSURLToken(url);
                    }
                    throw new Error("Expecting ) to end url at %d".sprintf(this.offset));
                }
                throw new Error("Found end of document before end of url");
            }else if (c == 0x22 || c == 0x27 || c == 0x28){
                throw new Error("Unexpected %s in url at %d".sprintf(this.cssText[this.offset], this.offset));
            }else if (c == 0x5C){
                if (this.isAtValidEscapeSequence()){
                    url += this.consumeEscapedCodePoint();
                }else{
                    throw new Error("Bad escape sequence in url at %d".sprintf(this.offset));
                }
            }else{
                url += this.cssText[this.offset];
                ++this.offset;
            }
        }
        throw new Error("Found end of document before end of url");
    },

    consumeIdentifierLike: function(){
        var identifier = this.consumeIdentifier();
        if (this.offset < this.length){
            var c = this.cssText.charCodeAt(this.offset);
            var lower = identifier.toLowerCase();
            if (lower == "url" && c == 0x28){
                ++this.offset;
                if (this.offset < this.length && CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
                    ++this.offset;
                    if (this.offset < this.length && CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
                        ++this.offset;
                    }
                }
                if (this.offset < this.length){
                    c = this.cssText.charCodeAt(this.offset);
                    if (CSSTokenizer.isWhitespace(c) && this.offset < this.length - 1){
                        c = this.cssText.charCodeAt(this.offset + 1);
                    }
                    if (c == 0x22 || c == 0x27){
                        return new CSSFunctionToken(identifier);
                    }
                    return this.consumeURL();
                }
            }else if (c == 0x28){
                ++this.offset;
                return new CSSFunctionToken(identifier);
            }
        }
        return new CSSIdentifierToken(identifier);
    },

    consume: function(){
        var i0 = this.offset;
        var c = this.cssText.charCodeAt(this.offset);
        var str;
        var quote;
        if (this.offset < this.length - 1 && c == 0x2F && this.cssText.charCodeAt(this.offset + 1) == 0x2A){
            this.offset += 2;
            while (this.offset < this.length - 1 && (this.cssText.charCodeAt(this.offset) != 0x2A || this.cssText.charCodeAt(this.offset + 1) != 0x2F)){
                ++this.offset;
            }
            if (this.offset < this.length - 1){
                this.offset += 2;
                return new CSSCommentToken(this.cssText.substring(i0 + 2, this.offset - 2));
            }
            throw new Error("Found end of document before end of comment");
        }else if (CSSTokenizer.isWhitespace(c)){
            ++this.offset;
            while (this.offset < this.length && CSSTokenizer.isWhitespace(this.cssText.charCodeAt(this.offset))){
                ++this.offset;
            }
            return new CSSWhitespaceToken(this.cssText.substring(i0, this.offset));
        }else if (c == 0x22 || c == 0x27){
            quote = c;
            ++this.offset;
            str = "";
            while (this.offset < this.length){
                c = this.cssText.charCodeAt(this.offset);
                if (c == quote){
                    ++this.offset;
                    return new CSSStringToken(this.cssText[i0], str);
                }else if (CSSTokenizer.isNewline(c)){
                    throw new Error("String includes unescaped newline at %d".sprintf(this.offset));
                }else if (c == 0x5C){
                    ++this.offset;
                    if (this.offset < this.length){
                        c = this.cssText.charCodeAt(this.offset);
                        // check for CRLF before checking for just CR
                        // (adjustment to spec algorithm because we're not
                        // preprocessing away the CRLFs)
                        if (c == 0x0D){
                            ++this.offset;
                            if (this.offset < this.length && this.cssText.charCodeAt(this.offset) == 0x0A){
                                ++this.offset;
                            }
                        }else if (CSSTokenizer.isNewline(c)){
                            ++this.offset;
                        }else{
                            str += this.cssText[this.offset];
                            ++this.offset;
                        }
                    }
                }else{
                    str += this.cssText[this.offset];
                    ++this.offset;
                }
            }
            throw new Error("Found end of document before end of string");
        }else if (c == 0x23){
            ++this.offset;
            if (this.offset < this.length){
                c = this.cssText.charCodeAt(this.offset);
                if (CSSTokenizer.isIdentifier(c) || this.isAtValidEscapeSequence()){
                    if (this.isAtIdentifierStart()){
                        str = this.consumeIdentifier();
                        return new CSSHashToken("id", str);
                    }else{
                        str = this.consumeIdentifier();
                        return new CSSHashToken(null, str);
                    }
                }else{
                    return new CSSDelimToken("#");
                }
            }else{
                return new CSSDelimToken("#");
            }
        }else if (c == 0x28){
            ++this.offset;
            return new CSSOpenParenToken();
        }else if (c == 0x29){
            ++this.offset;
            return new CSSCloseParenToken();
        }else if (c == 0x2B){
            if (this.isAtNumber()){
                return this.consumeNumeric();
            }
            ++this.offset;
            return new CSSDelimToken("+");
        }else if (c == 0x2C){
            ++this.offset;
            return new CSSCommaToken();
        }else if (c == 0x2D){
            if (this.isAtNumber()){
                return this.consumeNumeric();
            }
            if (this.offset < this.length - 2 && this.cssText.charCodeAt(this.offset + 1) == 0x2D && this.cssText.charCodeAt(this.offset + 2) == 0x3E){
                this.offset += 3;
                return new CSSCDCToken();
            }
            if (this.isAtIdentifierStart()){
                return this.consumeIdentifierLike();
            }
            ++this.offset;
            return new CSSDelimToken("-");
        }else if (c == 0x2E){
            if (this.isAtNumber()){
                return this.consumeNumeric();
            }
            ++this.offset;
            return new CSSDelimToken(".");
        }else if (c == 0x3A){
            ++this.offset;
            return new CSSColonToken();
        }else if (c == 0x3B){
            ++this.offset;
            return new CSSSemicolonToken();
        }else if (c == 0x3C){
            ++this.offset;
            if (this.offset < this.length - 2 && this.cssText.charCodeAt(this.offset) == 0x21 && this.cssText.charCodeAt(this.offset + 1) == 0x2D && this.cssText.charCodeAt(this.offset + 2) == 0x2D){
                this.offset += 3;
                return new CSSCDOToken();
            }
            return new CSSDelimToken("<");
        }else if (c == 0x40){
            ++this.offset;
            if (this.isAtIdentifierStart()){
                str = this.consumeIdentifier();
                return new CSSAtKeywordToken(str);
            }
            return new CSSDelimToken("@");
        }else if (c == 0x5B){
            ++this.offset;
            return new CSSOpenSquareToken();
        }else if (c == 0x5C){
            if (this.isAtValidEscapeSequence()){
                return this.consumeIdentifierLike();
            }
            throw new Error("Bad escape sequence at %d".sprintf(this.offset));
        }else if (c == 0x5D){
            ++this.offset;
            return new CSSCloseSquareToken();
        }else if (c == 0x7B){
            ++this.offset;
            return new CSSOpenCurlyToken();
        }else if (c == 0x7D){
            ++this.offset;
            return new CSSCloseCurlyToken();
        }else if (CSSTokenizer.isDigit(c)){
            return this.consumeNumeric();
        }else if (CSSTokenizer.isIdentifierStart(c)){
            return this.consumeIdentifierLike();
        }else{
            str = this.cssText[this.offset];
            ++this.offset;
            return new CSSDelimToken(str);
        }
    },

    next: function(){
        if (this.offset < this.length){
            var token = this.consume();
            return token;
        }
        return null;
    },

    tokenize: function(){
        var tokens = [];
        var token = this.next();
        while (token !== null){
            tokens.push(token);
            token = this.next();
        }
        return tokens;
    }

});

CSSTokenizer.isUpperCase = function(code){
    return (code >= 0x41 && code <= 0x5A);
};

CSSTokenizer.isLowerCase = function(code){
    return (code >= 0x61 && code <= 0x7A);
};

CSSTokenizer.isDigit = function(code){
    return (code >= 0x30 && code <= 0x39);
};

CSSTokenizer.isHexDigit = function(code){
    return CSSTokenizer.isDigit(code) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66);
};

CSSTokenizer.isLetter = function(code){
    return CSSTokenizer.isUpperCase(code) || CSSTokenizer.isLowerCase(code);
};

CSSTokenizer.isNonASCII = function(code){
    return code >= 0x80;
};

CSSTokenizer.isIdentifierStart = function(code){
    return CSSTokenizer.isLetter(code) || CSSTokenizer.isNonASCII(code) || code == 0x5F;
};

CSSTokenizer.isIdentifier = function(code){
    return CSSTokenizer.isIdentifierStart(code) || CSSTokenizer.isDigit(code) || code == 0x2D;
};

CSSTokenizer.isWhitespace = function(code){
    return code == 0x20 || code == 0x09 || code == 0x0A || code == 0x0D || code == 0x0C;
};

CSSTokenizer.isNewline = function(code){
    return code == 0x0A || code == 0x0D || code == 0x0C;
};

JSGlobalObject.CSSCommentToken = function CSSCommentToken(text){
    this.text = text;
};

Object.defineProperties(CSSCommentToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCommentToken_toString(){
            return "/*" + this.text + "*/";
        }
    }
});

JSGlobalObject.CSSIdentifierToken = function CSSIdentifierToken(name){
    this.name = name;
};

Object.defineProperties(CSSIdentifierToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSIdentifierToken_toString(){
            // FIXME: escape sequences
            return this.name;
        }
    }
});

JSGlobalObject.CSSFunctionToken = function CSSFunctionToken(name){
    this.name = name;
};

Object.defineProperties(CSSFunctionToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSFunctionToken_toString(){
            // FIXME: escape sequences
            return this.name + "(";
        }
    }
});

JSGlobalObject.CSSAtKeywordToken = function CSSAtKeywordToken(name){
    this.name = name;
};

Object.defineProperties(CSSAtKeywordToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSAtKeywordToken_toString(){
            // FIXME: escape sequences
            return "@" + this.name;
        }
    }
});

JSGlobalObject.CSSHashToken = function CSSHashToken(type, name){
    this.type = type;
    this.name = name;
};

Object.defineProperties(CSSHashToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSHashToken_toString(){
            // FIXME: escape sequences
            return "#" + this.name;
        }
    }
});

JSGlobalObject.CSSStringToken = function CSSStringToken(quote, value){
    this.quote = quote;
    this.value = value;
};

Object.defineProperties(CSSStringToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSStringToken_toString(){
            // FIXME: escape sequences
            return this.quote + this.value.replace(this.quote, "\\" + this.quote) + this.quote;
        }
    }
});

JSGlobalObject.CSSURLToken = function CSSURLToken(url){
    this.url = url;
};

Object.defineProperties(CSSURLToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSURLToken_toString(){
            // FIXME: escape sequences
            return "url(" + this.url + ")";
        }
    }
});

JSGlobalObject.CSSWhitespaceToken = function CSSWhitespaceToken(whitespace){
    this.whitespace = whitespace;
};

Object.defineProperties(CSSWhitespaceToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSWhitespaceToken_toString(){
            return this.whitespace;
        }
    }
});

JSGlobalObject.CSSOpenParenToken = function CSSOpenParenToken(){
};

Object.defineProperties(CSSOpenParenToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSOpenParenToken_toString(){
            return "(";
        }
    }
});

JSGlobalObject.CSSCloseParenToken = function CSSCloseParenToken(){
};

Object.defineProperties(CSSCloseParenToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCloseParenToken_toString(){
            return ")";
        }
    }
});

JSGlobalObject.CSSCommaToken = function CSSCommaToken(){
};

Object.defineProperties(CSSCommaToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCommaToken_toString(){
            return ",";
        }
    }
});

JSGlobalObject.CSSColonToken = function CSSColonToken(){
};

Object.defineProperties(CSSColonToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSColonToken_toString(){
            return ":";
        }
    }
});

JSGlobalObject.CSSSemicolonToken = function CSSSemicolonToken(){
};

Object.defineProperties(CSSSemicolonToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSSemicolonToken_toString(){
            return ";";
        }
    }
});

JSGlobalObject.CSSDimensionToken = function CSSDimensionToken(value, units){
    this.value = value;
    this.units = units;
};

Object.defineProperties(CSSDimensionToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSDimensionToken_toString(){
            // FIXME: escape sequences units
            return this.value.toString() + this.units;
        }
    }
});

JSGlobalObject.CSSPercentageToken = function CSSPercentageToken(value){
    this.value = value;
};

Object.defineProperties(CSSPercentageToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSPercentageToken_toString(){
            return this.value.toString() + "%";
        }
    }
});

JSGlobalObject.CSSNumberToken = function CSSNumberToken(value){
    this.value = value;
};

Object.defineProperties(CSSNumberToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSNumberToken_toString(){
            return this.value.toString();
        }
    }
});

JSGlobalObject.CSSCDCToken = function CSSCDCToken(){
};

Object.defineProperties(CSSCDCToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCDCToken_toString(){
            return "-->";
        }
    }
});

JSGlobalObject.CSSCDOToken = function CSSCDOToken(){
};

Object.defineProperties(CSSCDOToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCDOToken_toString(){
            return "<!--";
        }
    }
});

JSGlobalObject.CSSOpenSquareToken = function CSSOpenSquareToken(){
};

Object.defineProperties(CSSOpenSquareToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSOpenSquareToken_toString(){
            return "[";
        }
    }
});

JSGlobalObject.CSSCloseSquareToken = function CSSCloseSquareToken(){
};

Object.defineProperties(CSSCloseSquareToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCloseSquareToken_toString(){
            return "]";
        }
    }
});

JSGlobalObject.CSSOpenCurlyToken = function CSSOpenCurlyToken(){
};

Object.defineProperties(CSSOpenCurlyToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSOpenCurlyToken_toString(){
            return "{";
        }
    }
});

JSGlobalObject.CSSCloseCurlyToken = function CSSCloseCurlyToken(){
};

Object.defineProperties(CSSCloseCurlyToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSCloseCurlyToken_toString(){
            return "}";
        }
    }
});

JSGlobalObject.CSSDelimToken = function CSSDelimToken(char){
    this.char = char;
};

Object.defineProperties(CSSDelimToken.prototype, {
    toString: {
        enumerable: false,
        value: function CSSDelimToken_toString(){
            return this.char;
        }
    }
});

})();