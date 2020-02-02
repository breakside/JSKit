// #import "JSURL.js"
// #import "JSURLSessionStreamTask.js"
// #import "JSLog.js"
// #feature WebSocket
// #feature Uint8Array
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("foundation", "url-session");

JSURLSessionStreamTask.definePropertiesFromExtensions({

    _websocket: null,

    resume: function(){
        if (this._websocket === null){
            var url = this._currentURL;
            this._websocket = new WebSocket(url.encodedString, this.requestedProtocols);
            this._websocket.binaryType = "arraybuffer";
            this._addEventListeners(this._websocket);
        }
    },

    cancel: function(){
        this._websocket.close();
    },

    sendMessage: function(data){
        if (this._websocket !== null && this._websocket.readyState == WebSocket.OPEN){
            this._websocket.send(data);
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
        this.session._taskDidReceiveStreamData(this, JSData.initWithBuffer(e.data));
    },

    _event_error: function(e){
        this.session._taskDidReceiveStreamError(this);
    },

    _event_close: function(e){
        this.session._taskDidCloseStream(this);
        // TODO:
    }
});

})();