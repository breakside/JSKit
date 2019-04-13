// #import "Foundation/JSObject.js"
/* global JSGlobalObject, JSClass, JSObject, JSDate, JSReadOnlyProperty, JSDynamicProperty */
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

    toString: function(){
        var d = new Date(this.timeIntervalSince1970);
        return "%s: UTC %s".sprintf(this.timeIntervalSince1970, d.toGMTString());
    }
};

Object.defineProperties(JSDate.prototype, {

});

JSDate.initWithTimeIntervalSince1970 = function(timeInterval){
    return Object.create(JSDate.prototype, {timeIntervalSince1970: {value: timeInterval}});
};

JSDate.initWithTimeIntervalSinceNow = function(timeInterval){
    return JSDate.initWithTimeIntervalSince1970((Date.now() / 1000) + timeInterval);
};


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