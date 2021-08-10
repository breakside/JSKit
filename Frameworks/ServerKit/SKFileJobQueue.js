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

const fs = require("fs");

JSClass("SKFileJobQueue", SKJobQueue, {

    initWithURL: function(url, fileManager){
        this.url = url;
        this.queueURL = this.url.appendingPathComponent("queue", true);
        this.workingURL = this.url.appendingPathComponent("working", true);
        this.failedURL = this.url.appendingPathComponent("failed", true);
        this.fileManager = fileManager;
    },

    close: async function(){
        if (this.watcher){
            this.watcher.close();
        }
    },

    watcher: null,

    consume: async function(consumer){
        SKFileJobQueue.consume.call(this, consumer);
        var path = this.fileManager.pathForURL(this.queueURL);
        this.watcher = fs.watch(path, {recursive: true}, this.handleChange.bind(this));
        let items = await this.fileManager.contentsOfDirectoryAtURL(this.url);
        if (items.length > 0){
            consumer.jobQueueCanDequeue(this);
        }
    },

    handleChange: function(eventType, filename){
        if (fs.existsSync(filename)){
            this.consumer.jobQueueCanDequeue(this);
        }
    },

    enqueueDictionary: async function(dictionary){
        var url = this.queueURL.appendingPathComponent("%d-%s".sprintf(dictionary.priority, dictionary.id));
        var contents = JSON.stringify(dictionary).utf8();
        await this.fileManager.createFileAtURL(url, contents);
    },

    dequeueDictionary: async function(){
        let url = null;
        while (url === null){
            let items = await this.fileManager.contentsOfDirectoryAtURL(this.url);
            // items are named with a priority prefix, so sort descending and
            // try to grab the first item
            items.sort(function(a, b){
                return b.name.localeCompare(a.name);
            });
            if (items.length === 0){
                return null;
            }
            let item = items[0];
            // If multiple workers are running, another may have moved the item
            // before we could, indicated by moveItemAtURL failing
            try{
                url = this.workingURL.appendingPathComponent(item.name.substr(3));
                await this.fileManager.moveItemAtURL(item.url, url);
            }catch (e){
                url = null;
            }
        }
        let contents = this.fileManager.contentsAtURL(url);
        return JSON.parse(contents.stringByDecodingUTF8());
    },

    complete: async function(job, error){
        var url = this.workingURL.appendingPathComponent(job.id);
        try{
            if (error !== null){
                var toURL = this.failedURL.appendingPathComponent(job.id);
                await this.fileManager.moveItemAtURL(url, toURL);
            }else{
                await this.fileManager.removeItemAtURL(url);
            }
        }catch (e){
            // don't care
        }
    },

    toString: function(){
        return "file queue %s".sprintf(this.url.lastPathComponent);
    }

});