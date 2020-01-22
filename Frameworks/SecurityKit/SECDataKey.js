// #import "SECKey.js"
'use strict';

JSClass("SECDataKey", SECKey, {

    keyData: null,

    initWithData: function(data){
        this.keyData = data;
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        JSRunLoop.main.schedule(completion, target, this.keyData);
        return completion.promise;
    }

});