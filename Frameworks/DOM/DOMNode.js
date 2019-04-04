// #import "DOMBase.js"
/* global JSGlobalObject, DOM */
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

    nodeValue: {writable: true, value: null},
    parentNode: {configurable: true, value: null},
    ownerDocument: {configurable: true, value: null},

    insertBefore: {
        value: function DOMNode_insertBefore(child, sibling){
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
            this.insertBefore(child, null);
        }
    }

});