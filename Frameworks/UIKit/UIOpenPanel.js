// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIOpenPanel, JSReadOnlyProperty */
'use strict';

JSClass("UIOpenPanel", JSObject, {

    allowsMultipleSelction: false,
    allowedContentTypes: null,

    init: function(){
    },

    show: function(action, target){
    },

    fileCount: JSReadOnlyProperty('_fileCount', 0),

    getFileAtIndex: function(index){
        return null;
    },

});