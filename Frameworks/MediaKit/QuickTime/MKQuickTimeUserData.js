// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeUserData", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.udta,

    initWithData: function(data){
        MKQuickTimeUserData.$super.initWithData.call(this, data);
        this.readAtoms(8);
    },

});

})();