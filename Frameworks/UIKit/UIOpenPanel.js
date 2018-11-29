// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIOpenPanel, JSReadOnlyProperty */
'use strict';

JSClass("UIOpenPanel", JSObject, {

    allowsMultipleSelction: false,
    allowedContentTypes: null,
    chooseDirectories: false,
    file: JSReadOnlyProperty('_file', null),
    fileEnumerator: JSReadOnlyProperty('_fileEnumerator', null),

    init: function(){
    },

    show: function(action, target){
    },

});