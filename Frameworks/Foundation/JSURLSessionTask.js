// #import "JSObject.js"
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