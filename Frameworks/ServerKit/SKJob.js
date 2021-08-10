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

// #import Foundation
// #import "SKJobContext.js"
"use strict";

JSClass("SKJob", JSObject, {

    contextClass: SKJobContext,

    id: null,
    context: null,
    priority: 50,
    errors: null,

    initFromDictionary: function(dictionary){
    },

    encodeToDictionary: function(dictionary){
    },

    run: function(completion){
    },

    toString: function(){
        return "%s(%s)".sprintf(this.$class.className, this.id);
    }

});

SKJob.Priority = {
    lowest: 1,
    low: 2,
    normal: 3,
    high: 4,
    highest: 5
};

SKJob.subclassesByName = {};

SKJob.$extend = function(extensions, className){
    var subclass = JSObject.$extend.call(this, extensions, className);
    SKJob.subclassesByName[className] = subclass;
    return subclass;
};