// #import "UIWebView.js"
// jshint browser: true
/* global UIHTMLDisplayServerContext */
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

    layerDidChangeSize: function(layer){
        UIWebView.$super.layerDidChangeSize.call(this, layer);
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
        try{
            e.target.contentWindow.addEventListener('mousedown', this, true);
            e.target.contentWindow.addEventListener('mouseup', this, true);
            e.target.contentWindow.addEventListener('mousemove', this, true);
        }catch (error){
        }
        if (url !== null && this.delegate && this.delegate.webViewDidLoadURL){
            this.delegate.webViewDidLoadURL(this, url);
        }
    },

    _adjustedEvent: function(e){
        var rect = this._iframe.getClientRects()[0];
        return new MouseEvent(e.type, {
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            composed: e.composed,
            detail: e.detail,
            view: e.view,
            screenX: e.screenX,
            screenY: e.screenY,
            clientX: e.clientX + rect.left,
            clientY: e.clientY + rect.top,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            button: e.button,
            buttons: e.buttons,
            relatedTarget: e.relatedTarget,
            region: e.region
        });
    },

    _event_mousedown: function(e){
        e = this._adjustedEvent(e);
        this.window.windowServer.mousedown(e);
    },

    _event_mouseup: function(e){
        e = this._adjustedEvent(e);
        this.window.windowServer.mouseup(e);
    },

    _event_mousemove: function(e){
        e = this._adjustedEvent(e);
        this.window.windowServer.mousemove(e);
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