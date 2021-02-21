// #import Foundation
"use strict";

JSClass("APIResponder", JSObject, {

    initWithRequest: function(request, response, secrets){
        this.request = request;
        this.response = response;
        this.secrets = secrets;
    },

    prepare: async function(){
    },

    methodForRequestMethod: function(method){
        return this[method.toLowerCase()];
    }

});