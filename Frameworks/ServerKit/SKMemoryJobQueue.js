// Copyright 2021 Breakside Inc.
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

// #import "SKJobQueue.js"
// jshint node: true, esversion: 8
'use strict';

JSClass("SKMemoryJobQueue", SKJobQueue, {

    init: function(url, redis){
        SKMemoryJobQueue.$super.init();
        this.jobs = [];
    },

    enqueueDictionary: async function(dictionary){
        for (let i = this.jobs.length - 1; i >= 0; --i){
            if (this.jobs[i].priority >= dictionary.priority){
                this.jobs.splice(i + 1, 0, dictionary);
                return;
            }
        }
        this.jobs.splice(0, 0, dictionary);
        if (this.consumer !== null){
            JSRunLoop.main.schedule(this.consumer.jobQueueCanDequeue, this.consumer, this);
        }
    },

    dequeueDictionary: async function(){
        if (this.jobs.length === 0){
            return null;
        }
        return this.jobs.shift();
    }

});