// #import "DOMNode.js"
// #import "DOMElement.js"
// #import "DOMText.js"
// #import "DOMComment.js"
// #import "DOMCDATASection.js"
// #import "DOMDocumentType.js"
/* global JSGlobalObject, DOM */
'use strict';


DOM.createDocumentType = function(name, publicId, systemId){
    var doctype = Object.create(DOM.DocumentType.prototype, {
        nodeType: DOM.Node.DOCUMENT_TYPE_NODE,
        nodeName: {value: '#doctype'},
        childNodes: {value: []},
        name: {value: name},
        publicId: {value: publicId},
        systemId: {value: systemId}
    });
    return doctype;
};

DOM.createDocument = function(namespace, qualifiedName, doctype){
    var document = Object.create(DOM.Document.prototype, {
        nodeType: DOM.Node.DOCUMENT_NODE,
        nodeName: {value: '#document'},
        childNodes: {value: []},
    });
    if (doctype){
        Object.defineProperty(doctype, 'ownerDocument', {value: document});
        document.appendChild(doctype);
    }
    if (qualifiedName){
        var element = document.createElementNS(namespace, qualifiedName);
        document.appendChild(element);
    }
};

DOM.Document.prototype = Object.create(DOM.Node.prototype, {

    doctype: {
        get: function(){
            var node;
            for (var i = 0, l = this.childNodes.length; i < l; ++i){
                node = this.childNodes[i];
                if (node.nodeType == DOM.Node.DOCUMENT_TYPE_NODE){
                    return node;
                }
            }
            return null;
        }
    },

    documentElement: {
        get: function(){
            var node;
            for (var i = 0, l = this.childNodes.length; i < l; ++i){
                node = this.childNodes[i];
                if (node.nodeType == DOM.Node.ELEMENT_NODE){
                    return node;
                }
            }
            return null;
        }
    },

    createElement: {
        value: function DOMDocument_createElement(name){
            var element = Object.create(DOM.Element.prototype, {
                nodeType: DOM.Node.ELEMENT_NODE,
                nodeName: {value: name},
                ownerDocument: {value: this},
                childNodes: {value: []},
            });
            return element;
        }
    },

    createElementNS: {
        value: function DOMDocument_createElementNS(namespace, qualifiedName){
            if (!namespace){
                return this.createElement(qualifiedName);
            }
        }
    },

});