// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPWebSocketParser.js"
/* global JSClass, JSObject, JSData, SKHTTPWebSocketParser, SKHTTPWebSocket */
'use strict';

JSClass("SKHTTPWebSocket", JSObject, {

    delegate: null,
    _dataListener: null,
    _frameParser: null,
    _sentClose: false,
    _messageChunks: null,

    init: function(){
        this._frameParser = SKHTTPWebSocketParser.init();
        this._frameParser.delegate = this;
        this._messageChunks = [];
    },

    startMessage: function(data){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.binary, false);
        this._write(header.nodeBuffer());
        this._write(data.nodeBuffer());
    },

    continueMessage: function(data, isFinal){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.continuation, isFinal);
        this._write(header.nodeBuffer());
        this._write(data.nodeBuffer());
    },

    writeMessage: function(data){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.binary);
        this._write(header.nodeBuffer());
        this._write(data.nodeBuffer());
    },

    _receive: function(data){
        this._frameParser.receive(data);
    },

    _write: function(bytes){
    },

    cleanup: function(){
    },

    frameParserDidReceivePing: function(parser, chunks){
        this._write(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.FrameCode.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this._write(chunks[i].nodeBuffer());
        }
    },

    frameParserDidReceivePong: function(parser, chunks){
        // Only needed if we send a ping and want to verify the response
    },

    frameParserDidReceiveClose: function(parser, chunks){
        if (this._sentClose){
            this.cleanup();
        }else{
            this._sentClose = true;
            this._write(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.FrameCode.close);
            for (var i = 0, l = chunks.length; i < l; ++i){
                this._write(chunks[i].nodeBuffer());
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
        this._write(payload.nodeBuffer());
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
