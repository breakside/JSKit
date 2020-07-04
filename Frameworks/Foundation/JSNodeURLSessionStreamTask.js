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

// #import "JSURLSessionStreamTask.js"
// #import "JSURLResponse.js"
// #import "JSHTTPResponseParser.js"
// #import "JSHTTPWebSocketParser.js"
// #import "JSSHA1Hash.js"
// #import "JSTimer.js"
// #import "UUID.js"
// jshint node: true
'use strict';

var net = require('net');
var tls = require('tls');

var logger = JSLog("foundation", "url-session");

JSClass("JSNodeURLSessionStreamTask", JSURLSessionStreamTask, {

    socket: null,
    key: null,

    resume: function(){
        if (this.socket !== null){
            return;
        }
        this.key = UUID.init().bytes;
        var scheme = this.currentURL.scheme;
        var port = this.currentURL.port;
        var host = this.currentURL.host;
        if (scheme == 'wss' || scheme == 'https'){
            port = port || 443;
            this.socket = tls.connect(port, host, this.handleConnect.bind(this));
        }else if (scheme == 'ws' || scheme == 'http'){
            port = port || 80;
            this.socket = net.connect(port, host, this.handleSecureConnect.bind(this));
        }else{
            logger.error("invalid url scheme provided to stream task: %s{public}", scheme);
            return;
        }
        this.socket.on('close', this.handleClose.bind(this));
        this.socket.on('error', this.handleError.bind(this));
        this.socket.on('timeout', this.handleTimeout.bind(this));
        this.socket.on('end', this.handleEnd.bind(this));
        this.socket.on('data', this.handleData.bind(this));
    },

    cancel: function(){
        this.stopPinging();
        this.socket.destroy();
    },

    sentClose: false,

    close: function(status){
        this.stopPinging();
        this.sentClose = true;
        var payload = JSData.initWithLength(2);
        payload[0] = status >> 8;
        payload[1] = status & 0xFF;
        this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData([payload]), JSHTTPWebSocketParser.FrameCode.close);
        this.write(payload);
        this.socket.end();
    },

    sendMessage: function(data){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([data], JSHTTPWebSocketParser.FrameCode.binary);
        this.write(header);
        this.write(data);
    },

    write: function(data){
        this.socket.write(data.nodeBuffer);
    },

    handleSecureConnect: function(){
        if (!this.socket.authorized){
            logger.error("Invalid websocket server certificate: %{public}", this.socket.authorizationError);
            this.socket.close();
            return;
        }
        this.connect();
    },

    handleConnect: function(){
        this.httpParser = JSHTTPResponseParser.init();
        var encodedHost = JSURL.encodeDomainName(this.currentURL.host);
        this.socket.write("GET %s HTTP/1.1\r\n".sprintf(this.currentURL.encodedPathAndQueryString));
        this.socket.write("Host: %s\r\n".sprintf(encodedHost));
        this.socket.write("Connection: Upgrade\r\n".sprintf(encodedHost));
        this.socket.write("Upgrade: websocket\r\n".sprintf(encodedHost));
        this.socket.write("Sec-WebSocket-Key: %s\r\n".sprintf(this.key.base64StringRepresentation()));
        this.socket.write("Sec-WebSocket-Protocol: %s\r\n".sprintf(this.requestedProtocols.join(", ")));
        this.socket.write("Sec-WebSocket-Version: 13\r\n");
        this.socket.write("\r\n");
    },

    handleClose: function(){
        this.session._taskDidCloseStream(this);
    },

    handleTimeout: function(){
        this.socket.destroy();
    },

    handleEnd: function(){
        this.cancel();
    },

    handleError: function(error){
        this.session._taskDidReceiveStreamError(this, error);
    },

    httpParser: null,
    websocketParser: null,

    handleData: function(nodeBuffer){
        var data = JSData.initWithNodeBuffer(nodeBuffer);
        if (!this.httpParser.done){
            try{
                this.httpParser.receive(data);
            }catch (e){
                logger.error("HTTP response parser failed with: %{error}", e);
                this.cancel();
                return;
            }
            if (this.httpParser.done){
                if (this.httpParser.status !== JSURLResponse.StatusCode.switchingProtocols){
                    logger.error("Did not receive 101 Switching Protocols response");
                    this.cancel();
                    return;
                }
                if (this.httpParser.headers.get("Upgrade", "").lowercasedString() != "websocket"){
                    logger.error("Did not receive Upgrade: Websocket response header");
                    this.cancel();
                    return;
                }
                var accept = this.httpParser.headers.get("Sec-WebSocket-Accept", "").dataByDecodingBase64();
                var expected = JSSHA1Hash((this.key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8());
                if (!accept.isEqual(expected)){
                    logger.error("Incorrect Sec-WebSocket-Accept response");
                    this.cancel();
                    return;
                }
                var protocol = this.httpParser.headers.get("Sec-WebSocket-Protocol");
                if (this.requestedProtocols.indexOf(protocol) < 0){
                    logger.error("Unrequested Sec-WebSocket-Protocol response");
                    this.cancel();
                    return;
                }
                this.websocketParser = JSHTTPWebSocketParser.init();
                this.websocketParser.delegate = this;
                this.chunks = [];
                this.protocol = protocol;
                this.session._taskDidOpenStream(this);
                if (this.httpParser.leftover !== null && this.httpParser.leftover.length > 0){
                    this.handleData(this.httpParser.leftover);
                }
                this.startPinging();
            }
        }else{
            this.websocketParser.receive(data);
        }
    },

    webSocketParserDidReceivePing: function(parser, chunks){
        this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks), JSHTTPWebSocketParser.FrameCode.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this.write(chunks[i]);
        }
    },

    webSocketParserDidReceivePong: function(parser, chunks){
        var pongData = JSData.initWithChunks(chunks);
        this.pingData = null;
    },

    startPinging: function(){
        if (this.pingTimer === null){
            this.pingData = JSData.initWithLength(1);
            this.pingTimer = JSTimer.scheduledRepeatingTimerWithInterval(55, this.sendPing, this);
        }
    },

    stopPinging: function(){
        if (this.pingTimer !== null){
            this.pingTimer.invalidate();
            this.pingTimer = null;
        }
    },

    pingTimer: null,
    pingData: 0,

    sendPing: function(){
        this.pingData[0] += 1;
        this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData([this.pingData], JSHTTPWebSocketParser.FrameCode.ping));
        this.write(this.pingData);
    },

    webSocketParserDidReceiveClose: function(parser, chunks){
        if (this.sentClose){
            this.cancel();
        }else{
            logger.info("received close from server");
            this.sentClose = true;
            this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks), JSHTTPWebSocketParser.FrameCode.close);
            for (var i = 0, l = chunks.length; i < l; ++i){
                this.write(chunks[i]);
            }
        }
    },

    webSocketParserDidReceiveFrameOutOfSequence: function(parser){
        this.close(CloseStatus.generic);
    },

    webSocketParserDidReceiveInvalidLength: function(parser){
        this.close(CloseStatus.messageTooLarge);
    },

    webSocketParserDidReceiveData: function(parser, chunk){
        this.chunks.push(chunk);
    },

    webSocketParserDidReceiveMessage: function(parser){
        var data = JSData.initWithChunks(this.chunks);
        this.chunks = [];
        this.session._taskDidReceiveStreamData(this, data);
    },

});

var CloseStatus = {
    normal: 1000,
    goingAway: 1001,
    protocolError: 1002,
    unsupportedDataType: 1003,
    invalidData: 1007,
    generic: 1008,
    messageTooLarge: 1009
};