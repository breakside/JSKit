// #import "UIKit/UIWebView.js"
/* global UIWebView, UIWebView, JSURL */
'use strict';

UIWebView.definePropertiesFromExtensions({

    _iframe: null,

    loadURL: function(url){
        this._iframe.src = url.encodedString;
    },

    layerDidChangeSize: function(){
        if (this._iframe === null){
            return;
        }
        this._iframe.style.width = "%dpx".sprintf(this.layer.bounds.size.width);
        this._iframe.style.height = "%dpx".sprintf(this.layer.bounds.size.height);
    },

    initializeLayerHTMLContext: function(layer, context){
        var element = context.element;
        var iframe = element.ownerDocument.createElement('iframe');
        iframe.addEventListener('load', this);
        iframe.style.border = 'none';
        iframe.style.width = "%dpx".sprintf(this.layer.bounds.size.width);
        iframe.style.height = "%dpx".sprintf(this.layer.bounds.size.height);
        iframe.src = "about:blank";
        element.appendChild(iframe);
        this._iframe = iframe;
    },

    destroyLayerHTMLContext: function(layer, context){
        this._iframe.removeEventListener('load', this);
    },

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    _event_load: function(e){
        var url = null;
        try{
            url = JSURL.initWithString(e.target.contentWindow.location.href);
        }catch(err){
        }
        this.delegate.webViewDidLoadURL(this, url);
    }

});