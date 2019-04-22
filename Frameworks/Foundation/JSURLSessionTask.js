// #import "JSObject.js"
/* global JSClass, JSObject, JSReadOnlyProperty */
'use strict';

JSClass("JSURLSessionTask", JSObject, {

    session: null,
    progressDelegate: null,
    error: JSReadOnlyProperty('_error', null),

    resume: function(){
    },

    cancel: function(){
    }

});