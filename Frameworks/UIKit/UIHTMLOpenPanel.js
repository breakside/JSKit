// #import "UIOpenPanel.js"
// jshint browser: true
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
        if (this.chooseDirectories){
            fileInput.webkitdirectory = true;
        }else{
            if (this.allowedContentTypes !== null){
                fileInput.accept = this.allowedContentTypes.join(', ');
            }
        }
        var panel = this;
        fileInput.onchange = function(){
            if (panel.allowsMultipleSelection || panel.chooseDirectories){
                if (fileInput.webkitEntries && fileInput.webkitEntries.length > 0){
                    panel._fileEnumerator = JSHTMLFileSystemEntryFileEnumerator.initWithHTMLEntries(fileInput.webkitEntries);
                }else{
                    panel._fileEnumerator = JSHTMLFileListFileEnumerator.initWithHTMLFiles(fileInput.files);
                }
            }else{
                if (fileInput.files.length > 0){
                    panel._file = JSHTMLFile.initWithFile(fileInput.files[0]);
                }
            }
            action.call(target, panel);
        };
        fileInput.click();
    }

});

UIOpenPanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLOpenPanel.init();
    }
});