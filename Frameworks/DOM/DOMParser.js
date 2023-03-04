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

// #import Foundation
// #import "DOMDocument.js"
'use strict';

JSGlobalObject.DOMParser = function DOMParser(){
};

DOMParser.prototype = {

    document: null,
    currentNode: null,

    parseFromString: function(str, mimetype){
        var parser = JSXMLParser.initWithString(str);
        if (mimetype == "text/html"){
            parser.mode = JSXMLParser.Mode.html;
        }
        this.document = null;
        this.currentNode = null;
        parser.delegate = this;
        parser.parse();
        return this.document;
    },

    xmlParserDidBeginDocument: function(parser){
        this.document = DOM.createDocument();
        this.currentNode = this.document;
    },

    xmlParserFoundDocumentType: function(parser, name, publicId, systemId){
        var doctype = this.document.implementation.createDocumentType(name, publicId, systemId);
        this.document.appendChild(doctype);
    },

    xmlParserFoundProcessingInstruction: function(parser, name, data){
        var pi = this.document.createProcessingInstruction(name, data);
        this.currentNode.appendChild(pi);
    },

    xmlParserFoundComment: function(parser, text){
        var comment = this.document.createComment(text);
        this.currentNode.appendChild(comment);
    },

    xmlParserFoundCDATA: function(parser, text){
        var cdata = this.document.createCDATASection(text);
        this.currentNode.appendChild(cdata);
    },

    xmlParserDidBeginElement: function(parser, name, prefix, namespace, attributes){
        var element;
        if (namespace !== null){
            if (prefix !== null){
                element = this.document.createElementNS(namespace, prefix + ':' + name);   
            }else{
                element = this.document.createElementNS(namespace, name);
            }
        }else{
            element = this.document.createElement(name);
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
        this.currentNode.appendChild(element);
        this.currentNode = element;
    },

    xmlParserFoundText: function(parser, text){
        var textNode = this.document.createTextNode(text);
        this.currentNode.appendChild(textNode);
    },

    xmlParserDidEndElement: function(parser){
        this.currentNode = this.currentNode.parentNode;
    }

};