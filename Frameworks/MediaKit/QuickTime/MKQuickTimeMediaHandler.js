// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeMediaHandler", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.hdlr,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),
    componentType: JSReadOnlyProperty(),
    componentSubtype: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    getComponentType: function(){
        return this.dataView.getUint32(12);
    },

    getComponentSubtype: function(){
        return this.dataView.getUint32(16);
    },

    initWithData: function(data){
        MKQuickTimeMediaHandler.$super.initWithData.call(this, data);
        if (data.length < 20){
            throw new Error("expecting at least 20 bytes for hdlr atom");
        }
        if (this.version > 0){
            throw new Error("Unsupported hdlr version: %d".sprintf(this.version));
        }
    },

    dictionaryRepresentation: function(){
        return {
            type: MKQuickTimeAtom.stringForType(this.type),
            version: this.version,
            componentType: MKQuickTimeAtom.stringForType(this.componentType),
            componentSubtype: MKQuickTimeAtom.stringForType(this.componentSubtype)
        };
    },

});

MKQuickTimeMediaHandler.ComponentType = {

    unspecified: 0x00000000,
    mhlr: 0x6d686c72,
    dhlr: 0x64686c72

};


MKQuickTimeMediaHandler.ComponentSubtype = {

    vide: 0x76696465,
    soun: 0x736f756e,
    subt: 0x73756274,
    alis: 0x616c6973

};

})();