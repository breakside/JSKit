// #import "DOMNode.js"
/* global DOM */
'use strict';

DOM.DocumentType.prototype = Object.create(DOM.Node.prototype, {
    
    constructor: {
        value: DOM.DocumentType
    },

});