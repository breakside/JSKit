// #import "Foundation/JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSURLSessionStreamTaskDelegate", JSProtocol, {

    taskDidOpenStream: ['task'],
    taskDidCloseStream: ['task'],
    taskDidReceiveStreamData: ['task', 'data'],
    taskDidReceiveStreamError: ['task']

});