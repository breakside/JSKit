// #import "PDFKit/PDFObject.js"
/* global JSGlobalObject, PDFObject, PDFObjectProperty, PDFNameObject, PDFColorSpaceObject */
'use strict';

JSGlobalObject.PDFColorSpaceObject = function(){
    if (this === undefined){
        return new PDFColorSpaceObject();
    }
};

JSGlobalObject.PDFColorSpaceObject.prototype = Object.create(PDFObject.prototype, {
});

JSGlobalObject.PDFColorSpaceObject.Builtin = {
    deviceGray: PDFNameObject("DeviceGray"),
    deviceRGB: PDFNameObject("DeviceRGB"),
    deviceCMYK: PDFNameObject("DeviceCMYK"),
    calGray: PDFNameObject("CalGray"),
    calRGB: PDFNameObject("CalRGB"),
    lab: PDFObject("Lab"),
    iccBased: PDFObject("ICCBased"),
    indexed: PDFNameObject("Indexed"),
    pattern: PDFNameObject("Pattern"),
    separation: PDFNameObject("Separation"),
    deviceN: PDFNameObject("DeviceN")
};