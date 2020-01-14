// #import Foundation
/* global JSClass, JSObject, UIOpenPanel, JSReadOnlyProperty */
'use strict';

JSClass("UIOpenPanel", JSObject, {

    allowsMultipleSelection: false,
    allowedContentTypes: null,
    chooseDirectories: false,
    file: JSReadOnlyProperty('_file', null),
    fileEnumerator: JSReadOnlyProperty('_fileEnumerator', null),

    init: function(){
    },

    show: function(action, target){
    },

});