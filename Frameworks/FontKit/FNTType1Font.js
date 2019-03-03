// #import "Foundation/Foundation.js"
/* global JSClass, JSObject */
'use strict';

(function(){

JSClass("FNTType1Font", JSObject, {

    data: null,
    isCompact: false,

    initWithData: function(data){
        this.data = data;
        var dataView = data.dataView();
        this.isCompact = dataView.getUint8(0) == 0x01;
    },

    getCompactFontFormatData: function(completion, target){
        if (this.isCompact){
            completion.call(target, this.data);
            return;
        }
        // TODO: create compact data
        completion.call(target, null);
    },

    getOpenTypeData: function(completion, target){
        this.getCompactFontFormatData(function(ccf){
            // TODO: wrap ccf in OTF data
            completion.call(target, null);
        }, this);
    }

});

})();