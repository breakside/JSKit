// #import "Foundation/JSURLSessionTask.js"
// #import "Foundation/JSURLRequest.js"
/* global JSClass, JSURLSessionTask, JSReadOnlyProperty */
'use strict';

JSClass("JSURLSessionDataTask", JSURLSessionTask, {

    originalRequest: JSReadOnlyProperty('_originalRequest', null),
    currentRequest: JSReadOnlyProperty('_currentRequest', null),
    response: JSReadOnlyProperty(),

    initWithRequest: function(request){
        this._originalRequest = request;
        this._currentRequest = request;
    },

    resume: function(){
    },

    cancel: function(){
    },

    getResponse: function(){
        if (this._currentRequest !== null){
            return this._currentRequest.response;
        }
        return null;
    }

});