// #import ServerKit
// #import TestKit
/* global JSClass, TKTestSuite, SKHTTPWebSocketParser, TKAssertEquals, TKAssertObjectEquals, TKAssertNotNull, TKAssert, JSData, JSRange */
'use strict';

JSClass("SKHTTPWebSocketParserTests", TKTestSuite, {

    testUnmaskedBinaryFrame: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var data = JSData.initWithArray([0x82, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertNotNull(received);
        TKAssertEquals(received.length, 5);
        TKAssertEquals(received[0], 0x01);
        TKAssertEquals(received[1], 0x02);
        TKAssertEquals(received[2], 0x03);
        TKAssertEquals(received[3], 0x04);
        TKAssertEquals(received[4], 0x05);
        TKAssert(messageReceived);
    },

    testUnmaksedTextFrame: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var data = JSData.initWithArray([0x81, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertNotNull(received);
        TKAssertEquals(received.length, 5);
        TKAssertEquals(received[0], 0x48);
        TKAssertEquals(received[1], 0x65);
        TKAssertEquals(received[2], 0x6c);
        TKAssertEquals(received[3], 0x6c);
        TKAssertEquals(received[4], 0x6f);
        TKAssert(messageReceived);
    },

    testMaskedBinaryFrame: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var mask = JSData.initWithArray([0xA, 0xB, 0xC, 0xD]);
        var data = JSData.initWithArray([0x82, 0x85, mask[0], mask[1], mask[2], mask[3], 0x01 ^ mask[0], 0x02 ^ mask[1], 0x03 ^ mask[2], 0x04 ^ mask[3], 0x05 ^ mask[0]]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertNotNull(received);
        TKAssertEquals(received.length, 5);
        TKAssertEquals(received[0], 0x01);
        TKAssertEquals(received[1], 0x02);
        TKAssertEquals(received[2], 0x03);
        TKAssertEquals(received[3], 0x04);
        TKAssertEquals(received[4], 0x05);
        TKAssert(messageReceived);
    },

    testMaskedTextFrame: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var data = JSData.initWithArray([0x81, 0x85, 0x37, 0xfa, 0x21, 0x3d, 0x7f, 0x9f, 0x4d, 0x51, 0x58]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertNotNull(received);
        TKAssertEquals(received.length, 5);
        TKAssertEquals(received[0], 0x48);
        TKAssertEquals(received[1], 0x65);
        TKAssertEquals(received[2], 0x6c);
        TKAssertEquals(received[3], 0x6c);
        TKAssertEquals(received[4], 0x6f);
        TKAssert(messageReceived);
    },

    testFragmentedTextFrames: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var data = JSData.initWithArray([0x01, 0x03, 0x48, 0x65, 0x6c]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertEquals(received.length, 3);
        TKAssertEquals(received[0], 0x48);
        TKAssertEquals(received[1], 0x65);
        TKAssertEquals(received[2], 0x6c);
        TKAssert(!messageReceived);

        data = JSData.initWithArray([0x80, 0x02, 0x6c, 0x6f]);
        parser.receive(data);
        TKAssertEquals(receiveCount, 2);
        TKAssertEquals(received.length, 2);
        TKAssertEquals(received[0], 0x6c);
        TKAssertEquals(received[1], 0x6f);
        TKAssert(messageReceived);


        parser = SKHTTPWebSocketParser.init();
        receiveCount = 0;
        received = [];
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received.push(data);
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        data = JSData.initWithArray([0x01, 0x03, 0x48, 0x65, 0x6c, 0x80, 0x02, 0x6c, 0x6f]);
        parser.receive(data);
        TKAssertEquals(received.length, 2);
        TKAssertEquals(received[0].length, 3);
        TKAssertEquals(received[1].length, 2);
        TKAssertEquals(received[0][0], 0x48);
        TKAssertEquals(received[0][1], 0x65);
        TKAssertEquals(received[0][2], 0x6c);
        TKAssertEquals(received[1][0], 0x6c);
        TKAssertEquals(received[1][1], 0x6f);
        TKAssert(messageReceived);
    },

    testFragmentedTextFramesByteByByte: function(){
        var parser = SKHTTPWebSocketParser.init();
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;

        parser = SKHTTPWebSocketParser.init();
        received = [];
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received.push(data);
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        var data = JSData.initWithArray([0x01, 0x03, 0x48, 0x65, 0x6c, 0x80, 0x02, 0x6c, 0x6f]);
        for (var i = 0, l = data.length - 1; i < l; ++i){
            parser.receive(data.subdataInRange(JSRange(i, 1)));
            TKAssert(!messageReceived);
        }
        parser.receive(data.subdataInRange(JSRange(data.length - 1, 1)));
        TKAssertEquals(received.length, 5);
        TKAssertEquals(received[0].length, 1);
        TKAssertEquals(received[1].length, 1);
        TKAssertEquals(received[2].length, 1);
        TKAssertEquals(received[3].length, 1);
        TKAssertEquals(received[4].length, 1);
        TKAssertEquals(received[0][0], 0x48);
        TKAssertEquals(received[1][0], 0x65);
        TKAssertEquals(received[2][0], 0x6c);
        TKAssertEquals(received[3][0], 0x6c);
        TKAssertEquals(received[4][0], 0x6f);
        TKAssert(messageReceived);
    },

    testUnmaskedHeaderForData: function(){
        var data = "Hello".utf8();
        var header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data]);
        TKAssertNotNull(header);
        TKAssertEquals(header.length, 2);
        TKAssertEquals(header[0], 0x82);
        TKAssertEquals(header[1], 0x05);

        header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.binary, false);
        TKAssertNotNull(header);
        TKAssertEquals(header.length, 2);
        TKAssertEquals(header[0], 0x02);
        TKAssertEquals(header[1], 0x05);

        header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.continuation, false);
        TKAssertNotNull(header);
        TKAssertEquals(header.length, 2);
        TKAssertEquals(header[0], 0x00);
        TKAssertEquals(header[1], 0x05);

        header = SKHTTPWebSocketParser.UnmaskedHeaderForData([data], SKHTTPWebSocketParser.FrameCode.continuation, true);
        TKAssertNotNull(header);
        TKAssertEquals(header.length, 2);
        TKAssertEquals(header[0], 0x80);
        TKAssertEquals(header[1], 0x05);
    },

    testRealWorldData: function(){
        var parser = SKHTTPWebSocketParser.init();
        var data = JSData.initWithArray([0x81, 0x8b, 0xab, 0x25, 0x15, 0x85, 0xdf, 0x40, 0x66, 0xf1, 0xc2, 0x4b, 0x72, 0xa5, 0x9a, 0x17, 0x26]);
        var receiveCount = 0;
        var received = null;
        var messageReceived = false;
        parser.delegate = {
            frameParserDidReceiveData: function(parser, data){
                received = data;
                ++receiveCount;
            },
            frameParserDidReceiveMessage: function(parser){
                messageReceived = true;
            }
        };
        parser.receive(data);
        TKAssertEquals(receiveCount, 1);
        TKAssertEquals(received.length, 11);
        TKAssertObjectEquals(received, "testing 123".utf8());
        TKAssert(messageReceived);
    }

    // TODO: lengths > 125
    // TODO: lengths > 0xFFFF
    // TODO: lengths > 2^31
    // TODO: ping/pong
    // TODO: close
    // TODO: out of sequence
    // TODO: unknown frame type

});