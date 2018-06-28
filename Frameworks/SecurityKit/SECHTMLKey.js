// #import "SecurityKit/SECKey.js"
/* global crypto, JSClass, JSObject, SECKey, JSData */
'use strict';

JSClass("SECHTMLKey", SECKey, {

    htmlKey: null,

    initWithKey: function(htmlKey){
        this.htmlKey = htmlKey;
    },

    getData: function(completion, target){
        crypto.subtle.exportKey("raw", this.htmlKey).then(function(rawBuffer){
            completion.call(target, JSData.initWithBytes(new Uint8Array(rawBuffer)));
        }, function(){
            completion.call(target, null);
        });
    }

});