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

// #import "Promise+JS.js"
// #import "JSBundle.js"
// jshint node: true
'use strict';

var fs = require('fs');
var path = require('path');

JSBundle.definePropertiesFromExtensions({

    getResourceData: function(metadata, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var resourcePath = JSBundle.getNodePath(metadata);
        fs.readFile(resourcePath, function(error, buffer){
            if (error){
                completion.call(target, null);
                return;
            }
            completion.call(target, JSData.initWithNodeBuffer(buffer));
        });
        return completion.promise;
    },

});

JSBundle.getNodePath = function(metadata){
    var resourcePath = metadata.nodeBundlePath;
    if (!path.isAbsolute(resourcePath)){
        resourcePath = path.join(JSBundle.nodeRootPath, metadata.nodeBundlePath);
    }
    return resourcePath;
};