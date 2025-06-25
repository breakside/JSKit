// #import "MKQuickTimeAtom.js"
// #import "MKQuickTimeEditList.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeEdit", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.edts,


    initWithData: function(data){
        MKQuickTimeEdit.$super.initWithData.call(this, data);
        this.registerAtomClass(MKQuickTimeEditList);
        this.readAtoms(8);
    },

    editList: JSReadOnlyProperty(),

    getEditList: function(){
        return this.atomOfType(MKQuickTimeAtom.Type.elst);
    },

});

})();