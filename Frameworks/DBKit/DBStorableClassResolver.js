// #import Foundation
"use strict";

JSClass("DBStorableClassResolver", JSObject, {

    init: function(){
        this.classesByPrefix = {};
    },

    classesByPrefix: null,

    addClassForPrefix: function(storableClass, prefix){
        this.classesByPrefix[prefix] = storableClass;
    },

    classForID: function(id){
        if (id === null || id === undefined){
            return null;
        }
        return this.classForPrefix(id.dbidPrefix);
    },

    classForPrefix: function(prefix){
        return this.classesByPrefix[prefix] || null;
    }

});