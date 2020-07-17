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

// #import "JSObject.js"
// #import "JSLog.js"
'use strict';

(function(){

var logger = JSLog("http", "websocket");

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


JSClass("JSHTTPWebSocketParser", JSObject, {

    frame: null,
    _header: null,
    _headerLength: 0,
    _remainingHeaderCount: 0,
    _initialMessageCode: -1,

    init: function(){
        this._reset();
    },

    receive: function(framedData){
        var consumed = 0;
        var l = framedData.length;

        // Keep going until we've read all of the input data
        while (consumed < l){

            // If we're at the start of a new frame, read all the header bytes
            // - read the first two bytes of a new frame
            // - use those bytes to determine how long the header is
            // - stop after the header is done, or if we're out of data
            while (consumed < l && this._remainingHeaderCount > 0){
                for (; this._remainingHeaderCount > 0 && consumed < l; ++consumed){
                    this._header[this._headerLength++] = framedData[consumed];
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
            if (consumed < l && this.frame !== null){
                var length = Math.min(l - consumed, this.frame.length - this.frame.received);
                var chunk = framedData.subdataInRange(JSRange(consumed, length));
                consumed += length;
                if (this.frame.maskingKey !== null){
                    this._unmask(chunk, this.frame.received);
                }
                this.frame.received += length;
                this._handleChunk(chunk);
                if (this.frame.received == this.frame.length){
                    this._reset();
                }
            }
        }
    },

    _handleChunk: function(chunk){
        var isEndOfFrame = this.frame.received == this.frame.length;
        switch (this.frame.code){
            case JSHTTPWebSocketParser.FrameCode.continuation:
            case JSHTTPWebSocketParser.FrameCode.text:
            case JSHTTPWebSocketParser.FrameCode.binary:
                this.delegate.webSocketParserDidReceiveData(this, chunk);
                if (isEndOfFrame && this.frame.isFinal){
                    if (this.delegate.webSocketParserDidReceiveMessage){
                        this.delegate.webSocketParserDidReceiveMessage(this);
                    }
                }
                break;
            case JSHTTPWebSocketParser.FrameCode.ping:
                if (isEndOfFrame){
                    if (this.delegate.webSocketParserDidReceivePing){
                        this.delegate.webSocketParserDidReceivePing(this, this.frame.chunks);
                    }
                }else{
                    this.frame.chunks.push(chunk);
                }
                break;
            case JSHTTPWebSocketParser.FrameCode.pong:
                if (isEndOfFrame){
                    if (this.delegate.webSocketParserDidReceivePong){
                        this.delegate.webSocketParserDidReceivePong(this, this.frame.chunks);
                    }
                }else{
                    this.frame.chunks.push(chunk);
                }
                break;
            case JSHTTPWebSocketParser.FrameCode.close:
                if (isEndOfFrame){
                    if (this.delegate.webSocketParserDidReceiveClose){
                        this.delegate.webSocketParserDidReceiveClose(this, this.frame.chunks);
                    }
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
            if (this.frame.code != JSHTTPWebSocketParser.FrameCode.continuation){
                this.delegate.webSocketParserDidReceiveFrameOutOfSequence(this);
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
                this.delegate.webSocketParserDidReceiveInvalidLength(this);
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

    _reset: function(){
        if (this.frame !== null){
            if (!this.frame.isFinal && this.frame.code != JSHTTPWebSocketParser.FrameCode.continuation){
                this._initialMessageCode = this.frame.code;
            }
            if (this.frame.isFinal){
                this._initialMessageCode = -1;
            }
        }
        this.frame = null;
        this._header = JSData.initWithLength(13);
        this._headerLength = 0;
        this._remainingHeaderCount = 2;
    }

});

JSHTTPWebSocketParser.UnmaskedHeaderForData = function(chunks, code, isFinal){
    if (code === undefined){
        code = JSHTTPWebSocketParser.FrameCode.binary;
    }
    if (isFinal === undefined){
        isFinal = true;
    }
    var length = 0;
    var i, l;
    for (i = 0, l = chunks.length; i < l; ++i){
        length += chunks[i].length;
    }
    var header;
    if (length < 126){
        header = JSData.initWithLength(2);
        header[1] = length;
    }else if (length < 0x10000){
        header = JSData.initWithLength(4);
        header[1] = 126;
        header[2] = length >> 8;
        header[3] = length & 0xFF;
    }else{
        header[1] = 127;
        header = JSData.initWithLength(10);
        for (i = 9; i >= 2; --i){
            header[i] = length & 0xFF;
            length >>= 8;
        }
    }
    header[0] = (isFinal ? 0x80 : 0x00) | code;
    return header;
};

JSHTTPWebSocketParser.FrameCode = {
    continuation: 0,
    text: 1,
    binary: 2,
    close: 8,
    ping: 9,
    pong: 10
};

})();