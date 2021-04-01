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

    tokenize: function(input){
        var i = 0;
        var l = input.length;
        var isAtValidEscapeSequence = function(offset){
            if (offset === undefined){
                offset = 0;
            }
            var j = i + offset;
            return (j < l - 1) && input.charCodeAt(j) == 0x5C && !isNewline(input.charCodeAt(j + 1));
        };
        var isAtIdentifierStart = function(offset){
            if (offset === undefined){
                offset = 0;
            }
            var j = i + offset;
            if (j < l){
                var c = input.charCodeAt(j);
                if (isIdentifierStart(c)){
                    return true;
                }
                if (c == 0x2D){
                    if (j < l - 1){
                        c = input.charCodeAt(j + 1);
                        if (c == 0x2D || isIdentifierStart(c)){
                            return true;
                        }
                        if (isAtValidEscapeSequence(1)){
                            return true;
                        }
                        return false;
                    }
                    return false;
                }
                if (isAtValidEscapeSequence()){
                    return true;
                }
                return false;
            }
            return false;
        };
        var isAtNumber = function(offset){
            if (offset === undefined){
                offset = 0;
            }
            var j = i + offset;
            if (j < l){
                var c = input.charCodeAt(j);
                if (c == 0x2B || c == 0x2D){
                    if (j < l - 1 && isDigit(input.charCodeAt(j + 1))){
                        return true;
                    }
                    return j < l - 2 && input.charCodeAt(j + 1) == 0x2E && isDigit(input.charCodeAt(j + 2));
                }else if (c == 0x2E){
                    return j < l - 1 && isDigit(input.charCodeAt(j + 1));
                }else if (isDigit(c)){
                    return true;
                }
            }
            return false;
        };
        var consumeEscapedCodePoint = function(){
            ++i;
            var i0 = i;
            if (i < l){
                var c = input.charCodeAt(i);
                if (isHexDigit(c)){
                    ++i;
                    while (i < l && i < i0 + 6 && isHexDigit(input.charCodeAt(i))){
                        ++i;
                    }
                    var n = parseInt(input.substring(i0, i), 16);
                    if (isWhitespace(input.charCodeAt(i))){
                        ++i;
                    }
                    if (n === 0 || n > 0x10FFFF || (n >= 0xD800 && n <= 0xDFFF)){
                        return 0xFFFD;
                    }
                    return String.fromCodePoint(n);
                }else{
                    return input[i++];
                }
            }
            throw new Error("Found end of document in esape sequence");
        };
        var consumeIdentifier = function(){
            var value = "";
            var c;
            while (i < l){
                c = input.charCodeAt(i);
                if (isIdentifier(c)){
                    value += input[i];
                    ++i;
                }else if (isAtValidEscapeSequence()){
                    value += consumeEscapedCodePoint();
                }else{
                    return value;
                }
            }
            return value;
        };
        var consumeNumber = function(){
            var type = "integer";
            var str = "";
            var c = input.charCodeAt(i);
            if (c == 0x2B || c == 0x2D){
                str += input[i];
                ++i;
            }
            while (i < l && isDigit(input.charCodeAt(i))){
                str += input[i];
                ++i;
            }
            if (i < l - 1){
                if (input.charCodeAt(i) == 0x2E && isDigit(input.charCodeAt(i + 1))){
                    type = "number";
                    str += input[i];
                    ++i;
                    while (i < l && isDigit(input.charCodeAt(i))){
                        str += input[i];
                        ++i;
                    }
                }
            }
            if (i < l - 1){
                if ((input.charCodeAt(i) == 0x45) || (input.charCodeAt(i) == 0x65)){
                    if (isDigit(input.charCodeAt(i + 1))){
                        type = "number";
                        str += input[i];
                        ++i;
                        while (isDigit(input.charCodeAt(i))){
                            str += input[i];
                            ++i;
                        }
                    }else if (i < l -2 && input.charCodeAt(i + 1) == 0x2E && isDigit(input.charCodeAt(i + 2))){
                        type = "number";
                        str += input[i];
                        ++i;
                        str += input[i];
                        ++i;
                        while (isDigit(input.charCodeAt(i))){
                            str += input[i];
                            ++i;
                        }
                    }
                }
            }
            return {type: type, str: str};
        };
        var consumeNumeric = function(){
            var info = consumeNumber();
            var n;
            if (info.type === "integer"){
                n = parseInt(info.str);
            }else{
                n = parseFloat(info.str);
            }
            if (i < l){
                if (isAtIdentifierStart()){
                    var units = consumeIdentifier();
                    return new CSSTokenizer.DimensionToken(n, units);
                }
                var c = input.charCodeAt(i);
                if (c === 0x25){
                    ++i;
                    return new CSSTokenizer.PercentageToken(n);
                }
            }
            return new CSSTokenizer.NumberToken(n);
        };
        var consumeURL = function(){
            var url = "";
            var c;
            while (i < l && isWhitespace(input.charCodeAt(i))){
                ++i;
            }
            while (i < l){
                c = input.charCodeAt(i);
                if (c == 0x29){
                    ++i;
                    return new CSSTokenizer.URLToken(url);
                }else if (isWhitespace(c)){
                    ++i;
                    while (i < l && isWhitespace(input.charCodeAt(i))){
                        ++i;
                    }
                    if (i < l){
                        if (input.charCodeAt(i) == 0x29){
                            ++i;
                            return new CSSTokenizer.URLToken(url);
                        }
                        throw new Error("Expecting ) to end url at %d".sprintf(i));
                    }
                    throw new Error("Found end of document before end of url");
                }else if (c == 0x22 || c == 0x27 || c == 0x28){
                    throw new Error("Unexpected %s in url at %d".sprintf(input[i], i));
                }else if (c == 0x5C){
                    if (isAtValidEscapeSequence()){
                        url += consumeEscapedCodePoint();
                    }else{
                        throw new Error("Bad escape sequence in url at %d".sprintf(i));
                    }
                }else{
                    url += input[i];
                    ++i;
                }
            }
            throw new Error("Found end of document before end of url");
        };
        var consumeIdentifierLike = function(){
            var identifier = consumeIdentifier();
            if (i < l){
                var c = input.charCodeAt(i);
                var lower = identifier.toLowerCase();
                if (lower == "url" && c == 0x28){
                    ++i;
                    if (i < l && isWhitespace(input.charCodeAt(i))){
                        ++i;
                        if (i < l && isWhitespace(input.charCodeAt(i))){
                            ++i;
                        }
                    }
                    if (i < l){
                        c = input.charCodeAt(i);
                        if (isWhitespace(c) && i < l - 1){
                            c = input.charCodeAt(i + 1);
                        }
                        if (c == 0x22 || c == 0x27){
                            return new CSSTokenizer.FunctionToken(identifier);
                        }
                        return consumeURL();
                    }
                }else if (c == 0x28){
                    ++i;
                    return new CSSTokenizer.FunctionToken(identifier);
                }
            }
            return new CSSTokenizer.IdentifierToken(identifier);
        };
        var consume = function(){
            var i0 = i;
            var c = input.charCodeAt(i);
            var str;
            var quote;
            if (i < l - 1 && c == 0x2F && input.charCodeAt(i + 1) == 0x2A){
                i += 2;
                while (i < l - 1 && (input.charCodeAt(i) != 0x2A || input.charCodeAt(i + 1) != 0x2F)){
                    ++i;
                }
                if (i < l - 1){
                    i += 2;
                    return new CSSTokenizer.CommentToken(input.substring(i0 + 2, i - 2));
                }
                throw new Error("Found end of document before end of comment");
            }else if (isWhitespace(c)){
                ++i;
                while (i < l && isWhitespace(input.charCodeAt(i))){
                    ++i;
                }
                return new CSSTokenizer.WhitespaceToken(input.substring(i0, i));
            }else if (c == 0x22 || c == 0x27){
                quote = c;
                ++i;
                str = "";
                while (i < l){
                    c = input.charCodeAt(i);
                    if (c == quote){
                        ++i;
                        return new CSSTokenizer.StringToken(input[i0], str);
                    }else if (isNewline(c)){
                        throw new Error("String includes unescaped newline at %d".sprintf(i));
                    }else if (c == 0x5C){
                        ++i;
                        if (i < l){
                            c = input.charCodeAt(i);
                            // check for CRLF before checking for just CR
                            // (adjustment to spec algorithm because we're not
                            // preprocessing away the CRLFs)
                            if (c == 0x0D){
                                ++i;
                                if (i < l && input.charCodeAt(i) == 0x0A){
                                    ++i;
                                }
                            }else if (isNewline(c)){
                                ++i;
                            }else{
                                str += input[i];
                                ++i;
                            }
                        }
                    }else{
                        str += input[i];
                        ++i;   
                    }
                }
                throw new Error("Found end of document before end of string");
            }else if (c == 0x23){
                ++i;
                if (i < l){
                    c = input.charCodeAt(i);
                    if (isIdentifier(c) || isAtValidEscapeSequence()){
                        if (isAtIdentifierStart()){
                            str = consumeIdentifier();
                            return new CSSTokenizer.HashToken("id", str);
                        }else{
                            str = consumeIdentifier();
                            return new CSSTokenizer.HashToken(null, str);
                        }
                    }else{
                        return new CSSTokenizer.DelimToken("#");
                    }
                }else{
                    return new CSSTokenizer.DelimToken("#");
                }
            }else if (c == 0x28){
                ++i;
                return new CSSTokenizer.OpenParenToken();
            }else if (c == 0x29){
                ++i;
                return new CSSTokenizer.CloseParenToken();
            }else if (c == 0x2B){
                if (isAtNumber()){
                    return consumeNumeric();
                }
                ++i;
                return new CSSTokenizer.DelimToken("+");
            }else if (c == 0x2C){
                ++i;
                return new CSSTokenizer.CommaToken();
            }else if (c == 0x2D){
                if (isAtNumber()){
                    return consumeNumeric();
                }
                if (i < l - 2 && input.charCodeAt(i + 1) == 0x2D && input.charCodeAt(i + 2) == 0x3E){
                    i += 3;
                    return new CSSTokenizer.CDCToken();
                }
                if (isAtIdentifierStart()){
                    return consumeIdentifierLike();
                }
                ++i;
                return new CSSTokenizer.DelimToken("-");
            }else if (c == 0x2E){
                if (isAtNumber()){
                    return consumeNumeric();
                }
                ++i;
                return new CSSTokenizer.DelimToken(".");
            }else if (c == 0x3A){
                ++i;
                return new CSSTokenizer.ColonToken();
            }else if (c == 0x3B){
                ++i;
                return new CSSTokenizer.SemicolonToken();
            }else if (c == 0x3C){
                ++i;
                if (i < l - 2 && input.charCodeAt(i) == 0x21 && input.charCodeAt(i + 1) == 0x2D && input.charCodeAt(i + 2) == 0x2D){
                    i += 3;
                    return new CSSTokenizer.CDOToken();
                }
                return new CSSTokenizer.DelimToken("<");
            }else if (c == 0x40){
                ++i;
                if (isAtIdentifierStart()){
                    str = consumeIdentifier();
                    return new CSSTokenizer.AtKeywordToken(str);
                }
                return new CSSTokenizer.DelimToken("@");
            }else if (c == 0x5B){
                ++i;
                return new CSSTokenizer.OpenSquareToken();
            }else if (c == 0x5C){
                if (isAtValidEscapeSequence()){
                    return consumeIdentifierLike();
                }
                throw new Error("Bad escape sequence at %d".sprintf(i));
            }else if (c == 0x5D){
                ++i;
                return new CSSTokenizer.CloseSquareToken();
            }else if (c == 0x7B){
                ++i;
                return new CSSTokenizer.OpenCurlyToken();
            }else if (c == 0x7D){
                ++i;
                return new CSSTokenizer.CloseCurlyToken();
            }else if (isDigit(c)){
                return consumeNumeric();
            }else if (isIdentifierStart(c)){
                return consumeIdentifierLike();
            }else{
                str = input[i];
                ++i;
                return new CSSTokenizer.DelimToken(str);
            }
        };
        var tokens = [];
        var token;
        while (i < l){
            token = consume();
            tokens.push(token);
        }
        return tokens;
    }

});

