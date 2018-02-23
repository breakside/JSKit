// #import "Foundation/JSObject.js"
// #import "Foundation/JSURLSessionDataTask.js"
// #import "Foundation/JSURLSessionUploadTask.js"
// #import "Foundation/JSURLSessionStreamTask.js"
// #import "Foundation/JSURLRequest.js"
/* global JSObject, JSClass, JSURLSession, JSURLSessionDataTask, JSURLSessionUploadTask, JSURLRequest, JSURLSessionStreamTask */
'use strict';

JSClass("JSURLSession", JSObject, {

    delegate: null,

    init: function(){
    },

    dataTaskWithURL: function(url, completionHandler){
        var request = JSURLRequest.initWithURL(url);
        return this.dataTaskWithRequest(request, completionHandler);
    },

    dataTaskWithRequest: function(request, completionHandler){
        var task = JSURLSessionDataTask.initWithRequest(request);
        task.session = this;
        task._sessionManagedCompletionHandler = completionHandler;
        return task;
    },

    uploadTaskWithRequest: function(request, completionHandler){
        var task = JSURLSessionUploadTask.initWithRequest(request);
        task.session = this;
        task._sessionManagedCompletionHandler = completionHandler;
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
        if (task._sessionManagedCompletionHandler){
            task._sessionManagedCompletionHandler(error);
            delete task._sessionManagedCompletionHandler;
        }
        if (this.delegate && this.delegate.urlSessionTaskDidComplete){
            this.delegate.urlSessionTaskDidComplete(this, task, error);
        }
    }

});

Object.defineProperty(JSURLSession, 'sharedSession', {
    configurable: true,
    enumerable: false,
    get: function JSURLSession_sharedSession(){
        var sharedSession = JSURLSession.init();
        Object.defineProperty(JSURLSession, 'sharedSession', {
            configurable: false,
            enumerable: false,
            value: sharedSession
        });
        return sharedSession;
    }
});