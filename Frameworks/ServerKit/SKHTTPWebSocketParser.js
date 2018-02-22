// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSData, SKHTTPWebSocketParser, jslog_create */
'use strict';

(function(){

var logger = jslog_create('http.server');

var WebSocketFrame = function(){
    if (this === undefined){
        return new WebSocketFrame();
    }
    this.chunks = [];
};

WebSocketFrame.prototype = {
    isFinal: false,
    code: null,
    length: null,
    received: 0,
    maskingKey: null,
    chunks: null
};


JSClass("SKHTTPWebSocketParser", JSObject, {

    frame: null,
    _header: null,
    _headerLength: 0,
    _remainingHeaderCount: 0,
    _initialMessageCode: -1,

    init: function(){
        this.reset();
    },

    receive: function(framedData){
        var framedBytes = framedData.bytes;
        var consumed = 0;
        var l = framedBytes.length;

        // Keep going until we've read all of the input data
        while (consumed < l){

            // If we're at the start of a new frame, read all the header bytes
            // - read the first two bytes of a new frame
            // - use those bytes to determine how long the header is
            // - stop after the header is done, or if we're out of data
            while (this._remainingHeaderCount > 0){
                for (; this._remainingHeaderCount > 0 && consumed < l; ++consumed){
                    this._header[this._headerLength++] = framedBytes[consumed];
                    --this._remainingHeaderCount;
                }
                if (this._headerLength == 2){
                    this._determineRemainingHeaderLength();
                }
            }

            // If the header is done and we haven't created our frame yet,
            // create our frame
            if (this._remainingHeaderCount === 0 && this.frame === null){
                this._createFrame();
            }

            // If we have created a frame, then we must be parsing frame data,
            // so read as much as we can, either to the end of the available data
            // or to the end of the frame's length.
            if (this.frame !== null){
                var length = Math.min(l - consumed, this.frame.length - this.frame.received);
                var chunk = new Uint8Array(framedBytes.buffer, framedBytes.byteOffset + consumed, length);
                consumed += length;
                if (this.frame.maskingKey !== null){
                    this._unmask(chunk, this.frame.received);
                }
                this.frame.received += length;
                this._handleChunk(JSData.initWithBytes(chunk));
                if (this.frame.received == this.frame.length){
                    this.reset();
                }
            }
        }
    },

    _handleChunk: function(chunk, isEndOfFrame){
        switch (this.frame.code){
            case SKHTTPWebSocketParser.FrameCode.continuation:
            case SKHTTPWebSocketParser.FrameCode.text:
            case SKHTTPWebSocketParser.FrameCode.binary:
                this.delegate.frameParserDidReceiveData(this, chunk);
                break;
            case SKHTTPWebSocketParser.FrameCode.ping:
                if (isEndOfFrame){
                    this.delegate.frameParserDidReceivePing(this, this.frame.chunks);
                }else{
                    this.frame.chunks.push(chunk);
                }
                break;
            case SKHTTPWebSocketParser.FrameCode.pong:
                if (isEndOfFrame){
                    this.delegate.frameParserDidReceivePong(this, this.frame.chunks);
                }else{
                    this.frame.chunks.push(chunk);
                }
                break;
            case SKHTTPWebSocketParser.FrameCode.close:
                if (isEndOfFrame){
                    this.delegate.frameParserDidReceiveClose(this, this.frame.chunks);
                }else{
                    this.frame.chunks.push(chunk);
                }
                break;
        }
    },

    _unmask: function(data, offset){
        for (var i = 0, l = data.length; i < l; ++i){
            data[i] = data[i] ^ this.frame.maskingKey[(offset + i) % 4];
        }
    },

    _createFrame: function(){
        this.frame = WebSocketFrame();
        this.frame.isFinal = this._header[0] & 0x80;
        this.frame.code = this._header[0] & 0xF;
        if (this._initialMessageCode >= 0){
            if (this.frame.code != SKHTTPWebSocketParser.FrameCode.continuation){
                this.delegate.frameParserDidReceiveFrameOutOfSequence(this);
            }
        }
        var shortLength = this._header[1] & 0x7F;
        if (shortLength < 126){
            this.frame.length = shortLength;
        }else if (shortLength == 126){
            this.frame.length = (this._header[2] << 8) | this._header[3];
        }else{
            if (this._header[2] || this._header[3] || this._header[4] || this._header[5] || (this._header[6] > 0x7F)){
                this.frame.length = -1;
                this.delegate.frameParserDidReceiveInvalidLength(this);
            }else{
                this.frame.length = 
                    (this._header[6] << 24) | 
                    (this._header[7] << 16) | 
                    (this._header[8] << 8) | 
                    (this._header[9]);
            }
        }
        var masked = (this._header[1] & 0x80) !== 0;
        if (masked){
            this.frame.maskingKey = new Uint8Array(this._header.buffer, this._headerLength - 4, 4);
        }
    },

    _determineRemainingHeaderLength: function(){
        var shortLength = this._header[1] & 0x7F;
        if (shortLength == 126){
            this._remainingHeaderCount += 2;
        }else if (shortLength == 127){
            this._remainingHeaderCount += 8;
        }
        var masked = (this._header[1] & 0x80) !== 0;
        if (masked){
            this._remainingHeaderCount += 4;
        }
    },

    reset: function(){
        if (this.frame !== null){
            if (!this.frame.isFinal && this.frame.code != SKHTTPWebSocketParser.FrameCode.continuation){
                this._initialMessageCode = this.frame.code;
            }
            if (this.frame.isFinal){
                this._initialMessageCode = -1;
            }
        }
        this.frame = null;
        this._header = new Uint8Array(13);
        this._headerLength = 0;
        this._remainingHeaderCount = 2;
    }

});

SKHTTPWebSocketParser.UnmaskedHeaderForData = function(chunks, code){
    if (code === undefined){
        code = SKHTTPWebSocketParser.FrameCode.binary;
    }
    var length = 0;
    var i, l;
    for (i = 0, l = chunks.length; i < l; ++i){
        length += chunks[i].length;
    }
    var header;
    if (length < 126){
        header = new Uint8Array(2);
        header[1] = length;
    }else if (length < 0x10000){
        header = new Uint8Array(4);
        header[1] = 126;
        header[2] = length >> 8;
        header[3] = length & 0xFF;
    }else{
        header[1] = 127;
        header = new Uint8Array(10);
        for (i = 9; i >= 2; --i){
            header[i] = length & 0xFF;
            length >>= 8;
        }
    }
    header[0] = 0x80 | code;
    return JSData.initWithBytes(header);
};

SKHTTPWebSocketParser.FrameCode = {
    continuation: 0,
    text: 1,
    binary: 2,
    close: 8,
    ping: 9,
    pong: 10
};

})();