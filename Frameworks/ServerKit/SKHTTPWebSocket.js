// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPWebSocketParser.js"
/* global JSClass, JSObject, JSData, SKHTTPWebSocketParser, SKHTTPWebSocket */
'use strict';

JSClass("SKHTTPWebSocket", JSObject, {

    delegate: null,
    _dataListener: null,
    _frameParser: null,
    _sentClose: false,

    init: function(){
        this._frameParser = SKHTTPWebSocketParser.init();
        this._frameParser.delegate = this;
    },

    accept: function(){
    },

    write: function(data){
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data]);
        this._unframedWrite(header.nodeBuffer());
        this._unframedWrite(data.nodeBuffer());
    },

    _receive: function(data){
        this._frameParser.receive(data);
    },

    _unframedWrite: function(bytes){
    },

    cleanup: function(){
    },

    frameParserDidReceivePing: function(parser, chunks){
        this._unframedWrite(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.Code.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this._unframedWrite(chunks[i].nodeBuffer());
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
            this._unframedWrite(SKHTTPWebSocketParser.UnmaskedHeaderForData(chunks), SKHTTPWebSocketParser.Code.close);
            for (var i = 0, l = chunks.length; i < l; ++i){
                this._unframedWrite(chunks[i].nodeBuffer());
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
        if (this.delegate && this.delegate.socketDidReceiveData){
            this.delegate.socketDidReceiveData(chunk);
        }
    },

    _close: function(status){
        this._sentClose = true;
        var payload = JSData.initWithLength(2);
        payload[0] = status >> 8;
        payload[1] = status & 0xFF;
        this._unframedWrite(SKHTTPWebSocketParser.UnmaskedHeaderForData([payload]), SKHTTPWebSocketParser.Code.close);
        this._unframedWrite(payload.nodeBuffer());
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
