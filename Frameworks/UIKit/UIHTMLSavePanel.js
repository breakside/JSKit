// #import "UIKit/UISavePanel.js"
/* global document, Blob, URL, JSClass, UISavePanel, UIHTMLSavePanel */
'use strict';

JSClass("UIHTMLSavePanel", UISavePanel, {

    // Explicitly define our own init becuase below we re-define UISavePanel.init
    // to call UIHTMLSavePanel.init.  Without this declaration here, we'd get an infinite loop.
    init: function(){
    },

    show: function(action, target){
        var a = document.createElement('a');
        a.download = this.file.name;
        a.href = this.file.url.encodedString;
        a.click();
        action.call(target);
    }

});

UISavePanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLSavePanel.init();
    }
});