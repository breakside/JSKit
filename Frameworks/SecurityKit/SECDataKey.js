// #import "SecurityKit/SECKey.js"
/* global JSClass, JSObject, SECKey, JSData, JSRunLoop */
'use strict';

JSClass("SECDataKey", SECKey, {

    keyData: null,

    initWithData: function(data){
        this.keyData = data;
    },

    getData: function(completion, target){
        JSRunLoop.main.schedule(completion, target, this.keyData);
    }

});