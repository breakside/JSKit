// #import "UIKit/UIOpenPanel.js"
/* global Input, JSClass, JSObject, UIOpenPanel, UIHTMLOpenPanel */
'use strict';

JSClass("UIHTMLOpenPanel", UIOpenPanel, {

    init: function(){
    },

    show: function(action, target){
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        if (this.allowsMultipleSelection){
            fileInput.multiple = true;
        }
        if (this.allowedContentTypes !== null){
            fileInput.accept = this.allowedContentTypes.join(', ');
        }
        fileInput.onchange = function(){
            action.call(target, fileInput.files);
        };
        fileInput.click();
    },

});

UIOpenPanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLOpenPanel.init();
    }
});