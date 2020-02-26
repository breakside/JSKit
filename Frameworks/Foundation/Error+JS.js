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

'use strict';

(function(){

Object.defineProperties(Error.prototype, {

    frames: {
        get: function Error_getFrames(){
            var frames = [];
            if (this.stack){
                var lines = this.stack.split("\n");
                var frame;
                for (var i = 0, l = lines.length; i < l; ++i){
                    frame = frameFromLine(lines[i]);
                    if (frame){
                        frames.push(frame);
                    }
                }
            }
            return frames;
        }
    }

});


// Safari: searchChanged@https://test1.breakside.dev:8089/debug/JS/SidebarViewController.js:213:23
// Firefox: textStorageDidReplaceCharactersInRange@https://test1.breakside.dev:8089/debug/Frameworks/Foundation/JSTextLayoutManager.js:186:25
// Chrome:     at SidebarViewController.searchChanged (https://test1.breakside.dev:8089/debug/JS/SidebarViewController.js:213:9)
// Chrome:     at https://test1.breakside.dev:8089/debug/JS/ApplicationDelegateShared.js:22:24

var chromeLikePattern = {
    regex: /^\s+at\s+(.+\.)?([^.]+)\s*\((.+):(\d+):(\d+)\)$/,
    groups: {method: 2, filename: 3, lineno: 4, colno: 5}
};
var chromeMethodlessPattern = {
    regex: /^\s+at\s+(.+):(\d+):(\d+)$/,
    groups: {method: -1, filename: 1, lineno: 2, colno: 3}
};
var firefoxLikePattern = {
    regex: /^(.+)@(.+):(\d+):(\d+)$/,
    groups: {method: 1, filename: 2, lineno: 3, colno: 4}
};
var firefoxMethodlessPattern = {
    regex: /^(.+):(\d+):(\d+)$/,
    groups: {method: -1, filename: 1, lineno: 2, colno: 3}
};
var patterns = [chromeLikePattern, chromeMethodlessPattern, firefoxLikePattern, firefoxMethodlessPattern];

var frameFromLine = function(line){
    var matches;
    var pattern;
    for (var i = 0, l = patterns.length; i < l; ++i){
        pattern = patterns[i];
        matches = line.match(pattern.regex);
        if (matches){
            return {
                method: pattern.groups.method > 0 ? matches[pattern.groups.method] : '',
                filename: matches[pattern.groups.filename],
                lineno: parseInt(matches[pattern.groups.lineno]),
                colno: parseInt(matches[pattern.groups.colno])
            };
        }
    }
};

})();