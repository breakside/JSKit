// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeFileType", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.ftyp,

    majorBrand: JSReadOnlyProperty(),
    minorVersion: JSReadOnlyProperty(),

    getMajorBrand: function(){
        return this.dataView.getUint32(8);
    },

    getMinorVersion: function(){
        return this.dataView.getUint32(12);
    },

    initWithData: function(data){
        MKQuickTimeFileType.$super.initWithData.call(this, data);
        if (data.length < 16){
            throw new Error("expecting at least 16 bytes for ftyp atom");
        }
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
            majorBrand: MKQuickTimeAtom.stringForType(this.majorBrand),
        };
    },

});

MKQuickTimeFileType.MajorBrand = {
    qt: 0x71742020,
    mp42: 0x6d703432,
    m4v: 0x4d345620
};

})();