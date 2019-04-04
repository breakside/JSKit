// #import "DOMDocument.js"
// #import "XMLParser.js"
/* global JSGlobalObject, DOM, DOMParser, XMLParser */
'use strict';

JSGlobalObject.DOMParser = function DOMParser(){
};

DOMParser.prototype = {

    parseFromString: function(str){
        var parser = new XMLParser();
        if (str == "text/html"){
            parser.isHTML = true;
        }
        var document = null;
        var node = null;
        var stack = [];
        parser.parse(str, {
            beginDocument: function(){
                document = DOM.createDocument();
            },
            handleDocumentType: function(name, publicId, systemId){
                var doctype = DOM.createDocumentType(name, publicId, systemId);
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
            beginElement: function(name, namespace, attributes, isClosed){
                var element;
                if (namespace){
                    element = document.createElementNS(namespace, name);
                }else{
                    element = document.createElement(name);
                }
                node.appendChild(element);
                if (!isClosed){
                    stack.push(node);
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