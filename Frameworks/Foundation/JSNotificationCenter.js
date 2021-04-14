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
// #import "JSNotification.js"
'use strict';

JSClass("JSNotificationCenter", JSObject, {

    _observersByName: null,
    _nextObserverId: 1,

    init: function(){
        this._observersByName = {};
    },

    postNotification: function(notification){
        var observers = this._observersByName[notification.name];
        if (!observers){
            return;
        }
        var observer;
        for (var id in observers){
            observer = observers[id];
            if (observer.sender === null || observer.sender === notification.sender){
                observer.callback.call(observer.target, notification);
            }
        }
    },

    post: function(name, sender, userInfo){
        var notification = JSNotification.initWithName(name, sender, userInfo);
        this.postNotification(notification);
    },

    generateObserverID: function(){
        return this._nextObserverId++;
    },

    addObserver: function(name, sender, callback, target){
        var observers = this._observersByName[name];
        if (!observers){
            observers = this._observersByName[name] = {};
        }
        var observerId = this.generateObserverID();
        var observer = {
            callback: callback,
            target: target,
            sender: sender
        };
        observers[observerId] = observer;
        return observerId;
    },

    removeObserver: function(name, observerId){
        var observers = this._observersByName[name];
        if (!observers){
            return;
        }
        delete observers[observerId];
    }

});

Object.defineProperties(JSNotificationCenter, {

    shared: {
        configurable: true,
        get: function JSNotificationCenter_getShared(){
            var shared = JSNotificationCenter.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }

});