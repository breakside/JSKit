// #import "SecurityKit/SECKey.js"
/* global JSClass, JSObject, SECKey */
'use strict';

JSClass("SECHTMLKey", SECKey, {

    htmlKey: null,

    initWithKey: function(htmlKey){
        this.htmlKey = htmlKey;
    }

});