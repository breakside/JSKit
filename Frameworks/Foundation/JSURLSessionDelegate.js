// #import "Foundation/JSPrototype.js"
/* global JSPrototype */

JSPrototype("JSURLSessionDelegate", JSPrototype, {

    urlSessionTaskDidSendBodyData: ['session', 'task', 'totalSent', 'totalExpected'],
    urlSessoinTaskDidReceiveBodyData: ['session', 'task', 'totalReceived', 'totalExpected'],
    urlSessionTaskDidComplete: ['session', 'task', 'error'],
    urlSessionTaskDidOpenStream: ['session', 'task'],
    urlSessionTaskDidReceiveStreamData: ['session', 'task', 'data'],

});