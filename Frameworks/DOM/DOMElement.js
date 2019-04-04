// #import "DOMNode.js"
/* global DOM */
'use strict';

DOM.Element.prototype = Object.create(DOM.Node.prototype, {

    attributes: {
        value: {}
    },

    setAttribute: function(name, value){
        this.attributes[name] = value;
    },

    getAttribute: function(name){
        return this.attributes[name];
    }

});