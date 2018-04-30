// #import "Foundation/Foundation.js"
// #import "SecurityKit/SECCrypto.js"
/* global require, JSClass, JSObject, SECCrypto */
'use strict';

var crypto = require('crypto');

SECCrypto.definePropertiesFromExtensions({

    encrypt: function(data, key, completion){
    },

    decrypt: function(data, key, completion){
    }

});