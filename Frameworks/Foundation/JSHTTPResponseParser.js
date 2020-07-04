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
// #import "JSLog.js"
// #import "JSMIMEHeaderMap.js"
'use strict';

(function(){

var logger = JSLog("http", "websocket");

JSClass("JSHTTPResponseParser", JSObject, {

    init: function(){
        this.headerMap = JSMIMEHeaderMap();
    },

    status: null,
    statusMessage: null,
    headerMap: null,
    leftover: null,
    done: true,

    receive: function(data){
        if (this.leftover !== null){
            data = JSData.initWithChunks([this.leftover, data]);
            this.leftover = null;
        }
        if (data.length >= 4096){
            throw new Error("Received too much data without a line ending");
        }
        var start = 0;
        var i = 1;
        var line;
        do {
            i = data.indexOf(0x10, start);
            if (i > 0){
                if (data[i - 1] == 0x13){
                    ++i;
                    line = data.subdataInRange(JSRange(0, i - 2)).stringByDecodingUTF8();
                    this.receiveLine(line);
                    data = data.subdataInRange(JSRange(i, data.length - i));
                    start = 0;
                }else{
                    start = i + 1;
                }
            }
        }while (!this.done && i > 0 && data.length > 0);
        if (data.length > 0){
            this.leftover = data;
        }
    },

    receiveLine: function(line){
        var parts;
        if (this.status === null){
            var matches = line.match(/^HTTP\/1\.1\s+(\d+)\s+/);
            if (matches === null){
                throw new Error("Expecting response line");
            }
            this.status = parseInt(matches.group(1));
        }else if (line === ""){
            this.done = true;
        }else{
            this.headerMap.parseLine(line);
        }
    },
});

})();