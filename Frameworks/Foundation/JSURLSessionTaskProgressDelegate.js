// #import "JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSURLSessionTaskProgressDelegate", JSProtocol, {
    taskDidSendBodyData: function(task, totalSent, totalExpected){},
    taskDidReceiveBodyData: function(task, totalReceived, totalExpected){}
});