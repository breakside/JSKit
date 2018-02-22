// #import "Foundation/JSURL.js"
// #import "Foundation/JSURLSessionStreamTask.js"
// #feature WebSocket
// #feature Uint8Array
/* global JSClass, JSURLSessionStreamTask, JSLazyInitProperty, WebSocket, jslog_create, JSURLResponse, JSURLRequest, JSURL, JSData, Uint8Array */
'use strict';

(function(){

var logger = jslog_create("foundation.url-session");

JSURLSessionStreamTask.definePropertiesFromExtensions({

    _websocket: null,

    resume: function(){
        if (this._websocket === null){
            var url = this._currentURL;
            this._websocket = new WebSocket(url.encodedString, this.requestedProtocols);
            this._addEventListeners(this._websocket);
        }
    },

    cancel: function(){
        this._websocket.close();
    },

    send: function(data){
        if (this._websocket !== null && this._websocket.readyState == WebSocket.OPEN){
            this._websocket.send(data.bytes);
        }
    },

    _addEventListeners: function(websocket){
        websocket.addEventListener('open', this);
        websocket.addEventListener('message', this);
        websocket.addEventListener('error', this);
        websocket.addEventListener('close', this);
    },

    _removeEventListeners: function(websocket){
        websocket.removeEventListener('open', this);
        websocket.removeEventListener('message', this);
        websocket.removeEventListener('error', this);
        websocket.removeEventListener('close', this);
    },

    handleEvent: function(e){
        if (e.currentTarget === this._websocket){
            this['_event_' + e.type](e);
        }
    },

    _event_open: function(e){
        this.session._taskDidOpenStream(this);
    },

    _event_message: function(e){
        this.session._taskDidReceiveStreamData(this, JSData.initWithBytes(new Uint8Array(e.data)));
    },

    _event_error: function(e){
        // TODO:
    },

    _event_close: function(e){
        // TODO:
    }
});

})();