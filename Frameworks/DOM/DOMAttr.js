// #import "DOMNode.js"
/* global DOM */
'use strict';

DOM.Attr.prototype = Object.create(DOM.Node.prototype, {
    
    constructor: {
        value: DOM.Attr
    },

    namespaceURI: { value: null, configurable: true},
    prefix: { value: null, configurable: true},
    localName: { value: null, configurable: true},
    name: { 
        get: function(){
            return this.nodeName;
        }
    },
    value: {
        get: function(){
            return this.nodeValue;
        },

        set: function(value){
            this.nodeValue = value;
        }
    }

});