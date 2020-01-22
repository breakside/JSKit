// #import "DOMCharacterData.js"
'use strict';

DOM.ProcessingInstruction.prototype = Object.create(DOM.CharacterData.prototype, {
    
    constructor: {
        value: DOM.ProcessingInstruction
    },

    target: {value: null, configurable: true}

});