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

// #import "JSWorkerBasedDispatchQueue.js"
// jshint node: true
'use strict';

var child_process = require('child_process');
var path = require('path');

JSClass("JSNodeDispatchQueue", JSWorkerBasedDispatchQueue, {

    child: null,

    startWorker: function(){
        var workerModule = JSBundle.mainBundle.info[JSNodeDispatchQueueWorkerModuleBundleKey];
        var mainDir = path.dirname(require.main.filename);
        this.child = child_process.fork(path.join(mainDir, workerModule));
        this.child.on('message', this.receiveWorkerMessage.bind(this));
    },

    sendWorkerMessage: function(message){
        this.child.send(message);
    },

    close: function(){
        this.child.kill();
        this.child = null;
    }

});

JSClass("JSNodeDispatchQueueWorker", JSWorkerBasedDispatchQueueWorker, {

    environmentInit: function(){
        process.on('message', this.receiveQueueMessage.bind(this));
    },

    sendQueueMessage: function(message){
        process.send(message);
    },

    close: function(){
        process.kill();
    }

});

JSDispatchQueue.EnvironmentImplemenationClass = JSNodeDispatchQueue;

var JSNodeDispatchQueueWorkerModuleBundleKey = 'JSNodeDispatchQueueWorkerModule';