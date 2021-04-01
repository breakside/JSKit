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

// #import "DOMBase.js"
'use strict';

DOM.Node.ELEMENT_NODE = 1;
DOM.Node.ATTRIBUTE_NODE = 2;
DOM.Node.TEXT_NODE = 3;
DOM.Node.CDATA_SECTION_NODE = 4;
DOM.Node.ENTITY_REFERENCE_NODE = 5; // historical
DOM.Node.ENTITY_NODE = 6; // historical
DOM.Node.PROCESSING_INSTRUCTION_NODE = 7;
DOM.Node.COMMENT_NODE = 8;
DOM.Node.DOCUMENT_NODE = 9;
DOM.Node.DOCUMENT_TYPE_NODE = 10;
DOM.Node.DOCUMENT_FRAGMENT_NODE = 11;
DOM.Node.NOTATION_NODE = 12; // historical

DOM.Node.prototype = Object.create({}, {
    
    constructor: {
        value: DOM.Node
    },

    nodeValue: {writable: true, value: null},
    parentNode: {configurable: true, value: null},
    ownerDocument: {configurable: true, value: null},

    insertBefore: {
        value: function DOMNode_insertBefore(child, sibling){
            if (this.nodeType == DOM.Node.DOCUMENT_NODE){
                if (child.ownerDocument !== this){
                    throw new Error("Cannot insert node with a different ownerDocument");
                }
            }else{
                if (child.ownerDocument !== this.ownerDocument){
                    throw new Error("Cannot insert node with a different ownerDocument");
                }
            }
            if (child.parentNode){
                child.parentNode.removeChild(child);
            }
            var index = this.childNodes.length;
            if (sibling && sibling.parentNode === this){
                index = this.childNodes.indexOf(sibling);
            }
            this.childNodes.splice(index, 0, child);
            Object.defineProperties(child, {
                parentNode: {
                    configurable: true,
                    value: this
                }
            });
            return child;
        }
    },

    removeChild: {
        value: function DOMNode_insertBefore(child){
            if (child.parentNode === this){
                var index = this.childNodes.indexOf(child);
                this.childNodes.splice(index, 1);
                Object.defineProperties(child, {
                    parentNode: {
                        configurable: true,
                        value: null
                    }
                });
            }
        }
    },

    appendChild: {
        value: function DOMNode_appendChild(child){
            return this.insertBefore(child, null);
        }
    },

    clone: {
        value: function DOMNode_clone(){
            
        }
    }

});