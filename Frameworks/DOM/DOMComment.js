// #import "DOMCharacterData.js"
/* global JSGlobalObject, DOM */
'use strict';

DOM.Comment.prototype = Object.create(DOM.CharacterData.prototype, {
    
    constructor: {
        value: DOM.Comment
    },

});