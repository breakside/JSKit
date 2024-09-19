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

// #import "SECDataKey.js"
/* jshint node: true */
'use strict';

var crypto = require('crypto');

JSClass("SECNodeKey", SECKey, {

    nodeKeyObject: null,

    initWithData: function(data){
        this.nodeKeyObject = crypto.createSecretKey(data.nodeBuffer());
    },

    initWithNodeKeyObject: function(nodeKeyObject){
        this.nodeKeyObject = nodeKeyObject;
    },

    getNodeKeyObject: function(completion, target){
        completion.call(target, this.nodeKeyObject);
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var buffer = this.nodeKeyObject.export({format: "buffer"});
        JSRunLoop.main.schedule(completion, target, JSData.initWithNodeBuffer(buffer));
        return completion.promise;
    },

    destroy: function(){
        this.nodeKeyObject = null;
    }

});

SECKey.definePropertiesFromExtensions({

    getNodeKeyObject: function(completion, target){
        this.getData(function(data){
            let keyObject = crypto.createSecretKey(data.nodeBuffer());
            completion.call(target, null);
        }, this);
    }

});