// #import "Foundation/JSPrototype.js"
/* global JSPrototype */

JSPrototype("JSURLSessionStreamTaskDelegate", JSPrototype, {

    taskDidOpenStream: ['task'],
    taskDidCloseStream: ['task'],
    taskDidReceiveStreamData: ['task', 'data'],
    taskDidReceiveStreamError: ['task']

});