var isUpperCase = function(code){
    return (code >= 0x41 && code <= 0x5A);
};

var isLowerCase = function(code){
    return (code >= 0x61 && code <= 0x7A);
};

var isDigit = function(code){
    return (code >= 0x30 && code <= 0x39);
};

var isHexDigit = function(code){
    return isDigit(code) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66);
};

var isLetter = function(code){
    return isUpperCase(code) || isLowerCase(code);
};

var isNonASCII = function(code){
    return code >= 0x80;
};

var isIdentifierStart = function(code){
    return isLetter(code) || isNonASCII(code) || code == 0x5F;
};

var isIdentifier = function(code){
    return isIdentifierStart(code) || isDigit(code) || code == 0x2D;
};

var isWhitespace = function(code){
    return code == 0x20 || code == 0x09 || code == 0x0A || code == 0x0D || code == 0x0C;
};

var isNewline = function(code){
    return code == 0x0A || code == 0x0D || code == 0x0C;
};

CSSTokenizer.CommentToken = function(text){
    this.text = text;
    this.toString = function(){
        return "/*" + this.text + "*/";
    };
};

CSSTokenizer.IdentifierToken = function(name){
    this.name = name;
    this.toString = function(){
        // FIXME: escape sequences
        return this.name;
    };
};

CSSTokenizer.FunctionToken = function(name){
    this.name = name;
    this.toString = function(){
        // FIXME: escape sequences
        return this.name + "(";
    };
};

