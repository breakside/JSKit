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

    addObserver: function(name, sender, callback, target){
        var observers = this._observersByName[name];
        if (!observers){
            observers = this._observersByName[name] = {};
        }
        var observerId = this._nextObserverId++;
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