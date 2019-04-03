// #import Foundation
/* global JSProtocol */
'use strict';

JSProtocol("SKHTTPWebSocketParserDelegate", JSProtocol, {

    frameParserDidReceivePing: ['parser', 'chunks'],
    frameParserDidReceivePong: ['parser', 'chunks'],
    frameParserDidReceiveClose: ['parser', 'chunks'],
    frameParserDidReceiveFrameOutOfSequence: ['parser'],
    frameParserDidReceiveInvalidLength: ['parser'],
    frameParserDidReceiveData: ['parser', 'data'],
    frameParserDidReceiveMessage: ['parser']

});