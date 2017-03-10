// #import "Foundation/JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSURLSessionTaskProgressDelegate", JSProtocol, {
    taskDidSendBodyData: ['task', 'totalSent', 'totalExpected'],
    taskDidReceiveBodyData: ['task', 'totalReceived', 'totalExpected']
});