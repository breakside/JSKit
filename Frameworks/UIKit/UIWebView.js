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
        this.setNeedsDisplay();
    },

    initWithSpec: function(spec){
        UIWebView.$super.initWithSpec.call(this, spec);
        if (spec.containsKey('delegate')){
            this.delegate = spec.valueForKey("delegate");
        }
        this.setNeedsDisplay();
    },

    loadURL: function(url){
    }

});

})();