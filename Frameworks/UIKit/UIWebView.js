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

// #import "UIView.js"
'use strict';

(function(){

JSProtocol("UIWebViewDelegate", JSProtocol, {

    webViewDidLoadURL: function(webView, url){ }

});

JSClass("UIWebView", UIView, {

    delegate: null,

    initWithFrame: function(frame){
        UIWebView.$super.initWithFrame.call(this, frame);
        this.backgroundColor = JSColor.white;
        this.setNeedsDisplay();
    },

    initWithSpec: function(spec){
        UIWebView.$super.initWithSpec.call(this, spec);
        if (this.backgroundColor === null){
            this.backgroundColor = JSColor.white;
        }
        if (spec.containsKey("delegate")){
            this.delegate = spec.valueForKey("delegate");
        }
        this.setNeedsDisplay();
    },

    loadURL: function(url){
    },

    canBecomeFirstResponder: function(){
        return this.fullKeyboardAccessEnabled;
    }

});

})();