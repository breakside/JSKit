// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMeta", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.meta,

    initWithData: function(data){
        MKQuickTimeMeta.$super.initWithData.call(this, data);
        this.readAtoms(8);
    },

});

})();