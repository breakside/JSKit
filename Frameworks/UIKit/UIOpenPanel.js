// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIOpenPanel, JSReadOnlyProperty */
'use strict';

JSClass("UIOpenPanel", JSObject, {

    allowsMultipleSelction: false,
    allowedContentTypes: null,
    allowsFolderSelection: false,

    init: function(){
    },

    show: function(action, target){
    },

    fileCount: JSReadOnlyProperty('_fileCount', 0),

    fileAtIndex: function(index){
        return null;
    },

});