CSSTokenizer.AtKeywordToken = function(name){
    this.name = name;
    this.toString = function(){
        // FIXME: escape sequences
        return "@" + this.name;
    };
};

CSSTokenizer.HashToken = function(type, name){
    this.type = type;
    this.name = name;
    this.toString = function(){
        // FIXME: escape sequences
        return "#" + this.name;
    };
};

CSSTokenizer.StringToken = function(quote, value){
    this.quote = quote;
    this.value = value;
    this.toString = function(){
        // FIXME: escape sequences
        return this.quote + this.value.replace(this.quote, "\\" + this.quote) + this.quote;
    };
};

CSSTokenizer.URLToken = function(url){
    this.url = url;
    this.toString = function(){
        // FIXME: escape sequences
        return "url(" + this.url + ")";
    };
};

CSSTokenizer.WhitespaceToken = function(whitespace){
    this.whitespace = whitespace;
    this.toString = function(){
        return this.whitespace;
    };
};

CSSTokenizer.OpenParenToken = function(){
    this.toString = function(){
        return "(";
    };
};

CSSTokenizer.CloseParenToken = function(){
    this.toString = function(){
        return ")";
    };
};

CSSTokenizer.CommaToken = function(){
    this.toString = function(){
        return ",";
    };
};

CSSTokenizer.ColonToken = function(){
    this.toString = function(){
        return ":";
    };
};

