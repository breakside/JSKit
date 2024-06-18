// #import "JSObject.js"
// #import "JSProtocol.js"
// #import "JSFont.js"
"use strict";

JSProtocol("JSHTMLTextParserDelegate", JSProtocol, {

    htmlTextParserDidFindAttributedText: function(parser, text, attributes){
    },

});

(function(){

JSClass("JSHTMLTextParser", JSObject, {

    html: null,
    offset: null,
    length: null,
    delegate: null,

    initWithHTML: function(html){
        this.html = html;
        this.offset = 0;
        this.length = this.html.length;
        this.state = Object.create(JSHTMLTextParser.State);
        this.state.textAttributes = {};
        this.stack = [this.state];
    },

    parse: function(){
        var html = this.html;
        var i = this.offset;
        var l = this.length;
        if (html === null || html === undefined){
            return;
        }
        var elementName;
        var entityName;
        var attrName;
        var attrValue;
        var quote;
        var elementAttributes;
        var selfClosing = false;
        while (i < l){
            if (this.state.ignoringUntilEndTag){
                if (html[i] === "<"){
                    ++i;
                    if (i < l && html[i] === "/"){
                        ++i;
                        if (html.substr(i, this.state.elementName.length).toLowerCase() === this.state.elementName){
                            i += this.state.elementName.length;
                            if (i < l && html[i] === ">"){
                                ++i;
                                this.popState();
                            }
                        }
                    }
                }else{
                    ++i;
                }
            }else if (html[i] === "<"){
                ++i;
                if (i < l){
                    if (isAlphabetic(html[i])){
                        elementName = "";
                        while (i < l && html[i] !== "/" && html[i] !== ">" && !isWhitespace(html[i])){
                            if ((html[i] >= "A" && html[i] <= "Z")){
                                elementName += html[i].toLowerCase();
                            }else{
                                elementName += html[i];
                            }
                            ++i;
                        }
                        elementAttributes = {};
                        selfClosing = isVoidElement(elementName);
                        if (i < l && html[i] === "/"){
                            ++i;
                        }
                        while (i < l && html[i] !== ">"){
                            while (i < l && isWhitespace(html[i])){
                                ++i;
                            }
                            attrName = "";
                            attrValue = "";
                            while (i < l && html[i] !== "=" && html[i] !== "/" && html[i] !== ">" && !isWhitespace(html[i])){
                                attrName += html[i];
                                ++i;
                            }
                            while (i < l && isWhitespace(html[i])){
                                ++i;
                            }
                            if (i < l && html[i] === "="){
                                ++i;
                                if (i < l && html[i] !== ">"){
                                    if (html[i] === "\"" || html[i] === "'"){
                                        quote = html[i];
                                        ++i;
                                        while (i < l && html[i] !== quote){
                                            if (html[i] === "&"){
                                                entityName = "";
                                                while (i < l && (isEntityCharacter(html[i]))){
                                                    entityName += html[i];
                                                    ++i;
                                                }
                                                if (i < l && html[i] === ";"){
                                                    ++i;
                                                    attrValue += decodedEntity(entityName);
                                                }else{
                                                    attrValue += "&" + entityName;
                                                }
                                            }else{
                                                attrValue += html[i];
                                                ++i;
                                            }
                                        }
                                        ++i;
                                    }else{
                                        while (i < l && html[i] !== "/" && html[i] !== ">" && !isWhitespace(html[i])){
                                            attrValue += html[i];
                                            ++i;
                                        }
                                    }
                                }
                            }
                            if (i < l && html[i] === "/"){
                                ++i;
                            }
                            elementAttributes[attrName] = attrValue;
                        }
                        ++i;
                        this.beginElement(elementName, elementAttributes, selfClosing);
                    }else if (html[i] === "/"){
                        ++i;
                        elementName = "";
                        if (isAlphabetic(html[i])){
                            while (i < l && html[i] !== "/" && html[i] !== ">" && !isWhitespace(html[i])){
                                if ((html[i] >= "A" && html[i] <= "Z")){
                                    elementName += html[i].toLowerCase();
                                }else{
                                    elementName += html[i];
                                }
                                ++i;
                            }
                        }
                        while (i < l && html[i] !== ">"){
                            ++i;
                        }
                        ++i;
                        this.endElement(elementName);
                    }else if (html[i] === "!" || html[i] === "?"){
                        // valid comments or bogus markup...skipping
                        // <!--
                        // <!DOCTYPE
                        // <![CDATA[
                        // <?xml
                        ++i;
                        while (i < l && html[i] !== ">"){
                            ++i;
                        }
                        ++i;
                    }else{
                        this.handleText("<");
                    }
                }else{
                    this.handleText("<");
                }
            }else if (html[i] === "&"){
                ++i;
                entityName = "";
                while (i < l && (isEntityCharacter(html[i]))){
                    entityName += html[i];
                    ++i;
                }
                if (i < l && html[i] === ";"){
                    ++i;
                    this.handleText(decodedEntity(entityName));
                }else{
                    this.handleText("&" + entityName);
                }
            }else{
                if (this.state.preserveWhitespace){
                    this.handleText(html[i]);
                }else{
                    if (isWhitespace(html[i])){
                        if (this.trailingWhitespace === ""){
                            this.handleTrailingWhitespace(html[i]);
                        }
                    }else{
                        this.handleText(html[i]);
                    }
                }
                ++i;
            }
        }
        this.flush();
    },

    beginElement: function(elementName, elementAttributes, selfClosing){
        if (isBlockElement(elementName)){
            this.flushTrailingWhitespace();
            if (this.recentText !== "" && !this.recentText.endsWith("\n") && !this.recentText.endsWith("\t")){
                this.handleText("\n");
            }
        }
        if (!selfClosing){
            this.pushState(elementName, elementAttributes);

            if (elementName === "ol"){
                this.state.counter = {count: 1};
            }else{
                this.state.counter = null;
            }

            if (elementName === "script" || elementName === "style" || elementName === "template"){
                this.state.ignoringUntilEndTag = true;
            }else if (elementName === "h1"){
                this.state.textAttributes.paragraphStyleName = "heading1";
            }else if (elementName === "h2"){
                this.state.textAttributes.paragraphStyleName = "heading2";
            }else if (elementName === "h3"){
                this.state.textAttributes.paragraphStyleName = "heading3";
            }else if (elementName === "h4"){
                this.state.textAttributes.paragraphStyleName = "heading4";
            }else if (elementName === "h5"){
                this.state.textAttributes.paragraphStyleName = "heading5";
            }else if (elementName === "h6"){
                this.state.textAttributes.paragraphStyleName = "heading6";
            }else if (elementName === "b" || elementName === "strong"){
                this.state.textAttributes.bold = true;
            }else if (elementName === "i" || elementName === "em"){
                this.state.textAttributes.italic = true;
            }else if (elementName === "u"){
                this.state.textAttributes.underline = true;
            }else if (elementName === "s"){
                this.state.textAttributes.strike = true;
            }else if (elementName === "a"){
                if (elementAttributes.href){
                    this.state.textAttributes.link = JSURL.initWithString(elementAttributes.href, this.state.baseURL);
                }
            }else if (elementName === "li"){
                var level = 0;
                var stackIndex;
                for (stackIndex = this.stack.length - 1; stackIndex >= 0; --stackIndex){
                    if (this.stack[stackIndex].elementName === "ol" || this.stack[stackIndex].elementName === "ul"){
                        ++level;
                    }
                }
                if (level === 0){
                    level = 1;
                }
                this.state.textAttributes.headIndent = 10 * level;
            }else if (elementName === "pre"){
                this.state.preserveWhitespace = true;
            }
            if (elementAttributes.style){
                // TODO: CSS styles from element's style attr
            }
        }
        if (elementName === "li"){
            var parentState = this.stack[this.stack.length - 2];
            if (parentState.counter !== null){
                this.handleText("%d. ".sprintf(parentState.counter.count));
                ++parentState.counter.count;
            }else{
                this.handleText("• ");
            }
        }else if (elementName === "br"){
            this.flushTrailingWhitespace();
            this.handleTrailingWhitespace("\n");
        }else if (elementName === "hr"){
            this.handleText("----------");
            this.handleTrailingWhitespace("\n");
        }
    },

    endElement: function(elementName){
        elementName = elementName.toLowerCase();
        if (this.stack[this.stack.length - 1].elementName === elementName){
            if (elementName === "p"){
                this.handleTrailingWhitespace("\n");
            }else if (elementName === "div"){
                this.handleTrailingWhitespace("\n");
            }else if (elementName === "li"){
                this.handleTrailingWhitespace("\n");
            }else if (elementName === "th" || elementName === "td"){
                this.handleTrailingWhitespace("\t");
            }else if (elementName === "tr"){
                this.handleTrailingWhitespace("\n");
            }
            this.popState();
        }else{
            // ingore mismatched end tag
            // spec calls for more complicated behavior, but
            // trying to keep things simple for now.
        }
    },

    pushState: function(elementName, elementAttributes){
        this.flush();
        var state = Object.create(this.state);
        state.textAttributes = JSCopy(state.textAttributes);
        state.elementName = elementName;
        state.elementAttributes = elementAttributes;
        this.stack.push(state);
        this.state = state;
    },

    popState: function(){
        this.flush();
        if (this.stack.length > 1){
            this.stack.pop();
            this.state = this.stack[this.stack.length - 1];
        }
    },

    textBuffer: "",
    textBufferAttributes: null,
    recentText: "",
    trailingWhitespace: "",

    handleTrailingWhitespace: function(text){
        this.recentText = text;
        this.trailingWhitespace = text;
        this.textBufferAttributes = this.state.textAttributes;
    },

    handleText: function(text){
        this.flushTrailingWhitespace();
        this.recentText = text;
        this.textBuffer += text;
        this.textBufferAttributes = this.state.textAttributes;
    },

    flushTrailingWhitespace: function(){
        if (this.trailingWhitespace !== ""){
            this.textBuffer += this.trailingWhitespace;
            this.trailingWhitespace = "";
            this.flush();
        }
    },

    flush: function(){
        if (this.textBuffer.length > 0){
            if (this.delegate && this.delegate.htmlTextParserDidFindAttributedText){
                this.delegate.htmlTextParserDidFindAttributedText(this, this.textBuffer, this.textBufferAttributes);
            }
            this.textBuffer = "";
        }
    }

});

JSHTMLTextParser.State = {
    // html elements
    elementName: null,
    elementAttributes: null,
    counter: null,
    baseURL: null,

    // options
    preserveWhitespace: false,
    ignoringUntilEndTag: false,

    // text attributes
    textAttributes: null,
};

var isWhitespace = function(c){
    return c === " " || c === "\t" || c === "\n" || c === "\x0c";
};

var isEntityCharacter = function(c){
    return isAlphabetic(c) || isNumeric(c);
};

var isAlphabetic = function(c){
    if (c >= "a" && c <= "z"){
        return true;
    }
    if (c >= "A" && c <= "Z"){
        return true;
    }
    return false;
};

var isNumeric = function(c){
    if (c >= "0" && c <= "9"){
        return true;
    }
    return false;
};

var isVoidElement = function(name){
    if (name === "area"){
        return true;
    }
    if (name === "base"){
        return true;
    }
    if (name === "br"){
        return true;
    }
    if (name === "col"){
        return true;
    }
    if (name === "embed"){
        return true;
    }
    if (name === "hr"){
        return true;
    }
    if (name === "img"){
        return true;
    }
    if (name === "input"){
        return true;
    }
    if (name === "link"){
        return true;
    }
    if (name === "meta"){
        return true;
    }
    if (name === "source"){
        return true;
    }
    if (name === "track"){
        return true;
    }
    if (name === "wbr"){
        return true;
    }
    return false;
};

var isBlockElement = function(name){
    if (name === "a"){
        return false;
    }
    if (name === "em"){
        return false;
    }
    if (name === "strong"){
        return false;
    }
    if (name === "small"){
        return false;
    }
    if (name === "s"){
        return false;
    }
    if (name === "cite"){
        return false;
    }
    if (name === "q"){
        return false;
    }
    if (name === "dfn"){
        return false;
    }
    if (name === "abbr"){
        return false;
    }
    if (name === "ruby"){
        return false;
    }
    if (name === "rt"){
        return false;
    }
    if (name === "rp"){
        return false;
    }
    if (name === "data"){
        return false;
    }
    if (name === "time"){
        return false;
    }
    if (name === "code"){
        return false;
    }
    if (name === "var"){
        return false;
    }
    if (name === "samp"){
        return false;
    }
    if (name === "kbd"){
        return false;
    }
    if (name === "sub"){
        return false;
    }
    if (name === "sup"){
        return false;
    }
    if (name === "i"){
        return false;
    }
    if (name === "b"){
        return false;
    }
    if (name === "u"){
        return false;
    }
    if (name === "mark"){
        return false;
    }
    if (name === "bdi"){
        return false;
    }
    if (name === "bdo"){
        return false;
    }
    if (name === "span"){
        return false;
    }
    if (name === "br"){
        return false;
    }
    if (name === "wbr"){
        return false;
    }
    if (name === "picture"){
        return false;
    }
    if (name === "source"){
        return false;
    }
    if (name === "img"){
        return false;
    }
    if (name === "label"){
        return false;
    }
    if (name === "script"){
        return false;
    }
    if (name === "template"){
        return false;
    }
    if (name === "style"){
        return false;
    }
    if (name === "base"){
        return false;
    }
    return true;
};

var decodedEntity = function(name){
    name = name.toLowerCase();
    var value;
    if (name.length > 0 && name[0] == "#"){
        if (name.length > 1 && name[1] === "x"){
            value = parseInt(name.substr(2), 16);
        }else{
            value = parseInt(name.substr(1));
        }
        if (!isNaN(value)){
            return String.fromCharCode(value);
        }
    }else{
        if (name === "lt"){
            return "<";
        }
        if (name === "gt"){
            return ">";
        }
        if (name === "amp"){
            return "&";
        }
        if (name === "quot"){
            return "\"";
        }
        if (name === "nbsp"){
            return "\u00a0";
        }
    }
    return "&" + name + ";";
};

})();