// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
'use strict';

(function(){

JSClass("FNTType1Font", JSObject, {

    data: null,

    initWithData: function(data){
        this.data = data;
    },

    getCompactFont: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        // TODO: create compact data
        completion.call(target, null);
        return completion.promise;
    },

    getOpenTypeData: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.getCompactFont(function(ccf){
            ccf.getOpenTypeData({}, completion, target);
        }, this);
        return completion.promise;
    }

});

})();