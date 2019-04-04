/* global JSGlobalObject, XMLParser */
'use strict';

JSGlobalObject.XMLParser = function XMLParser(){
};

XMLParser.prototype = {

    isHTML: false,

    state: null,

    parse: function(input, listener){
        var length = input.length;
        var offset = 0;
        var isHTML = this.isHTML;
        var c;
        var lineNumber = 1;
        var lineOffset;
        var readToken = function(){
            readWhitespace();
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
                var parts = readUntil('>').trim().split(' ');
                return {kind: 'Doctype', name: parts[0], publicId: parts[1], systemId: parts[2]};
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
                var attributes = {};
                var namespacedAttributes = {};
                var attrName;
                var attrValue;
                while (offset < length && input[offset] != '>' && input[offset] != '/'){
                    attrName = readName();
                    readWhitespace();
                    if (offset < length && input[offset] == '='){
                        ++offset;
                        readWhitespace();
                        attributes[attrName] = textByDecodingEntities(readAttributeValue());
                    }else{
                        attributes[attrName] = true;
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
            return {kind: 'Text', value: textByDecodingEntities(token)};
        };
        var readUntil = function(token){
            var index = input.indexOf(token, offset);
            if (index < 0){
                throw new Error("Expecting '" + token + "' at " + lineNumber  + ':' + (offset - lineOffset));
            }
            var content = input.substr(offset, index - offset);
            offset = index + token.length;
            return content;
        };

        var resolveNamespace = function(name, isAttr){
            var index = name.indexOf(':');
            if (index < 0){
                return {name: name, namespace: isAttr ? null : namespaces[':default:']};
            }
            var prefix = name.substr(0, index);
            name = name.substr(index + 1);
            if (!(prefix in namespaces)){
                throw new Error("Unknown namspace for prefix: " + prefix);
            }
            return {name: name, namespace: namespaces[prefix]};
        };

        var resolveElementNamespace = function(name, attributes){
            var attrName;
            for (attrName in attributes){
                if (attrName.startsWith("xmlns:")){
                    namespaces[attrName.substr(6)] = attributes[attrName];
                }else if (attrName == "xmlns"){
                    namespaces[':default:'] = attributes[attrName];
                }
            }
            var resolved = resolveNamespace(name);
            var element = {
                name: resolved.name,
                namespace: resolved.namespace,
                attributes: {}
            };
            for (attrName in attributes){
                if (!attrName.startsWith("xmlns:") && attrName != "xmlns"){
                    resolved = resolveNamespace(attrName, true);
                    if (resolved.namespace){
                        element.attributes[resolved.name + '|' + resolved.namespace] = attributes[attrName];
                    }else{
                        element.attributes[resolved.name] = attributes[attrName];
                    }
                }
            }
            return element;
        };

        var obj = readObject();
        var hasSeenInitialPI = obj !== null && obj.kind == 'PI' && obj.name == 'xml';
        if (!isHTML && !hasSeenInitialPI){
            throw new Error("Expecting <?xml at start of document");
        }
        if (hasSeenInitialPI){
            obj = readObject();
        }
        var elementNameStack = [];
        var namespaces = {':default:': null};
        var namespacesStack = [];
        var hasDocumentElement = false;
        var hasSentDoctype = false;
        if (listener.beginDocument){
            listener.beginDocument();
        }
        while (obj !== null){
            if (obj.kind == 'Doctype'){
                if (hasSentDoctype){
                    throw new Error("Only one doctype allowed");
                }
                if (hasDocumentElement){
                    throw new Error("Doctype must come before the document element");
                }
                if (elementNameStack.length > 0){
                    throw new Error("Doctype only allowed at document root");
                }
                if (listener.handleDocumentType){
                    listener.handleDocumentType(obj.name, obj.publicId || null, obj.systemId || null);
                }
                hasSentDoctype = true;
            }else if (obj.kind == "PI"){
                if (elementNameStack.length > 0){
                    throw new Error("Processing instructions only allowed at document root");
                }
                if (listener.handleProcessingInstruction){
                    listener.handleProcessingInstruction(obj.name, obj.value);
                }
            }else if (obj.kind == 'CDATA'){
                if (listener.handleCDATA){
                    listener.handleCDATA(obj.value);
                }
            }else if (obj.kind == 'Comment'){
                if (listener.handleComment){
                    listener.handleComment(obj.value);
                }
            }else if (obj.kind == 'ElementStart'){
                if (elementNameStack.length === 0){
                    hasDocumentElement = true;
                }
                elementNameStack.push(obj.name);
                namespacesStack.push(namespaces);
                namespaces = Object.create(namespaces);
                var element = resolveElementNamespace(obj.name, obj.attributes);
                if (listener.beginElement){
                    listener.beginElement(element.name, element.namespace, element.attributes, obj.isClosed);
                }
                var elementIsClosed = obj.isClosed;
                if (obj.rawContents !== null){
                    if (listener.handleText && obj.rawContents.length > 0){
                        listener.handleText(obj.rawContents);
                    }
                    if (listener.endElement){
                        listener.endElement();
                    }
                    elementIsClosed = true;
                }
                if (elementIsClosed){
                    elementNameStack.pop();
                    namespaces = namespacesStack.pop();
                }
            }else if (obj.kind == 'Text'){
                if (elementNameStack.length === 0){
                    throw new Error("Text not allowed at the document root");
                }
                if (listener.handleText){
                    listener.handleText(obj.value);
                }
            }else if (obj.kind == 'ElementEnd'){
                var name = elementNameStack.pop();
                namespaces = namespacesStack.pop();
                if (obj.name != name){
                    throw new Error("Mismatched end tag");
                }
                if (listener.endElement){
                    listener.endElement();
                }
            }
            obj = readObject();
        }
        if (listener.endDocument){
            listener.endDocument();
        }
    }

};

var textByDecodingEntities = function(text){
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
                value = entityMap[entity] || null;
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

var entityMap = {
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