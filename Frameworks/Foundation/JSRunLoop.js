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
'use strict';

(function(){

var initAllowed = false;

JSClass("JSRunLoop", JSObject, {

    init: function(){
        if (!initAllowed){
            throw new Error("Cannot instantiate a JSRunLoop, you must use JSRunLoop.main");
        }
        this._environmentInit();
    },

    _environmentInit: function(){

    },

    schedule: function(action, target){
    }

});

Object.defineProperties(JSRunLoop, {

    main: {
        configurable: true,
        get: function JSRunLoop_getMain(){
            initAllowed = true;
            var mainLoop = JSRunLoop.init();
            initAllowed = false;
            Object.defineProperty(JSRunLoop, 'main', {value: mainLoop});
            return mainLoop;
        }
    }

});

})();