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
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
        this.setNeedsDisplay();
    },

    loadURL: function(url){
    }

});

})();