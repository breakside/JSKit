// #import Foundation
'use strict';

JSProtocol("SKHTTPWebSocketParserDelegate", JSProtocol, {

    frameParserDidReceivePing: function(parser, chunks){},
    frameParserDidReceivePong: function(parser, chunks){},
    frameParserDidReceiveClose: function(parser, chunks){},
    frameParserDidReceiveFrameOutOfSequence: function(parser){},
    frameParserDidReceiveInvalidLength: function(parser){},
    frameParserDidReceiveData: function(parser, data){},
    frameParserDidReceiveMessage: function(parser){}

});