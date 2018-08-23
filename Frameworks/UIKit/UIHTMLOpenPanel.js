// #import "UIKit/UIOpenPanel.js"
/* global document, JSClass, UIOpenPanel, UIHTMLOpenPanel, JSHTMLFile */
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
        if (this.allowsFolderSelection){
            fileInput.webkitdirectory = true;
        }
        var panel = this;
        fileInput.onchange = function(){
            panel.htmlFiles = fileInput.files;
            panel._fileCount = fileInput.files.length;
            action.call(target, panel);
        };
        fileInput.click();
    },

    htmlFiles: null,

    fileAtIndex: function(index){
        if (index < this.htmlFiles.length){
            return JSHTMLFile.initWithFile(this.htmlFiles[index]);
        }
        return null;
    },

});

UIOpenPanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLOpenPanel.init();
    }
});