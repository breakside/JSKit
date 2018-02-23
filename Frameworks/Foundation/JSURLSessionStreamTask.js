// #import "Foundation/JSURLSessionTask.js"
// #import "Foundation/JSURLRequest.js"
/* global JSClass, JSURLSessionTask, JSReadOnlyProperty */
'use strict';

JSClass("JSURLSessionStreamTask", JSURLSessionTask, {

    originalURL: JSReadOnlyProperty('_originalURL', null),
    currentURL: JSReadOnlyProperty('_currentURL', null),
    requestedProtocols: null,
    protocol: null,
    streamDelegate: null,

    initWithURL: function(url, requestedProtocols){
        this._originalURL = url;
        this._currentURL = url;
        this.requestedProtocols = requestedProtocols;
    },

    resume: function(){
    },

    cancel: function(){
    },

    sendMessage: function(data){

    }

});