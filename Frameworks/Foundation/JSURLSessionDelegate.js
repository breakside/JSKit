// #import "JSProtocol.js"
'use strict';

JSProtocol("JSURLSessionDelegate", JSProtocol, {

    urlSessionTaskDidSendBodyData: function(session, task, totalSent, totalExpected){},
    urlSessionTaskDidReceiveBodyData: function(session, task, totalReceived, totalExpected){},
    urlSessionTaskDidComplete: function(session, task, error){},
    urlSessionTaskDidOpenStream: function(session, task){},
    urlSessionTaskDidCloseStream: function(session, task){},
    urlSessionTaskDidReceiveStreamData: function(session, task, data){},
    urlSessionTaskDidReceiveStreamError: function(session, task){}

});