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

// #import "SKMockHTTPServer.js"
// #import "SKMockHTTPRequest.js"
// #import "SKMockHTTPWebSocket.js"
'use strict';

JSClass("SKMockURLSession", JSURLSession, {

    server: null,

    init: function(){
        this.server = SKMockHTTPServer.init();
        this.dataTaskClass = SKMockURLSessionDataTask;
        this.uploadTaskClass = SKMockURLSessionUploadTask;
        this.streamTaskClass = SKMockURLSessionStreamTask;
    },

});

var sharedDataAndUpload = {

    resume: function(){
        if (!this.completion){
            this.completion = Promise.completion(Promise.resolveNull);
            var task = this;
            this.completion.promise = this.completion.promise.then(function(){
                return task.currentRequest.response;
            });
        }
        var promise = this.completion.promise;
        var serverRequest = SKMockHTTPRequest.initWithURLRequest(this.currentRequest);
        this.session.server.handleRequest(serverRequest, function(){
            var response = serverRequest.response.urlResponse;
            this.currentRequest._response = response;
            this.session._taskDidComplete(this, null);
        }, this);
        return promise;
    }

};

JSClass("SKMockURLSessionDataTask", JSURLSessionDataTask, sharedDataAndUpload);
JSClass("SKMockURLSessionUploadTask", JSURLSessionUploadTask, sharedDataAndUpload);

JSClass("SKMockURLSessionStreamTask", JSURLSessionStreamTask, {

    webSocketParser: null,
    mockWebSocket: null,
    key: null,

    resume: function(){
        if (this.mockWebSocket !== null){
            return;
        }
        this.webSocketParser = JSHTTPWebSocketParser.init();
        this.mockWebSocket = SKMockHTTPWebSocket.initWithClientParser(this.webSocketParser);

        this.key = UUID.init().bytes.base64StringRepresentation();
        var request = JSURLRequest.initWithURL(this.currentURL);
        request.headerMap.set("Connection", "Upgrade");
        request.headerMap.set("Upgrade", "websocket");
        request.headerMap.set("Sec-WebSocket-Version", "13");
        request.headerMap.set("Sec-WebSocket-Protocol", this.requestedProtocols.join(", "));
        request.headerMap.set("Sec-WebSocket-Key", this.key);
        var serverRequest = SKMockHTTPRequest.initWithURLRequest(request);
        serverRequest.mockWebSocket = this.mockWebSocket;
        this.session.server.handleRequest(serverRequest, function(){
            var response = serverRequest.response.urlResponse;
            if (response.statusCode !== JSURLResponse.StatusCode.switchingProtocols){
                this._cancelWithError(new Error("Received response other than 101"));
                return;
            }
            if (response.headerMap.get("Upgrade", "").lowercaseString() != "websocket"){
                this._cancelWithError(new Error("Missing upgrade header in response"));
                return;
            }
            var accept = response.headerMap.get("Sec-WebSocket-Accept", "").dataByDecodingBase64();
            var expected = JSSHA1Hash((this.key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8());
            if (!accept.isEqual(expected)){
                this._cancelWithError(new Error("Incorrect Sec-WebSocket-Accept response"));
                return;
            }
            var protocol = response.headerMap.get("Sec-WebSocket-Protocol");
            if (this.requestedProtocols.indexOf(protocol) < 0){
                this._cancelWithError(new Error("Unrequested Sec-WebSocket-Protocol response"));
                return;
            }
            this.protocol = protocol;
            this.webSocketParser.delegate = this;
            this.messageChunks = [];
            this.session._taskDidOpenStream(this);
        }, this);
    },

    _cancelWithError: function(error){
        if (error){
            this.session._taskDidReceiveStreamError(this, error);
        }
        if (this.mockWebSocket !== null){
            this.mockWebSocket.cleanup();
        }
        this.session._taskDidCloseStream(this);
        this.mockWebSocket = null;
        this.webSocketParser = null;
    },

    cancel: function(){
        this._cancelWithError(null);
    },

    sendMessage: function(data){
        var header = JSHTTPWebSocketParser.UnmaskedHeaderForData([data], JSHTTPWebSocketParser.FrameCode.binary);
        this.write(header);
        this.write(data);
    },

    write: function(data){
        JSRunLoop.main.schedule(this.mockWebSocket._receive, this.mockWebSocket, data);
    },

    sentClose: false,

    close: function(status){
        this.sentClose = true;
        var payload = JSData.initWithLength(2);
        payload[0] = status >> 8;
        payload[1] = status & 0xFF;
        this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData([payload]), JSHTTPWebSocketParser.FrameCode.close);
        this.write(payload);
        this._cancelWithError(null);
    },

    // ----------------------------------------------------------------------
    // MARK: - Websocket parsing

    messageChunks: null,

    webSocketParserDidReceivePing: function(parser, chunks){
        this.write(JSHTTPWebSocketParser.UnmaskedHeaderForData(chunks), JSHTTPWebSocketParser.FrameCode.pong);
        for (var i = 0, l = chunks.length; i < l; ++i){
            this.write(chunks[i]);
        }
    },

    webSocketParserDidReceivePong: function(parser, chunks){
    },

    webSocketParserDidReceiveClose: function(parser, chunks){
        if (this.sentClose){
            this.cancel();
        }else{
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
        this.messageChunks.push(chunk);
    },

    webSocketParserDidReceiveMessage: function(parser){
        var data = JSData.initWithChunks(this.messageChunks);
        this.messageChunks = [];
        this.session._taskDidReceiveStreamData(this, data);
    }

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