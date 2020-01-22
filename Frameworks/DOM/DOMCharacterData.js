// #import "DOMNode.js"
'use strict';

DOM.CharacterData.prototype = Object.create(DOM.Node.prototype, {
    
    constructor: {
        value: DOM.CharacterData
    },

    data: {
        get: function(){
            return this.nodeValue !== null ? this.nodeValue : '';
        },
        set: function(value){
            this.nodeValue = value;
        }
    }

});