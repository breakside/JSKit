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

// #import Foundation
'use strict';

(function(){

var logger = JSLog("serverkit", "websocket");

JSClass("SKHTTPWebSocket", JSObject, {

    delegate: null,
    _dataListener: null,
    _frameParser: null,
    _sentClose: false,
    _messageChunks: null,
    _pingTimer: null,
    pingInterval: JSDynamicProperty('_pingInterval', 45),
    tag: null,

    init: function(){
        this._frameParser = JSHTTPWebSocketParser.init();
        this._frameParser.delegate = this;
        this._messageChunks = [];
        this._pingTimer = JSTimer.scheduledRepeatingTimerWithInterval(this._pingInterval, this.sendPing, this);
    },

    startMessage: function(data){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([data], JSHTTPWebSocketParser.FrameCode.binary, false);
        this._write(header);
        this._write(data);
    },

    continueMessage: function(data, isFinal){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([data], JSHTTPWebSocketParser.FrameCode.continuation, isFinal);
        this._write(header);
        this._write(data);
    },

    sendMessage: function(data){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([data], JSHTTPWebSocketParser.FrameCode.binary);
        this._write(header);
        this._write(data);
    },

    setPingInterval: function(interval){
        this._pingInterval = interval;
        this._pingTimer.invalidate();
        this._pingTimer = JSTimer.scheduledRepeatingTimerWithInterval(this._pingInterval, this.sendPing, this);
    },

    sendPing: function(){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([], JSHTTPWebSocketParser.FrameCode.ping);
        this._write(header);
    },

    _receive: function(data){
        this._frameParser.receive(data);
    },

    _write: function(bytes){
    },

    cleanup: function(){
        if (this._pingTimer !== null){
            this._pingTimer.invalidate();
            this._pingTimer = null;
        }
        this._cleanup();
        if (this.delegate && this.delegate.socketDidClose){
            this.delegate.socketDidClose(this);
        }
    },

    _cleanup: function(){
    },

    webSocketParserDidReceivePing: function(parser, chunks){
        this._write(JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks), JSHTTPWebSocketParser.FrameCode.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this._write(chunks[i]);
        }
    },

    webSocketParserDidReceivePong: function(parser, chunks){
        // Only needed if we send a ping and want to verify the response
    },

    webSocketParserDidReceiveClose: function(parser, chunks){
        if (this._sentClose){
            this.cleanup();
        }else{
            logger.info("received close from client");
            this._sentClose = true;
            this._write(JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks), JSHTTPWebSocketParser.FrameCode.close);
            for (var i = 0, l = chunks.length; i < l; ++i){
                this._write(chunks[i]);
            }
        }
    },

    webSocketParserDidReceiveFrameOutOfSequence: function(parser){
        // TODO: cancel parsing?
        this._close(SKHTTPWebSocket.Status.generic);
    },

    webSocketParserDidReceiveInvalidLength: function(parser){
        // TODO: cancel parsing?
        this._close(SKHTTPWebSocket.Status.messageTooLarge);
    },

    webSocketParserDidReceiveData: function(parser, chunk){
        this._messageChunks.push(chunk);
        if (this.delegate && this.delegate.socketDidReceiveData){
            this.delegate.socketDidReceiveData(this, chunk);
        }
    },

    webSocketParserDidReceiveMessage: function(parser){
        if (this.delegate && this.delegate.socketDidReceiveMessage){
            this.delegate.socketDidReceiveMessage(this, this._messageChunks);
        }
        this._messageChunks = [];
    },

    _close: function(status){
        this._sentClose = true;
        var payload = JSData.initWithLength(2);
        payload[0] = status >> 8;
        payload[1] = status & 0xFF;
        this._write(JSHTTPWebSocketParser.UnmaskedHeaderForData([payload]), JSHTTPWebSocketParser.FrameCode.close);
        this._write(payload);
    }

});

SKHTTPWebSocket.Status = {
    normal: 1000,
    goingAway: 1001,
    protocolError: 1002,
    unsupportedDataType: 1003,
    invalidData: 1007,
    generic: 1008,
    messageTooLarge: 1009
};

})();