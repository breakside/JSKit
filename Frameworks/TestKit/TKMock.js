// // Copyright 2021 Breakside Inc.
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

// #import Foundation
"use strict";

JSGlobalObject.TKMock = function(methods){
    var mockClass = function(){
        this.mock = {};
        for (var name in methods){
            this.mock[name] = {calls: [], results: []};
        }
    };
    var defineMethod = function(name, argNames){
        mockClass.prototype[name] = function(){
            var call = {};
            for (var i = 0, l = arguments.length; i < l; ++i){
                call[argNames[i]] = arguments[i];
            }
            var result = this.mock[name].results[this.mock[name].calls.length];
            if (result === undefined){
                throw new Error("Unexpected call #%d to %s".sprintf(this.mock[name].calls.length, name));
            }
            this.mock[name].calls.push(call);
            if (result.execption){
                throw result.execption;
            }
            if (result.callback){
                var fn = arguments[arguments.length - 1];
                var arg1 = result.callback.error;
                var arg2 = result.callback.result;
                JSRunLoop.main.schedule(fn, undefined, arg1, arg2);
            }
            if (result.value){
                return result.value;
            }
        };
    };
    for (var name in methods){
        defineMethod(name, methods[name]);
    }
    return mockClass;
};