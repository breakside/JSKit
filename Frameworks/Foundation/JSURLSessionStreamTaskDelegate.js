// #import "JSProtocol.js"
/* global JSProtocol */
'use strict';

JSProtocol("JSURLSessionStreamTaskDelegate", JSProtocol, {

    taskDidOpenStream: function(task){},
    taskDidCloseStream: function(task){},
    taskDidReceiveStreamData: function(task, data){},
    taskDidReceiveStreamError: function(task){}

});