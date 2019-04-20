// #import "UIKit/UIView.js"
/* global JSClass, JSProtocol, UIView, UIWebView */
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

    initWithSpec: function(spec, values){
        UIWebView.$super.initWithSpec.call(this, spec, values);
        if ('delegate' in values){
            this.delegate = spec.resolvedValue(values.delegate);
        }
        this.setNeedsDisplay();
    },

    loadURL: function(url){
    }

});

})();