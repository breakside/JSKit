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

// #import Foundation
// #import "TKAssert.js"
/* global performance */
'use strict';

JSClass("TKTestSuite", JSObject, {

    expectation: null,
    bundle: null,
    implicitWaitInterval: 5,

    init: function(){
    },

    setup: function(){
    },

    teardown: function(){
    },

    now: function(){
        return performance.now();
    },

    wait: function(expectation, timeout){
        this.expectation = expectation;
        // The expectation may be done already if its callback was called immediately
        // instead of asynchronously
        if (expectation.isDone){
            return;
        }
        expectation.setTimeout(timeout);
    },

    getResourceData: function(resourceName, ext, completion, target){
        var metadata = this.bundle.metadataForResourceName(resourceName, ext);
        this.bundle.getResourceData(metadata, completion, target);
    }

});

TKTestSuite.RegisteredTestSuites = [];

TKTestSuite.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    if (name.endsWith("Tests")){
        this.RegisteredTestSuites.push(subclass);
    }
    this._FindTests(subclass);
    return subclass;
};

TKTestSuite._FindTests = function(subclass){
    var names = Object.getOwnPropertyNames(subclass.prototype);
    subclass.cases = [];
    var x;
    for (var i = 0, l = names.length; i < l; ++i){
        x = names[i];
        if (x.length > 4 && x.substr(0,4) == 'test' && x[4] >= 'A' && x[4] <= 'Z'){
            subclass.cases.push(x);
        }
    }
};