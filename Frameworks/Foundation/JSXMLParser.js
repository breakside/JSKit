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

// #import "JSObject.js"
// #import "JSProtocol.js"
// #import "String+JS.js"
'use strict';

(function(){

JSProtocol("JSXMLParserDelegate", JSProtocol, {

    xmlParserDidBeginDocument: function(parser){},
    xmlParserDidEndDocument: function(parser){},
    xmlParserFoundDocumentType: function(parser, name, publicId, systemId){},
    xmlParserFoundProcessingInstruction: function(parser, name, data){},
    xmlParserDidBeginElement: function(parser, name, prefix, namespace, attributes){},
    xmlParserDidEndElement: function(parser, name, prefix, namespace){},
    xmlParserFoundComment: function(parser, text){},
    xmlParserFoundCDATA: function(parser, text){},
    xmlParserFoundText: function(parser, text){},
    xmlParserErrorOccurred: function(parser, error){}

});

JSClass("JSXMLParser", JSObject, {

    initWithData: function(data, encoding){
        if (encoding === undefined){
            encoding = String.Encoding.utf8;
        }
        var xml = String.initWithData(data, encoding);
        this.initWithString(xml);
    },

    initWithString: function(str){
        this.xml = str;
    },

    mode: "xml",

    xml: null,
    error: null,
    isStopped: false,

    stop: function(){
        this.isStopped = true;
    },

    parse: function(){
        this.isStopped = false;
        this.error = null;
        var input = this.xml;
        var length = input.length;
        var offset = 0;
        var isHTML = this.mode === JSXMLParser.Mode.html;
        var c;
        var lineNumber = 1;
        var lineOffset;
        var entityMap = JSCopy(defaultEntityMap);
        var readToken = function(){
            if (offset >= length){
                return null;
            }
            if (input[offset] == '<'){
                ++offset;
                if (offset < length){
                    if (input[offset] == '?'){
                        ++offset;
                        return "<?";
                    }
                    if (input[offset] == '!'){
                        ++offset;
                        if (offset < length - 1){
                            if (input[offset] == '-' && input[offset + 1] == '-'){
                                offset += 2;
                                return "<!--";
                            }
                        }
                        if (offset < length - 6){
                            var doctypeOrCData = input.substr(offset, 7);
                            if (doctypeOrCData == "DOCTYPE"){
                                offset += 7;
                                return "<!DOCTYPE";
                            }
                            if (doctypeOrCData == "[CDATA["){
                                offset += 7;
                                return "<![CDATA[";
                            }
                        }
                        return "<!";
                    }
                    if (input[offset] == '/'){
                        ++offset;
                        return "</";
                    }
                }
                return '<';
            }
            var startingOffset = offset;
            while (offset < length && input[offset] != '<'){
                if (input[offset] == "\n"){
                    ++lineNumber;
                    lineOffset = offset + 1;
                }
                ++offset;
            }
            return input.substr(startingOffset, offset - startingOffset);
        };
        var readName = function(){
            if (!isNameStart(input[offset])){
                throw new Error("Invalid name at " + lineNumber  + ':' + (offset - lineOffset));
            }
            var startingOffset = offset;
            ++offset;
            while (isName(input[offset])){
                ++offset;
            }
            return input.substr(startingOffset, offset - startingOffset);
        };
        var readWhitespace = function(){
            while (offset < length && isWhitespace(input[offset])){
                if (input[offset] == "\n"){
                    ++lineNumber;
                    lineOffset = offset + 1;
                }
                ++offset;
            }
        };
        var readAttributeValue = function(){
            if (input[offset] == "'"){
                ++offset;
                return readUntil("'");
            }
            if (input[offset] == '"'){
                ++offset;
                return readUntil('"');
            }
            var startingOffset = offset;
            while (offset < length && !isWhitespace(input[offset])){
                ++offset;
            }
            return input.substr(startingOffset, offset - startingOffset);
        };
        var readObject = function(){
            var token = readToken();
            var name;
            if (token === null){
                return null;
            }
            if (token == '<?'){
                name = readName();
                return {kind: 'PI', name: name, value: readUntil('?>')};
            }
            if (token == '<!DOCTYPE'){
                readWhitespace();
                name = readName();
                readWhitespace();
                var doctype = {kind: 'Doctype', name: name, publicId: null, systemId: null, entities: {}};
                if (offset < length && input[offset] !== '>'){
                    if (input[offset] != '['){
                        name = readName();
                        readWhitespace();
                        if (name == "SYSTEM"){
                            if (offset < length && (input[offset] == "'" || input[offset] == '"')){
                                doctype.systemId = readAttributeValue();
                                readWhitespace();
                            }else{
                                throw new Error("Expecting quote at " + lineNumber  + ':' + (offset - lineOffset));
                            }
                        }else if (name === "PUBLIC"){
                            if (offset < length && (input[offset] == "'" || input[offset] == '"')){
                                doctype.publicId = readAttributeValue();
                                readWhitespace();
                                if (offset < length && (input[offset] == "'" || input[offset] == '"')){
                                    doctype.systemId = readAttributeValue();
                                    readWhitespace();
                                }else{
                                    throw new Error("Expecting quote at " + lineNumber  + ':' + (offset - lineOffset));
                                }
                            }else{
                                throw new Error("Expecting quote at " + lineNumber  + ':' + (offset - lineOffset));
                            }
                        }else{
                            throw new Error("Expecting SYSTEM or PUBLIC at " + lineNumber  + ':' + (offset - lineOffset));
                        }
                    }
                    if (offset < length && input[offset] == '['){
                        ++offset;
                        readWhitespace();
                        while (offset < length && input[offset] !== ']'){
                            token = readToken();
                            if (token == '<!'){
                                name = readName();
                                if (name === "ENTITY"){
                                    readWhitespace();
                                    if (offset >= length){
                                        throw new Error("Expecting ENTITY name at " + lineNumber  + ':' + (offset - lineOffset));
                                    }
                                    name = readName();
                                    readWhitespace();
                                    if (offset >= length){
                                        throw new Error("Expecting ENTITY value at " + lineNumber  + ':' + (offset - lineOffset));
                                    }
                                    entityMap[name] = readAttributeValue();
                                }
                                readUntil('>');
                            }else if (token == '<?'){
                                readUntil('?>');
                            }else if (token == '<!--'){
                                readUntil('-->');
                            }
                            readWhitespace();
                        }
                        if (offset >= length || input[offset] !== ']'){
                            throw new Error("Expecting ] at end of DOCTYPE at " + lineNumber  + ':' + (offset - lineOffset));
                        }
                        ++offset;
                        readWhitespace();
                    }
                }
                if (offset >= length || input[offset] !== '>'){
                    throw new Error("Expecting > at end of DOCTYPE at " + lineNumber  + ':' + (offset - lineOffset));
                }
                ++offset;
                return doctype;
            }
            if (token == '<![CDATA['){
                return {kind: 'CDATA', value: readUntil(']]>')};
            }
            if (token == '<!--'){
                return {kind: 'Comment', value: readUntil('-->')};
            }
            if (token == "<"){
                readWhitespace();
                name = readName();
                readWhitespace();
                var lowerName = name.toLowerCase();
                var attributes = [];
                var attrName;
                var attrValue;
                while (offset < length && input[offset] != '>' && input[offset] != '/'){
                    attrName = readName();
                    readWhitespace();
                    if (offset < length && input[offset] == '='){
                        ++offset;
                        readWhitespace();
                        attributes.push({name: attrName, value: textByDecodingEntities(readAttributeValue(), entityMap)});
                    }else{
                        attributes.push({name: attrName, value: null});
                    }
                    readWhitespace();
                }
                var isClosed = false;
                if (offset < length && input[offset] == '/'){
                    isClosed = true;
                    ++offset;
                    readWhitespace();
                }
                if (isHTML && !isClosed){
                    isClosed = htmlElements.voids.has(lowerName);
                }
                if (offset == length || input[offset] != '>'){
                    throw new Error("Expecting end of tag at " + lineNumber  + ':' + (offset - lineOffset));
                }
                ++offset;
                var rawContents = null;
                if (isHTML && htmlElements.raw.has(lowerName)){
                    rawContents = readUntil("</" + name + ">");
                }
                return {kind: 'ElementStart', name: name, attributes: attributes, isClosed: isClosed, rawContents: rawContents};
            }
            if (token == "</"){
                readWhitespace();
                name = readName();
                readWhitespace();
                if (offset == length || input[offset] != '>'){
                    throw new Error("Expecting end of tag at " + lineNumber  + ':' + (offset - lineOffset));
                }
                ++offset;
                return {kind: 'ElementEnd', name: name};
            }
            return {kind: 'Text', value: textByDecodingEntities(token, entityMap)};
        };
        var readUntil = function(token){
            var index = input.indexOf(token, offset);
            if (index < 0){
                throw new Error("Expecting '" + token + "' at " + lineNumber  + ':' + (offset - lineOffset));
            }
            var content = input.substr(offset, index - offset);
            var newlineIndex = content.lastIndexOf("\n");
            if (newlineIndex >= 0){
                lineOffset = offset + newlineIndex + 1;
                while (newlineIndex > 0){
                    lineNumber += 1;
                    newlineIndex = content.lastIndexOf("\n", newlineIndex - 1);
                    if (newlineIndex === 0){
                        lineNumber += 1;
                    }
                }
            }
            offset = index + token.length;
            return content;
        };
        var resolveNamespace = function(name, isAttr){
            var index = name.indexOf(':');
            if (index < 0){
                return {name: name, prefix: null, namespace: isAttr ? null : namespaces[':default:']};
            }
            var prefix = name.substr(0, index);
            name = name.substr(index + 1);
            if (!(prefix in namespaces)){
                throw new Error("Unknown namspace for prefix: " + prefix);
            }
            return {name: name, prefix: prefix, namespace: namespaces[prefix]};
        };
        var resolveElementNamespace = function(name, attributes){
            var attr;
            var i, l;
            for (i = 0, l = attributes.length; i < l; ++i){
                attr = attributes[i];
                if (attr.name.startsWith("xmlns:")){
                    namespaces[attr.name.substr(6)] = attr.value;
                }else if (attr.name == "xmlns"){
                    namespaces[':default:'] = attr.value;
                }
            }
            var resolved = resolveNamespace(name);
            var element = {
                name: resolved.name,
                prefix: resolved.prefix,
                namespace: resolved.namespace,
                attributes: JSXMLAttributeMap()
            };
            for (i = 0, l = attributes.length; i < l; ++i){
                attr = attributes[i];
                if (!attr.name.startsWith("xmlns:") && attr.name != "xmlns"){
                    resolved = resolveNamespace(attr.name, true);
                    element.attributes.add({
                        name: resolved.name,
                        prefix: resolved.prefix,
                        namespace: resolved.namespace,
                        value: attr.value
                    });
                }
            }
            return element;
        };
        try{
            var obj;
            if (isHTML){
                readWhitespace();
            }else{
                obj = readObject();
                if (obj === null || obj.kind != 'PI' || obj.name != 'xml'){
                    throw new Error("Expecting <?xml at start of document");
                }
            }
            obj = readObject();
            var elementStack = [];
            var namespaces = {
                ':default:': null,
                'xml': 'http://www.w3.org/XML/1998/namespace'
            };
            var namespacesStack = [];
            var hasDocumentElement = false;
            var hasSentDoctype = false;
            var element;
            if (this.delegate && this.delegate.xmlParserDidBeginDocument){
                this.delegate.xmlParserDidBeginDocument(this);
            }
            while (!this.isStopped && obj !== null){
                if (obj.kind == 'Doctype'){
                    if (hasSentDoctype){
                        throw new Error("Only one doctype allowed");
                    }
                    if (hasDocumentElement){
                        throw new Error("Doctype must come before the document element");
                    }
                    if (elementStack.length > 0){
                        throw new Error("Doctype only allowed at document root");
                    }
                    if (this.delegate && this.delegate.xmlParserFoundDocumentType){
                        this.delegate.xmlParserFoundDocumentType(this, obj.name, obj.publicId || null, obj.systemId || null);
                    }
                    hasSentDoctype = true;
                }else if (obj.kind == "PI"){
                    if (elementStack.length > 0){
                        throw new Error("Processing instructions only allowed at document root");
                    }
                    if (this.delegate && this.delegate.xmlParserFoundProcessingInstruction){
                        this.delegate.xmlParserFoundProcessingInstruction(this, obj.name, obj.value);
                    }
                }else if (obj.kind == 'CDATA'){
                    if (elementStack.length === 0){
                        throw new Error("CDATA not allowed at document root");
                    }
                    if (this.delegate && this.delegate.xmlParserFoundCDATA){
                        this.delegate.xmlParserFoundCDATA(this, obj.value);
                    }
                }else if (obj.kind == 'Comment'){
                    if (this.delegate && this.delegate.xmlParserFoundComment){
                        this.delegate.xmlParserFoundComment(this, obj.value);
                    }
                }else if (obj.kind == 'ElementStart'){
                    if (elementStack.length === 0){
                        hasDocumentElement = true;
                    }
                    namespacesStack.push(namespaces);
                    namespaces = Object.create(namespaces);
                    element = resolveElementNamespace(obj.name, obj.attributes);
                    elementStack.push(element);
                    if (this.delegate && this.delegate.xmlParserDidBeginElement){
                        this.delegate.xmlParserDidBeginElement(this, element.name, element.prefix, element.namespace, element.attributes);
                    }
                    var elementIsClosed = obj.isClosed;
                    if (obj.rawContents !== null){
                        if (!this.isStopped && this.delegate.xmlParserFoundText && obj.rawContents.length > 0){
                            this.delegate.xmlParserFoundText(this, obj.rawContents);
                        }
                        elementIsClosed = true;
                    }
                    if (elementIsClosed){
                        if (!this.isStopped && this.delegate.xmlParserDidEndElement){
                            this.delegate.xmlParserDidEndElement(this, element.name, element.prefix, element.namespace);
                        }
                        elementStack.pop();
                        namespaces = namespacesStack.pop();
                    }
                }else if (obj.kind == 'Text'){
                    if (elementStack.length === 0){
                        if (!obj.value.match(/^[\r\n\t ]*$/)){
                            throw new Error("Text not allowed at the document root");
                        }
                    }else{
                        if (this.delegate && this.delegate.xmlParserFoundText){
                            this.delegate.xmlParserFoundText(this, obj.value);
                        }
                    }
                }else if (obj.kind == 'ElementEnd'){
                    element = elementStack.pop();
                    namespaces = namespacesStack.pop();
                    if (element.prefix !== null){
                        if (obj.name != element.prefix + ":" + element.name){
                            throw new Error("Mismatched end tag");
                        }
                    }else{
                        if (obj.name != element.name){
                            throw new Error("Mismatched end tag");
                        }
                    }
                    if (this.delegate && this.delegate.xmlParserDidEndElement){
                        this.delegate.xmlParserDidEndElement(this, element.name, element.prefix, element.namespace);
                    }
                }
                obj = readObject();
            }
            if (!this.isStopped && this.delegate.xmlParserDidEndDocument){
                this.delegate.xmlParserDidEndDocument(this);
            }
        }catch (e){
            this.isStopped = true;
            if (this.delegate && this.delegate.xmlParserErrorOccurred){
                this.delegate.xmlParserErrorOccurred(this, e);
            }else{
                throw e;
            }
        }
    }

});

var textByDecodingEntities = function(text, map){
    var index = text.indexOf('&');
    var length = text.length;
    var end;
    var entity;
    var value;
    while (index >= 0){
        end = index + 1;
        while (end < length && isEntity(text[end])){
            ++end;
        }
        if (end < length && text[end] == ';' && end > index + 1){
            value = null;
            entity = text.substr(index + 1, end - (index + 1));
            ++end;
            if (entity.startsWith("#")){
                if (entity.length > 1){
                    var code;
                    if (entity[1] == 'x'){
                        code = parseInt(entity.substr(2), 16);
                    }else{
                        code = parseInt(entity.substr(1));
                    }
                    if (isNaN(code)){
                        throw new Error("Cannot convert entity to number: &" + entity + ';');
                    }
                    value = String.fromCharCode(code);
                }
            }else{
                value = map[entity] || null;
                if (value === null){
                    throw new Error("Cannot lookup entity: &" + entity + ';');
                }
            }
            text = text.substr(0, index) + value + text.substr(end);
            end -= entity.length + 2;
            end += value.length;
        }
        index = text.indexOf('&', end);
    }
    return text;
};

var defaultEntityMap = {
    'lt': '<',
    'LT': '<',
    'gt': '>',
    'GT': '>',
    'amp': '&',
    'AMP': '&',
    'quot': '"',
    'QUOT': '"',
    'apos': "'",
    'APOS': "'",
    'nbsp': '\u00a0'
};

var isWhitespace = function(c){
    return c ==  " " || c == "\n" || c == "\t" || c == "\r";
};

var isNumeric = function(c){
    return (c >= '0' && c <= '9');
};

var isName = function(c){
    return isNameStart(c) || c == '-' || c == '.' || isNumeric(c);
};

var isNameStart = function(c){
    return c == ':' || c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c >= 128;
};

var isEntity = function(c){
    // FIXME: probably doesn't match spec
    return isName(c) || c == '#';
};

var htmlElements = {
    voids: new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']),
    closed: new Set(['script', 'style', 'title', 'body']),
    raw: new Set(['script', 'style'])
};

JSXMLParser.Mode = {
    xml: "xml",
    html: "html"
};

JSGlobalObject.JSXMLAttributeMap = function(){
    if (this === undefined){
        return new JSXMLAttributeMap();
    }
    this.namespaces = {};
    this.noNamespace = {};
    this.attributes = [];
};

JSXMLAttributeMap.prototype = {

    namespaces: null,
    noNamespace: null,
    attributes: null,

    add: function(attr){
        this.attributes.push(attr);
        var map = this.noNamespace;
        if (attr.namespace){
            map = this.namespaces[attr.namespace];
            if (!map){
                map = this.namespaces[attr.namespace] = {};
            }
        }
        map[attr.name] = attr;
    },

    all: function(){
        return this.attributes;
    },

    contains: function(name, namespace){
        var map = namespace ? this.namespaces[namespace] : this.noNamespace;
        if (map){
            return name in map;
        }
        return false;
    },

    get: function(name, namespace){
        var map = namespace ? this.namespaces[namespace] : this.noNamespace;
        if (map){
            var attr = map[name];
            if (attr){
                return attr.value;
            }
        }
        return null;
    },

};

})();