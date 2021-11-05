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

JSGlobalObject.JSDate = function(){
    throw Error("JSDate must be called with init method");
};

JSDate.prototype = {

    isEqual: function(other){
        return Math.abs(this.timeIntervalSince1970 - other.timeIntervalSince1970) < 0.001;
    },

    isPast: function(){
        return this.timeIntervalSince1970 < JSDate.now.timeIntervalSince1970;
    },

    compare: function(other){
        return this.timeIntervalSince1970 - other.timeIntervalSince1970;
    },

    addingTimeInterval: function(timeInterval){
        return JSDate.initWithTimeIntervalSince1970(this.timeIntervalSince1970 + timeInterval);
    },

    timeIntervalSinceDate: function(other){
        return this.timeIntervalSince1970 - other.timeIntervalSince1970;
    },

    timeIntervalUntilDate: function(other){
        return other.timeIntervalSince1970 - this.timeIntervalSince1970;
    },

    toString: function(){
        var d = new Date(this.timeIntervalSince1970);
        return "%s: UTC %s".sprintf(this.timeIntervalSince1970, d.toGMTString());
    }
};

Object.defineProperties(JSDate.prototype, {

});

JSDate.initWithTimeIntervalSince1970 = function(timeInterval){
    if (timeInterval === null || timeInterval === undefined){
        return null;
    }
    return Object.create(JSDate.prototype, {timeIntervalSince1970: {value: timeInterval}});
};

JSDate.initWithTimeIntervalSinceNow = function(timeInterval){
    if (timeInterval === null || timeInterval === undefined){
        return null;
    }
    return JSDate.initWithTimeIntervalSince1970((Date.now() / 1000) + timeInterval);
};


var maxSafeInteger = 9007199254740991;

Object.defineProperties(JSDate, {

    now: {
        get: function JSDate_getNow(){
            return JSDate.initWithTimeIntervalSinceNow(0);
        }
    },

    unixEpoch: {
        get: function JSDate_getUnixEpoch(){
            return JSDate.initWithTimeIntervalSince1970(0);
        }
    },

    distantPast: {
        get: function JSDate_getDistantPast(){
            return JSDate.initWithTimeIntervalSince1970(-maxSafeInteger);
        }
    },

    distantFuture: {
        get: function JSDate_getDistantPast(){
            return JSDate.initWithTimeIntervalSince1970(maxSafeInteger);
        }
    },

});

})();