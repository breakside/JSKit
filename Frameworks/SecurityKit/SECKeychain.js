// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
'use strict';

JSClass("SECKeychain", JSObject, {

    contains: function(key){
    },

    save: function(key, data){
        if (this.contains(key)){
            this.update(key, data);
        }else{
            this.add(key, data);
        }
    },

    get: function(key){
        if (!this.contains(key)){
            return null;
        }
    },

    update: function(key, data){
    },

    add: function(key, data){
    },

    remove: function(key){
        if (this.contains(key)){

        }
    },

    _encryptionKey: null,

    _encrypt: function(data){
    },

    _decrypt: function(data){
    }

});