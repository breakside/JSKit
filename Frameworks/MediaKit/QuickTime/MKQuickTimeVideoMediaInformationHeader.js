// #import "MKQuickTimeAtom.js"
"use strict";

(function(){

var logger = JSLog("medikit", "quicktime");

JSClass("MKQuickTimeVideoMediaInformationHeader", MKQuickTimeAtom, {

    type: MKQuickTimeAtom.Type.vmhd,
    version: JSReadOnlyProperty(),
    flags: JSReadOnlyProperty(),

    getVersion: function(){
        return this.data[8];
    },

    getFlags: function(){
        return this.dataView.getUint32(8) & 0x00FFFFFF;
    },

    initWithData: function(data){
        MKQuickTimeVideoMediaInformationHeader.$super.initWithData.call(this, data);
        if (data.length < 20){
            throw new Error("expecting at least 20 bytes for vmhd atom");
        }
    },

    graphicsMode: JSReadOnlyProperty(),

    getGraphicsMode: function(){
        return this.dataView.getUint16(12);
    },

    opColors: JSReadOnlyProperty(),

    getOpColors: function(){
        return [
            this.dataView.getUint16(14),
            this.dataView.getUint16(16),
            this.dataView.getUint16(18)
        ];
    }

});

MKQuickTimeVideoMediaInformationHeader.GraphicsMode = {
    copy: 0,
    ditherCopy: 0x40,
    blend: 0x20,
    transparent: 0x24,
    straightAlpha: 0x100,
    premultipliedWhiteAlpha: 0x101,
    premultipliedBlackAlpha: 0x102,
    straightAlphaBlend: 0x104,
    composition: 0x103
};

})();