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

JSClass("SKHTTPWebSocket", JSObject, {

    delegate: null,
    _dataListener: null,
    _frameParser: null,
    _sentClose: false,
    _messageChunks: null,
    _pingTimer: null,
    closeStatus: null,
    pingInterval: JSDynamicProperty('_pingInterval', 45),
    logger: null,
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

    webSocketParserDidReceivePing: function(parser, chunks){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks, JSHTTPWebSocketParser.FrameCode.pong);
        this._write(header);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this._write(chunks[i]);
        }
    },

    webSocketParserDidReceivePong: function(parser, chunks){
        // Only needed if we send a ping and want to verify the response
    },

    webSocketParserDidReceiveFrameOutOfSequence: function(parser){
        // TODO: cancel parsing?
        this.close(SKHTTPWebSocket.Status.generic);
    },

    webSocketParserDidReceiveInvalidLength: function(parser){
        // TODO: cancel parsing?
        this.close(SKHTTPWebSocket.Status.messageTooLarge);
    },

    webSocketParserDidReceiveData: function(parser, chunk){
        this._messageChunks.push(chunk);
        if (this.delegate && this.delegate.socketDidReceiveData){
            var promise = this.delegate.socketDidReceiveData(this, chunk);
            var socket = this;
            if (promise instanceof Promise){
                promise.catch(function(error){
                    socket.logger.error("Error during async socketDidReceiveData, closing: %{error}", error);
                    socket.close(SKHTTPWebSocket.Status.generic);
                });
            }
        }
    },

    webSocketParserDidReceiveMessage: function(parser){
        if (this.delegate && this.delegate.socketDidReceiveMessage){
            var promise = this.delegate.socketDidReceiveMessage(this, this._messageChunks);
            var socket = this;
            if (promise instanceof Promise){
                promise.catch(function(error){
                    socket.logger.error("Error during async socketDidReceiveMessage, closing: %{error}", error);
                    socket.close(SKHTTPWebSocket.Status.generic);
                });
            }
        }
        this._messageChunks = [];
    },

    webSocketParserDidReceiveClose: function(parser, chunks){
        var data = JSData.initWithChunks(chunks);
        if (data.length > 2){
            this.closeStatus = (data[0] << 8) | data[1];
        }else{
            this.closeStatus = SKHTTPWebSocket.Status.noStatusProvided;
        }
        this.logger.info("websocket received close from client: %d", this.closeStatus);
        this._sendCloseIfNeeded(this.closeStatus);
        this.cleanup();
    },

    close: function(status){
        this._sendCloseIfNeeded(status);
    },

    _sendCloseIfNeeded: function(status){
        if (!this._sentClose){
            var payload;
            if (status !== undefined && status !== SKHTTPWebSocket.Status.noStatusProvided){
                payload = JSData.initWithLength(2);
                payload[0] = status >> 8;
                payload[1] = status & 0xFF;
            }else{
                payload = JSData.initWithLength(0);
            }
            var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([payload], JSHTTPWebSocketParser.FrameCode.close); 
            this._write(header);
            this._write(payload);
            this.logger.info("websocket sent close: %d", status || SKHTTPWebSocket.Status.noStatusProvided);
            this._sentClose = true;
        }
    },

    cleanup: function(){
        if (this._pingTimer !== null){
            this._pingTimer.invalidate();
            this._pingTimer = null;
        }
        this._cleanup();
        var promise;
        if (this.delegate && this.delegate.socketDidClose){
            promise = this.delegate.socketDidClose(this, this.closeStatus);
            var socket = this;
            if (promise instanceof Promise){
                promise = promise.catch(function(error){
                    socket.logger.error("Error during async socketDidClose: %{error}", error);
                });
            }
        }
        if (this.delegate && this.delegate.socketDidClosePrivate){
            this.delegate.socketDidClosePrivate(this, promise);
        }
    },

    _cleanup: function(){
    },

});

SKHTTPWebSocket.Status = {
    normal: 1000,
    goingAway: 1001,
    protocolError: 1002,
    unsupportedDataType: 1003,
    noStatusProvided: 1005,
    noCloseFrameReceived: 1006,
    invalidData: 1007,
    generic: 1008,
    messageTooLarge: 1009,
    unexpectedCondition: 1011,
    firstUserStatus: 4000
};

})();