// #import "Foundation/JSObject.js"
/* global JSClass, JSObject, JSDate, JSReadOnlyProperty, JSDynamicProperty */
'use strict';

(function(){

JSClass("JSDate", JSObject, {

    initWithTimeIntervalSince1970: function(timeInterval){
        this._timeIntervalSince1970 = timeInterval;
    },

    initWithTimeIntervalSinceNow: function(timeInterval){
        this.initWithTimeIntervalSince1970((Date.now() / 1000) + timeInterval);
    },

    timeIntervalSince1970: JSReadOnlyProperty('_timeIntervalSince1970'),

    isEqual: function(other){
        return Math.abs(this._timeIntervalSince1970 - other._timeIntervalSince1970) < 0.001;
    },

    compare: function(other){
        return this._timeIntervalSince1970 - other._timeIntervalSince1970;
    },

    addingTimeInterval: function(timeInterval){
        return JSDate.initWithTimeIntervalSince1970(this._timeIntervalSince1970 + timeInterval);
    }

});

var maxSafeInteger = 9007199254740991;

Object.defineProperties(JSDate, {

    now: {
        get: function JSDate_getNow(){
            return JSDate.initWithTimeIntervalSinceNow(0);
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