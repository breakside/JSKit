// #import "Foundation/JSProtocol.js"
/* global JSProtocol */

JSProtocol("JSURLSessionStreamTaskDelegate", JSProtocol, {

    taskDidOpenStream: ['task'],
    taskDidCloseStream: ['task'],
    taskDidReceiveStreamData: ['task', 'data'],
    taskDidReceiveStreamError: ['task']

});