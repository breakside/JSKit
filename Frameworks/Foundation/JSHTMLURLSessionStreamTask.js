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

// #import "JSURL.js"
// #import "JSURLSessionStreamTask.js"
// #import "JSLog.js"
// #import "JSRunLoop.js"
// #feature WebSocket
// #feature Uint8Array
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("foundation", "url-session");

JSClass("JSHTMLURLSessionStreamTask", JSURLSessionStreamTask, {

    _websocket: null,

    resume: function(){
        if (this._websocket !== null){
            return;
        }
        try{
            var url = this._currentURL;
            this._websocket = new WebSocket(url.encodedString, this.requestedProtocols);
            this._websocket.binaryType = "arraybuffer";
            this._addEventListeners(this._websocket);
        }catch (e){
            logger.error(e);
            JSRunLoop.main.schedule(this.session._taskDidReceiveStreamError, this.session, this, e);
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
        this.session._taskDidReceiveStreamError(this, e.error);
    },

    _event_close: function(e){
        this.closeStatus = e.code;
        this.session._taskDidCloseStream(this);
    }
});

})();