CSSTokenizer.SemicolonToken = function(){
    this.toString = function(){
        return ";";
    };
};

CSSTokenizer.DimensionToken = function(value, units){
    this.value = value;
    this.units = units;
    this.toString = function(){
        // FIXME: escape sequences units
        return this.value.toString() + this.units;
    };
};

CSSTokenizer.PercentageToken = function(value){
    this.value = value;
    this.toString = function(){
        return this.value.toString() + "%";
    };
};

CSSTokenizer.NumberToken = function(value){
    this.value = value;
    this.toString = function(){
        return this.value.toString();
    };
};

CSSTokenizer.CDCToken = function(){
    this.toString = function(){
        return "-->";
    };
};

CSSTokenizer.CDOToken = function(){
    this.toString = function(){
        return "<!--";
    };
};

CSSTokenizer.OpenSquareToken = function(){
    this.toString = function(){
        return "[";
    };
};

CSSTokenizer.CloseSquareToken = function(){
    this.toString = function(){
        return "]";
    };
};

CSSTokenizer.OpenCurlyToken = function(){
    this.toString = function(){
        return "{";
    };
};

CSSTokenizer.CloseCurlyToken = function(){
    this.toString = function(){
        return "}";
    };
};

CSSTokenizer.DelimToken = function(char){
    this.char = char;
    this.toString = function(){
        return this.char;
    };
};

})();