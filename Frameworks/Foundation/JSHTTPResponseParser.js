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
// #import "JSProtocol.js"
// #import "JSLog.js"
// #import "JSMIMEHeaderMap.js"
'use strict';

(function(){

var logger = JSLog("http", "websocket");

JSProtocol("JSHTTPResponseParserDelegate", JSProtocol, {

    httpParserDidReceiveStatus: function(parser, statusCode, statusMessage){},
    httpParserDidReceiveHeaders: function(parser, headerMap){},
    httpParserDidReceiveBodyData: function(parser, data){},
    httpParserDidError: function(parser, error){},

});

JSClass("JSHTTPResponseParser", JSObject, {

    init: function(){
        this.headerMap = JSMIMEHeaderMap();
        this.lineBuffer = JSData.initWithLength(this.lineBuferLength);
        this.lineBufferIndex = 0;
    },

    state: 0,
    lineBuffer: null,
    lineBuferLength: 4096,
    lineBufferIndex: 0,
    delegate: null,

    receive: function(data){
        var result;
        while (this.state !== JSHTTPResponseParser.State.error && data !== null && data.length > 0){
            result = this.parse(data);
            if (result.method){
                result.method.apply(this.delegate, result.args);
            }
            this.state = result.state;
            data = result.remaining;
        }
    },

    parse: function(data){
        try{
            if (this.state === JSHTTPResponseParser.State.body){
                return {state: JSHTTPResponseParser.body, method: this.delegate.httpParserDidReceiveBodyData, args: [this, data], remaining :null};
            }
            var i = 0;
            var l = data.length;
            var line = null;
            for (; i < l && this.lineBufferIndex < this.lineBuferLength && line === null; ++i){
                if (data[i] === 0x0A && this.lineBufferIndex > 0 && this.lineBuffer[this.lineBufferIndex - 1] == 0x0D){
                    line = this.lineBuffer.truncatedToLength(this.lineBufferIndex - 1);
                    this.lineBufferIndex = 0;
                }else{
                    this.lineBuffer[this.lineBufferIndex++] = data[i];
                }
            }
            if (line === null){
                if (i < l){  // If we didn't use all the data, then we must have ran out of buffer
                    throw new Error("Line too long");
                }
                return {state: this.state, remaining: null};
            }
            var remaining = data.subdataInRange(JSRange(i, l - i));
            if (this.state === JSHTTPResponseParser.State.status){
                var statusLine = line.stringByDecodingLatin1();
                return this.parseStatusLine(statusLine, remaining);
            }
            if (this.state == JSHTTPResponseParser.State.headers){
                var headerLine = line.stringByDecodingUTF8();
                if (headerLine === ""){
                    return {state: JSHTTPResponseParser.State.body, method: this.delegate.httpParserDidReceiveHeaders, args: [this, this.headerMap], remaining: remaining};
                }
                this.headerMap.addLine(headerLine);
                return {state: JSHTTPResponseParser.State.headers, remaining: remaining};
            }
            throw new Error("Unexpected state");
        }catch (e){
            return {state: JSHTTPResponseParser.State.error, method: this.delegate.httpParserDidError, args: [this, e], remaining: null};
        }
    },

    parseStatusLine: function(statusLine, remaining){
        if (!statusLine.startsWith("HTTP/1.1 ")){
            throw new Error("Invalid status line, expecting HTTP/1.1");
        }
        var hundred = parseInt(statusLine[9]);
        var ten = parseInt(statusLine[10]);
        var one = parseInt(statusLine[11]);
        if (isNaN(hundred) || isNaN(ten) || isNaN(one) || (statusLine.length > 12 && statusLine[12] != " ")){
            throw new Error("Invalid status line, expecting 3 digit status code");
        }
        var code = hundred * 100 + ten * 10 + one;
        var message = statusLine.substr(13);
        return {state: JSHTTPResponseParser.State.headers, method: this.delegate.httpParserDidReceiveStatus, args: [this, code, message], remaining: remaining};
    }
});

JSHTTPResponseParser.State = {
    status: 0,
    headers: 1,
    body: 2,
    error: 3
};

})();