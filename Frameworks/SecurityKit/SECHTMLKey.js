// #import "SECKey.js"
/* global crypto, JSClass, JSObject, SECKey, JSData */
'use strict';

JSClass("SECHTMLKey", SECKey, {

    htmlKey: null,

    initWithKey: function(htmlKey){
        this.htmlKey = htmlKey;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        crypto.subtle.exportKey("raw", this.htmlKey).then(function(rawBuffer){
            completion.call(target, JSData.initWithBuffer(rawBuffer));
        }, function(){
            completion.call(target, null);
        });
        return completion.promise;
    }

});