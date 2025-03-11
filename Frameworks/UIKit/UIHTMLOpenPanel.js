// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIOpenPanel.js"
// jshint browser: true
'use strict';

JSClass("UIHTMLOpenPanel", UIOpenPanel, {

    // Explicitly define our own init becuase below we re-define UIOpenPanel.init
    // to call UIHTMLOpenPanel.init.  Without this declaration here, we'd get an infinite loop.
    init: function(){
    },

    show: function(action, target){
        if (UIHTMLOpenPanel.fileInput !== null){
            UIHTMLOpenPanel.fileInput.parentNode.removeChild(UIHTMLOpenPanel.fileInput);
        }
        UIHTMLOpenPanel.fileInput = document.createElement('input');
        var fileInput = UIHTMLOpenPanel.fileInput;
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
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
        var hasCompleted = false;
        var handleChange = function(){
            fileInput.removeEventListener("change", handleChange);
            fileInput.removeEventListener("cancel", handleCancel);
            if (hasCompleted){
                return;
            }
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
            hasCompleted = true;
            fileInput.parentNode.removeChild(fileInput);
            UIHTMLOpenPanel.fileInput = null;
        };
        var handleCancel = function(){
            fileInput.removeEventListener("change", handleChange);
            fileInput.removeEventListener("cancel", handleCancel);
            if (hasCompleted){
                return;
            }
            hasCompleted = true;
            fileInput.parentNode.removeChild(fileInput);
            UIHTMLOpenPanel.fileInput = null;
        };
        fileInput.addEventListener("change", handleChange);
        fileInput.addEventListener("cancel", handleCancel);
        fileInput.click();
    }

});

UIHTMLOpenPanel.fileInput = null;

UIOpenPanel.definePropertiesFromExtensions({
    init: function(){
        return UIHTMLOpenPanel.init();
    }
});