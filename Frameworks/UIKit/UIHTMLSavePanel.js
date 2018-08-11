// #import "UIKit/UISavePanel.js"
/* global document, Blob, URL, JSClass, UISavePanel, UIHTMLSavePanel */
'use strict';

JSClass("UIHTMLSavePanel", UISavePanel, {

    // Explicitly define our own init becuase below we re-define UISavePanel.init
    // to call UIHTMLSavePanel.init.  Without this declaration here, we'd get an infinite loop.
    init: function(){
    },

    show: function(){
        var blob = new Blob([this.data.bytes], {type: this.contentType});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.download = this.suggestedFilename;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }

});

UISavePanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLSavePanel.init();
    }
});