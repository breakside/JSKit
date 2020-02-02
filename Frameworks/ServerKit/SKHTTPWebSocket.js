// #import Foundation
// #import "SKHTTPWebSocketParser.js"
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

    init: function(){
        this._frameParser = SKHTTPWebSocketParser.init();
        this._frameParser.delegate = this;
        this._messageChunks = [];
        this._pingTimer = JSTimer.scheduledRepeatingTimerWithInterval(this._pingInterval, this.sendPing, this);
    },

    startMessage: function(data){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.binary, false);
        this._write(header);
        this._write(data);
    },

    continueMessage: function(data, isFinal){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.continuation, isFinal);
        this._write(header);
        this._write(data);
    },

    sendMessage: function(data){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.binary);
        this._write(header);
        this._write(data);
    },

    setPingInterval: function(interval){
        this._pingInterval = interval;
        this._pingTimer.invalidate();
        this._pingTimer = JSTimer.scheduledRepeatingTimerWithInterval(this._pingInterval, this.sendPing, this);
    },

    sendPing: function(){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([], SKHTTPWebSocketParser.FrameCode.ping);
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

    frameParserDidReceivePing: function(parser, chunks){
        this._write(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.FrameCode.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this._write(chunks[i]);
        }
    },

    frameParserDidReceivePong: function(parser, chunks){
        // Only needed if we send a ping and want to verify the response
    },

    frameParserDidReceiveClose: function(parser, chunks){
        if (this._sentClose){
            this.cleanup();
        }else{
            logger.info("received close from client");
            this._sentClose = true;
            this._write(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.FrameCode.close);
            for (var i = 0, l = chunks.length; i < l; ++i){
                this._write(chunks[i]);
            }
        }
    },

    frameParserDidReceiveFrameOutOfSequence: function(parser){
        // TODO: cancel parsing?
        this._close(SKHTTPWebSocket.Status.generic);
    },

    frameParserDidReceiveInvalidLength: function(parser){
        // TODO: cancel parsing?
        this._close(SKHTTPWebSocket.Status.messageTooLarge);
    },

    frameParserDidReceiveData: function(parser, chunk){
        this._messageChunks.push(chunk);
        if (this.delegate && this.delegate.socketDidReceiveData){
            this.delegate.socketDidReceiveData(this, chunk);
        }
    },

    frameParserDidReceiveMessage: function(parser){
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
        this._write(SKHTTPWebSocketParser.UnmaskedHeaderForData([payload]), SKHTTPWebSocketParser.FrameCode.close);
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