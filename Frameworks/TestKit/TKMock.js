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
        if (this === undefined){
            return new mockClass();
        }
        var createMethod = function(name, argNames){
            var mockMethod = function(){
                var callIndex = mockMethod.calls.length;
                var call = {};
                for (var i = 0, l = arguments.length; i < l; ++i){
                    call[argNames[i]] = arguments[i];
                }
                var result = mockMethod.results[callIndex];
                if (result === undefined){
                    throw new Error("No expected results for call #%d to %s".sprintf(callIndex, name));
                }
                mockMethod.calls.push(call);
                if (result.exception){
                    throw result.exception;
                }
                if (result.callback){
                    var fn = arguments[result.callback.argIndex];
                    if (typeof(fn) !== "function"){
                        throw new Error("Callback function for call #%d to %s not found at arg #%d".sprintf(callIndex, name, result.callback.argIndex));
                    }
                    JSRunLoop.main.schedule(function(){
                        fn.apply(undefined, result.callback.args);
                    });
                }
                if (result.value){
                    return result.value;
                }
            };
            mockMethod.calls = [];
            mockMethod.results = [];
            mockMethod.addReturn = function(value){
                mockMethod.results.push({value: value});
            };
            mockMethod.addThrow = function(error){
                mockMethod.results.push({exception: error});
            };
            mockMethod.addCallback = function(args, argIndex){
                if (argIndex === undefined){
                    argIndex = argNames.length - 1;
                }else if (typeof(argIndex) === "string"){
                    argIndex = argNames.indexOf(argIndex);
                }
                mockMethod.results.push({callback: {args: args, argIndex: argIndex}});
            };
            return mockMethod;
        };
        for (var name in methods){
            this[name] = createMethod(name, methods[name]);
        }
    };
    return mockClass;
};