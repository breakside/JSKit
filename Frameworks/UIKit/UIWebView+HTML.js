// #import "UIWebView.js"
/* global UIWebView, UIWebView, JSURL */
'use strict';

UIWebView.definePropertiesFromExtensions({

    _iframe: null,
    _url: null,

    loadURL: function(url){
        this._url = url;
        this._loadURL();
    },

    _loadURL: function(){
        if (this._iframe !== null){
            this._iframe.src = this._url ? this._url.encodedString : 'about:blank';
        }
    },

    layerDidChangeSize: function(){
        this._updateIframeSize();
    },

    _updateIframeSize: function(){
        if (this._iframe !== null){
            this._iframe.style.width = "%dpx".sprintf(this.layer.bounds.size.width);
            this._iframe.style.height = "%dpx".sprintf(this.layer.bounds.size.height);
            this.setNeedsDisplay();
        }
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
        if (this.delegate && this.delegate.webViewDidLoadURL){
            this.delegate.webViewDidLoadURL(this, url);
        }
    },

    _createIframeIfNeeded: function(document){
        if (this._iframe !== null){
            return;
        }
        var iframe = document.createElement('iframe');
        iframe.addEventListener('load', this);
        iframe.style.border = 'none';
        iframe.style.width = "%dpx".sprintf(this.layer.bounds.size.width);
        iframe.style.height = "%dpx".sprintf(this.layer.bounds.size.height);
        iframe.style.pointerEvents = 'all';
        iframe.src = "about:blank";
        this._iframe = iframe;
        this._updateIframeSize();
        this._loadURL();
    },

    drawLayerInContext: function(layer, context){
        if (context.isKindOfClass(UIHTMLDisplayServerContext)){
            this._createIframeIfNeeded(context.element.ownerDocument);
            context.addExternalElementInRect(this._iframe, this.layer.bounds);
        }
    }

});