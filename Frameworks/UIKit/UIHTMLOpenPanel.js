// #import "UIKit/UIOpenPanel.js"
/* global document, JSClass, UIOpenPanel, UIHTMLOpenPanel */
'use strict';

JSClass("UIHTMLOpenPanel", UIOpenPanel, {

    // Explicitly define our own init becuase below we re-define UIOpenPanel.init
    // to call UIHTMLOpenPanel.init.  Without this declaration here, we'd get an infinite loop.
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
    }

});

UIOpenPanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLOpenPanel.init();
    }
});