// #import "SECKey.js"
// jshint browser: true
/* global crypto */
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