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

// #import "DOMNode.js"
// #import "DOMElement.js"
// #import "DOMAttr.js"
// #import "DOMText.js"
// #import "DOMComment.js"
// #import "DOMCDATASection.js"
// #import "DOMDocumentType.js"
'use strict';

DOM.createDocument = function(namespace, qualifiedName, doctype){
    var document = Object.create(DOM.Document.prototype, {
        nodeType: {value: DOM.Node.DOCUMENT_NODE},
        nodeName: {value: '#document'},
        childNodes: {value: []},
        implementation: {
            value: Object.create({}, {
                createDocumentType: {
                    value: function(name, publicId, systemId){
                        var doctype = DOM.createDocumentType(name, publicId, systemId);
                        Object.defineProperty(doctype, 'ownerDocument', {value: document});
                        return doctype;
                    }
                }
            })
        }
    });
    if (doctype){
        if (doctype.ownerDocument === null){
            Object.defineProperty(doctype, 'ownerDocument', {value: document});
        }
        document.appendChild(doctype);
    }
    if (qualifiedName){
        var element = document.createElementNS(namespace, qualifiedName);
        document.appendChild(element);
    }
    return document;
};

DOM.createDocumentType = function(name, publicId, systemId){
    var doctype = Object.create(DOM.DocumentType.prototype, {
        nodeType: {value: DOM.Node.DOCUMENT_TYPE_NODE},
        nodeName: {value: '#doctype'},
        childNodes: {value: []},
        name: {value: name},
        publicId: {value: (publicId !== undefined && publicId !== null) ? publicId : ''},
        systemId: {value: (systemId !== undefined && systemId !== null) ? systemId : ''},
        ownerDocument: {value: null, configurable: true}
    });
    return doctype;
};

DOM.Document.prototype = Object.create(DOM.Node.prototype, {

    constructor: {
        value: DOM.Document
    },

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

    createTextNode: {
        value: function DOMDocument_createTextNode(value){
            if (value === undefined || value === null){
                throw new Error("value must be a text string");
            }
            var node = Object.create(DOM.Text.prototype, {
                nodeType: {value: DOM.Node.TEXT_NODE},
                nodeName: {value: '#text'},
                ownerDocument: {value: this},
                childNodes: {value: []},
                nodeValue: {value: value, writable: true}
            });
            return node;
        }
    },

    createComment: {
        value: function DOMDocument_createComment(value){
            var node = Object.create(DOM.Comment.prototype, {
                nodeType: {value: DOM.Node.COMMENT_NODE},
                nodeName: {value: '#comment'},
                ownerDocument: {value: this},
                childNodes: {value: []},
                nodeValue: {value: value, writable: true}
            });
            return node;
        }
    },

    createCDATASection: {
        value: function DOMDocument_createCDATASection(value){
            var node = Object.create(DOM.CDATASection.prototype, {
                nodeType: {value: DOM.Node.CDATA_SECTION_NODE},
                nodeName: {value: '#cdata'},
                ownerDocument: {value: this},
                childNodes: {value: []},
                nodeValue: {value: value, writable: true}
            });
            return node;
        }
    },

    createProcessingInstruction: {
        value: function DOMDocument_createProcessingInstruction(target, data){
            var node = Object.create(DOM.CDATASection.prototype, {
                nodeType: {value: DOM.Node.PROCESSING_INSTRUCTION_NODE},
                nodeName: {value: '#cdata'},
                ownerDocument: {value: this},
                childNodes: {value: []},
                target: {value: target},
                nodeValue: {value: data, writable: true}
            });
            return node;
        }
    },

    createElement: {
        value: function DOMDocument_createElement(name){
            return this.createElementNS(null, name);
        }
    },

    createElementNS: {
        value: function DOMDocument_createElementNS(namespace, qualifiedName){
            var prefix = null;
            var localName = qualifiedName;
            var tagName = qualifiedName;
            if (namespace !== null){
                var name = DOM._parseQualifiedName(qualifiedName);
                localName = name.localName;
                prefix = name.prefix;
            }
            var element = Object.create(DOM.Element.prototype, {
                nodeType: {value: DOM.Node.ELEMENT_NODE},
                nodeName: {value: qualifiedName},
                ownerDocument: {value: this},
                childNodes: {value: []},
                namespaceURI: {value: namespace},
                prefix: {value: prefix},
                localName: {value: localName},
                attributes: {value: []},
                _attributeMap: {value: {':global:': {}}}
            });
            return element;
        }
    },

    createAttribute: {
        value: function DOMDocument_createAttribute(name){
            return this.createAttributeNS(null, name);
        }
    },

    createAttributeNS: {
        value: function DOMDocument_createAttributeNS(namespace, qualifiedName){
            var prefix = null;
            var localName = qualifiedName;
            var tagName = qualifiedName;
            if (namespace !== null){
                var name = DOM._parseQualifiedName(qualifiedName);
                localName = name.localName;
                prefix = name.prefix;
            }
            var attr = Object.create(DOM.Attr.prototype, {
                nodeType: {value: DOM.Node.ATTRIBUTE_NODE},
                nodeName: {value: qualifiedName},
                ownerDocument: {value: this},
                childNodes: {value: []},
                namespaceURI: {value: namespace},
                prefix: {value: prefix},
                localName: {value: localName},
            });
            return attr;
        }
    },

});