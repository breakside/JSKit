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

// #import "UIWebView.js"
// #import "UIHTMLElementLayer.js"
// jshint browser: true
/* global UIHTMLDisplayServerContext */
'use strict';

UIWebView.layerClass = UIHTMLElementLayer;

UIWebView.definePropertiesFromExtensions({

    elementNameForLayer: function(layer){
        return "iframe";
    },

    layerDidCreateElement: function(layer){
        var iframe = layer.element;
        iframe.style.border = "none";
        iframe.style.pointerEvents = "all";
        iframe.src = "about:blank";
        this._iframe = iframe;
        this.addIframeEventListeners();
        this._loadURL();
    },

    layerWillDestroyElement: function(layer){
        this.removeIframeEventListeners();
        this.removeContentWindowEventListeners();
        this._iframe = null;
    },

    _iframe: null,
    _contentWindow: null,
    _url: null,

    handleEvent: function(e){
        this['_event_' + e.type](e);
    },

    // MARK: - URL Loading

    loadURL: function(url){
        this._url = url;
        this._loadURL();
    },

    _loadURL: function(){
        if (this._iframe !== null){
            this._iframe.src = this._url ? this._url.encodedString : 'about:blank';
        }
    },

    addIframeEventListeners: function(){
        this._iframe.addEventListener("load", this);
    },

    removeIframeEventListeners: function(){
        this._iframe.removeEventListener("load", this);
    },

    _event_load: function(e){
        this.addContentWindowEventListeners();
        var url = null;
        try{
            url = JSURL.initWithString(e.target.contentWindow.location.href);
        }catch(err){
        }
        if (url !== null && this.delegate && this.delegate.webViewDidLoadURL){
            this.delegate.webViewDidLoadURL(this, url);
        }
    },

    // MARK: - Content Window events

    addContentWindowEventListeners: function(){
        // Only works if the iframe is in the same origin as us
        try{
            this._iframe.contentWindow.addEventListener('mousedown', this, true);
            this._iframe.contentWindow.addEventListener('mouseup', this, true);
            this._iframe.contentWindow.addEventListener('mousemove', this, true);
        }catch (error){
        }
    },

    removeContentWindowEventListeners: function(){
        if (this._iframe.contentWindow){
            // Only works if the iframe is in the same origin as us
            try{
                this._iframe.contentWindow.removeEventListener('mousedown', this, true);
                this._iframe.contentWindow.removeEventListener('mouseup', this, true);
                this._iframe.contentWindow.removeEventListener('mousemove', this, true);
            }catch (error){
            }
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

});