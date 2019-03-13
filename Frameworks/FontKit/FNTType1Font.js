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
        // TODO: create compact data
        completion.call(target, null);
    },

    getOpenTypeData: function(completion, target){
        this.getCompactFont(function(ccf){
            ccf.getOpenTypeData(completion, target);
        }, this);
    }

});

})();