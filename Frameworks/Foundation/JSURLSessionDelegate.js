// #import "JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSURLSessionDelegate", JSProtocol, {

    urlSessionTaskDidSendBodyData: function(session, task, totalSent, totalExpected){},
    urlSessoinTaskDidReceiveBodyData: function(session, task, totalReceived, totalExpected){},
    urlSessionTaskDidComplete: function(session, task, error){},
    urlSessionTaskDidOpenStream: function(session, task){},
    urlSessionTaskDidCloseStream: function(session, task){},
    urlSessionTaskDidReceiveStreamData: function(session, task, data){},
    urlSessionTaskDidReceiveStreamError: function(session, task){}

});