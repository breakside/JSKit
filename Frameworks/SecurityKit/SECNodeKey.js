// #import "SecurityKit/SECKey.js"
/* global JSClass, JSObject, SECKey, JSData */
'use strict';

JSClass("SECNodeKey", SECKey, {

    keyData: null,

    initWithBytes: function(bytes){
        this.keyData = JSData.initWithBytes(bytes);
    }

});