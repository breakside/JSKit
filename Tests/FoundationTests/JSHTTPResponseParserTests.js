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
// #import TestKit
'use strict';

JSClass("JSHTTPResponseParserTests", TKTestSuite, {

    testStatusLine: function(){
        var receivedCode = null;
        var receivedMessage = null;
        var receivedError = null;
        var delegate = {
            httpParserDidReceiveStatus: function(httpParser, statusCode, message){
                TKAssertExactEquals(httpParser, parser);
                receivedCode = statusCode;
                receivedMessage = message;
            },

            httpParserDidError: function(httpParser, error){
                TKAssertExactEquals(httpParser, parser);
                receivedError = error;
            }
        };

        // Good, empty message
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        var parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "");

        // Good, message
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");

        // Good, different code, message with spaces
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 404 Not Found\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 404);
        TKAssertExactEquals(receivedMessage, "Not Found");

        // Good, in chunks that break up key tokens
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTT".utf8());
        parser.receive("P/1.".utf8());
        parser.receive("1 40".utf8());
        parser.receive("4 Not ".utf8());
        parser.receive("Found\r".utf8());
        parser.receive("\nContent-Type: text/html\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 404);
        TKAssertExactEquals(receivedMessage, "Not Found");

        // bad, version
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.0 404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, extra space before code
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1  404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, extra space at start
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive(" HTTP/1.1  404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, return at start
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("\rHTTP/1.1 404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, empty line at start
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("\r\nHTTP/1.1 404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, newline at start
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("\nHTTP/1.1 404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, tab instead of space
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1\t404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, newline instead of space
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1\n404 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, 2-digit code
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 12 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, 1-digit code
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 1 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, 4-digit code
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 1234 Not Found\r\n".utf8());
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, too long
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive(JSData.initWithLength(4097));
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);

        // bad, too long in chunks
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive(JSData.initWithLength(4095));
        TKAssertNull(receivedError);
        parser.receive(JSData.initWithLength(2));
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
    },

    testHeaders: function(){

        var receivedCode = null;
        var receivedMessage = null;
        var receivedError = null;
        var receivedHeaders = null;
        var delegate = {
            httpParserDidReceiveStatus: function(httpParser, statusCode, message){
                TKAssertExactEquals(httpParser, parser);
                receivedCode = statusCode;
                receivedMessage = message;
            },

            httpParserDidReceiveHeaders: function(httpParser, headers){
                TKAssertExactEquals(httpParser, parser);
                receivedHeaders = headers;
            },

            httpParserDidError: function(httpParser, error){
                TKAssertExactEquals(httpParser, parser);
                receivedError = error;
            }
        };

        // Good
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        var parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive("Content-Type: text/html\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("Content-length: 200\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNotNull(receivedHeaders);
        TKAssertEquals(receivedHeaders.headers.length, 2);
        TKAssertEquals(receivedHeaders.headers[0].name, "Content-Type");
        TKAssertEquals(receivedHeaders.headers[0].value, "text/html");
        TKAssertEquals(receivedHeaders.headers[1].name, "Content-length");
        TKAssertEquals(receivedHeaders.headers[1].value, "200");

        // No value
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive("Content-Type: text/html\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("Not really a header\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("Content-length: 200\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNotNull(receivedHeaders);
        TKAssertEquals(receivedHeaders.headers.length, 3);
        TKAssertEquals(receivedHeaders.headers[0].name, "Content-Type");
        TKAssertEquals(receivedHeaders.headers[0].value, "text/html");
        TKAssertEquals(receivedHeaders.headers[1].name, "Not really a header");
        TKAssertEquals(receivedHeaders.headers[1].value, "");
        TKAssertEquals(receivedHeaders.headers[2].name, "Content-length");
        TKAssertEquals(receivedHeaders.headers[2].value, "200");

        // Newline
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive("Content-Type: text/html\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("X-Multiline: Hello\nWorld!\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("Content-length: 200\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNotNull(receivedHeaders);
        TKAssertEquals(receivedHeaders.headers.length, 3);
        TKAssertEquals(receivedHeaders.headers[0].name, "Content-Type");
        TKAssertEquals(receivedHeaders.headers[0].value, "text/html");
        TKAssertEquals(receivedHeaders.headers[1].name, "X-Multiline");
        TKAssertEquals(receivedHeaders.headers[1].value, "Hello\nWorld!");
        TKAssertEquals(receivedHeaders.headers[2].name, "Content-length");
        TKAssertEquals(receivedHeaders.headers[2].value, "200");

        // Chunks
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive("Cont".utf8());
        parser.receive("ent-Type".utf8());
        parser.receive(": text".utf8());
        parser.receive("/html\r".utf8());
        parser.receive("\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("Content-length:".utf8());
        parser.receive(" 20".utf8());
        parser.receive("0\r".utf8());
        parser.receive("\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive("\r".utf8());
        parser.receive("\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNotNull(receivedHeaders);
        TKAssertEquals(receivedHeaders.headers.length, 2);
        TKAssertEquals(receivedHeaders.headers[0].name, "Content-Type");
        TKAssertEquals(receivedHeaders.headers[0].value, "text/html");
        TKAssertEquals(receivedHeaders.headers[1].name, "Content-length");
        TKAssertEquals(receivedHeaders.headers[1].value, "200");

        // Too long
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive(JSData.initWithLength(4097));
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);

        // Too long, chunks
        receivedCode = null;
        receivedMessage = null;
        receivedError = null;
        receivedHeaders = null;
        parser = JSHTTPResponseParser.init();
        parser.delegate = delegate;
        parser.receive("HTTP/1.1 200 OK\r\n".utf8());
        TKAssertNull(receivedError);
        TKAssertNotNull(receivedCode);
        TKAssertNotNull(receivedMessage);
        TKAssertExactEquals(receivedCode, 200);
        TKAssertExactEquals(receivedMessage, "OK");
        receivedCode = null;
        receivedMessage = null;
        parser.receive(JSData.initWithLength(4095));
        TKAssertNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
        parser.receive(JSData.initWithLength(2));
        TKAssertNotNull(receivedError);
        TKAssertNull(receivedCode);
        TKAssertNull(receivedMessage);
        TKAssertNull(receivedHeaders);
    }

});