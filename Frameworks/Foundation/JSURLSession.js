// #import "JSObject.js"
// #import "JSURLSessionDataTask.js"
// #import "JSURLSessionUploadTask.js"
// #import "JSURLSessionStreamTask.js"
// #import "JSURLRequest.js"
/* global JSObject, JSClass, JSURLSession, JSURLSessionDataTask, JSURLSessionUploadTask, JSURLRequest, JSURLSessionStreamTask */
'use strict';

JSClass("JSURLSession", JSObject, {

    delegate: null,

    init: function(){
    },

    dataTaskWithURL: function(url, completion, target){
        var request = JSURLRequest.initWithURL(url);
        return this.dataTaskWithRequest(request, completion, target);
    },

    dataTaskWithRequest: function(request, completion, target){
        var task = JSURLSessionDataTask.initWithRequest(request);
        task.session = this;
        task.completion = completion;
        task.target = target;
        return task;
    },

    uploadTaskWithRequest: function(request, data, completion, target){
        if (data !== null && data !== undefined){
            request.data = data;
        }
        var task = JSURLSessionUploadTask.initWithRequest(request);
        task.session = this;
        task.completion = completion;
        task.target = target;
        return task;
    },

    streamTaskWithURL: function(url, requestedProtocols){
        var task = JSURLSessionStreamTask.initWithURL(url, requestedProtocols);
        task.session = this;
        return task;
    },

    _taskDidSendBodyData: function(task, totalSent, totalExpected){
        if (task.progressDelegate && task.progressDelegate.taskDidSendBodyData){
            task.progressDelegate.taskDidSendBodyData(task, totalSent, totalExpected);
        }
        if (this.delegate && this.delegate.urlSessionTaskDidSendBodyData){
            this.delegate.urlSessionTaskDidSendBodyData(this, task, totalSent, totalExpected);
        }
    },

    _taskDidReceiveBodyData: function(task, totalReceived, totalExpected){
        if (task.progressDelegate && task.progressDelegate.taskDidReceiveBodyData){
            task.progressDelegate.taskDidReceiveBodyData(task, totalReceived, totalExpected);
        }
        if (this.delegate && this.delegate.urlSessionTaskDidSendBodyData){
            this.delegate.urlSessoinTaskDidReceiveBodyData(this, task, totalReceived, totalExpected);
        }
    },

    _taskDidOpenStream: function(task){
        if (task.streamDelegate && task.streamDelegate.taskDidOpenStream){
            task.streamDelegate.taskDidOpenStream(task);
        }
        if (this.delegate && this.delegate.urlsSessionTaskDidOpenStream){
            this.delegate.urlsSessionTaskDidOpenStream(this, task);
        }
    },

    _taskDidCloseStream: function(task){
        if (task.streamDelegate && task.streamDelegate.taskDidCloseStream){
            task.streamDelegate.taskDidCloseStream(task);
        }
        if (this.delegate && this.delegate.urlsSessionTaskDidCloseStream){
            this.delegate.urlsSessionTaskDidCloseStream(this, task);
        }
    },

    _taskDidReceiveStreamError: function(task){
        if (task.streamDelegate && task.streamDelegate.taskDidReceiveStreamError){
            task.streamDelegate.taskDidReceiveStreamError(task);
        }
        if (this.delegate && this.delegate.urlsSessionTaskDidReceiveStreamError){
            this.delegate.urlsSessionTaskDidReceiveStreamError(this, task);
        }
    },

    _taskDidReceiveStreamData: function(task, data){
        if (task.streamDelegate && task.streamDelegate.taskDidReceiveStreamData){
            task.streamDelegate.taskDidReceiveStreamData(task, data);
        }
        if (this.delegate && this.delegate.urlsSessionTaskDidReceiveStreamData){
            this.delegate.urlsSessionTaskDidReceiveStreamData(this, task, data);
        }
    },

    _taskDidComplete: function(task, error){
        if (task.completion){
            task.completion.call(task.target, error);
            task.completion = null;
            task.target = null;
        }
        if (this.delegate && this.delegate.urlSessionTaskDidComplete){
            this.delegate.urlSessionTaskDidComplete(this, task, error);
        }
    }

});

Object.defineProperty(JSURLSession, 'shared', {
    configurable: true,
    enumerable: false,
    get: function JSURLSession_shared(){
        var shared = JSURLSession.init();
        Object.defineProperty(JSURLSession, 'shared', {
            configurable: false,
            enumerable: false,
            value: shared
        });
        return shared;
    }
});