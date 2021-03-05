// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "JSObject.js"
// #import "JSURLRequest.js"
'use strict';

JSClass("JSURLSession", JSObject, {

    delegate: null,
    dataTaskClass: null,
    uploadTaskClass: null,
    streamTaskClass: null,

    init: function(){
    },

    dataTaskWithURL: function(url, completion, target){
        var request = JSURLRequest.initWithURL(url);
        return this.dataTaskWithRequest(request, completion, target);
    },

    dataTaskWithRequest: function(request, completion, target){
        var task = this.dataTaskClass.initWithRequest(request);
        task.session = this;
        task.completion = completion;
        task.target = target;
        return task;
    },

    uploadTaskWithRequest: function(request, data, completion, target){
        if (data !== null && data !== undefined){
            request.data = data;
        }
        var task = this.uploadTaskClass.initWithRequest(request);
        task.session = this;
        task.completion = completion;
        task.target = target;
        return task;
    },

    streamTaskWithURL: function(url, requestedProtocols){
        var task = this.streamTaskClass.initWithURL(url, requestedProtocols);
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
            this.delegate.urlSessionTaskDidReceiveBodyData(this, task, totalReceived, totalExpected);
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