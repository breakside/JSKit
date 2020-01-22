// #import "DOMDocument.js"
// #import "XMLParser.js"
'use strict';

JSGlobalObject.DOMParser = function DOMParser(){
};

DOMParser.prototype = {

    parseFromString: function(str, mimetype){
        var parser = new XMLParser();
        var isHTML = mimetype == "text/html";
        parser.isHTML = isHTML;
        var document = null;
        var node = null;
        var stack = [];
        parser.parse(str, {
            beginDocument: function(){
                document = DOM.createDocument();
                node = document;
            },
            handleDocumentType: function(name, publicId, systemId){
                var doctype = document.implementation.createDocumentType(name, publicId, systemId);
                document.appendChild(doctype);
            },
            handleProcessingInstruction: function(name, data){
                var pi = document.createProcessingInstruction(name, data);
                node.appendChild(pi);
            },
            handleComment: function(text){
                var comment = document.createComment(text);
                node.appendChild(comment);
            },
            handleCDATA: function(text){
                var cdata = document.createCDATASection(text);
                node.appendChild(cdata);
            },
            beginElement: function(name, prefix, namespace, attributes, isClosed){
                var element;
                if (namespace !== null){
                    if (prefix !== null){
                        element = document.createElementNS(namespace, prefix + ':' + name);   
                    }else{
                        element = document.createElementNS(namespace, name);
                    }
                }else{
                    element = document.createElement(name);
                }
                var attr;
                for (var i = 0, l = attributes.length; i < l; ++i){
                    attr = attributes[i];
                    if (attr.namespace){
                        if (attr.prefix !== null){
                            element.setAttributeNS(attr.namespace, attr.prefix + ':' + attr.name, attr.value);
                        }else{
                            element.setAttribute(attr.namespace, attr.name, attr.value);
                        }
                    }else{
                        element.setAttribute(attr.name, attr.value);
                    }
                }
                node.appendChild(element);
                if (!isClosed){
                    stack.push(node);
                    node = element;
                }
            },
            handleText: function(text){
                var textNode = document.createTextNode(text);
                node.appendChild(textNode);
            },
            endElement: function(){
                node = stack.pop();
            }
        });
        return document;
    }

};