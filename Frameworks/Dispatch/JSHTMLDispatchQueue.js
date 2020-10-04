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
// #feature window.Worker
// jshint browser: true, worker: true
'use strict';

(function(){

JSClass("JSHTMLDispatchQueue", JSWorkerBasedDispatchQueue, {

    worker: null,

    startWorker: function(){
        var bundle = JSBundle.testBundle || JSBundle.mainBundle;
        this.worker = new Worker(bundle.info[JSHTMLDispatchQueueWorkerScriptBundleKey]);
        this.worker.addEventListener('message', this);
    },

    sendWorkerMessage: function(message){
        this.worker.postMessage(message);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        this.receiveWorkerMessage(e.data);
    },

    close: function(){
        this.worker.terminate();
        this.worker = null;
    }

});

JSClass("JSHTMLDispatchQueueWorker", JSWorkerBasedDispatchQueueWorker, {

    environmentInit: function(){
        self.addEventListener('message', this);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    message: function(e){
        this.receiveQueueMessage(e.data);
    },

    sendQueueMessage: function(message){
        self.postMessage(message);
    },

    close: function(){
        self.close();
    }

});

JSDispatchQueue.EnvironmentImplemenationClass = JSHTMLDispatchQueue;

var JSHTMLDispatchQueueWorkerScriptBundleKey = 'JSHTMLDispatchQueueWorkerScript';

})();