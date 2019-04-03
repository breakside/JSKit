// #import Foundation
/* global JSGlobalObject, PDFStreamOperation */
'use strict';

(function(){

JSGlobalObject.PDFStreamOperation = function(operator, operands){
    if (this === undefined){
        return new PDFStreamOperation(operator, operands);
    }
    this.operator = operator;
    this.operands = operands;
};

PDFStreamOperation.Operator = {

    // Content Stream Operators
    beginCompatibility: "BX",
    endCompatibility: "EX",

    // Graphics State
    pushState: "q",
    popState: "Q",
    concatenateCTM: "cm",
    lineWidth: "w",
    lineCap: "J",
    lineJoin: "j",
    miterLimit: "M",
    dashPattern: "d",
    renderingIntent: "ri",
    flatness: "i",
    updateState: "gs",

    // Path Construction
    moveTo: "m",
    lineTo: "l",
    curveTo: "c",
    curveToUsingCurrent: "v",
    curveToUsingEnding: "y",
    closeSubpath: "h",
    rectangle: "re",
    endPath: "n",
    clip: "W",
    clipEvenOdd: "W*",

    // Path Painting
    strokePath: "S",
    closeStrokePath: "s",
    fillPath: "f",
    fillPathAlias: "F",
    fillPathEvenOdd: "f*",
    fillStrokePath: "B",
    fillStrokePathEvenOdd: "B*",
    closeFillStrokePath: "b",
    closeFillStrokePathEvenOdd: "b*",

    // Colors
    strokeColorSpace: "CS",
    fillColorSpace: "cs",
    strokeColor: "SC",
    fillColor: "sc",
    strokeColorNamed: "SCN",
    fillColorNamed: "scn",
    strokeColorGray: "G",
    fillColorGray: "g",
    strokeColorRGB: "RG",
    fillColorRGB: "rg",
    strokeColorCMYK: "K",
    fillColorCMYK: "k",
    shading: "sh",

    // Images and other objects
    xobject: "Do",
    beginImage: "BI",
    beginImageData: "ID",
    endImage: "EI",

    // Text
    characterSpacing: "Tc",
    wordSpacing: "Tw",
    textHorizontalScaling: "Tz",
    textLeading: "TL",
    font: "Tf",
    textRenderingMode: "Tr",
    textRise: "Ts",
    beginText: "BT",
    endText: "ET",
    textMatrix: "Tm",
    nextLineManual: "Td",
    nextLineLeading: "TD",
    nextLine: "T*",
    nextLineText: "'",
    nextLineTextSpacing: '"',
    text: "Tj",
    textArray: "TJ",
    xTextAdvance: "__PDFKit_xTextAdvance__",

    // Fonts & Character Sets
    fontGlyphWidthColor: "d0",
    fontGlyphWidth: "d1",
    beginCodeSpaceRange: "begincodespacerange",
    endCodeSpaceRange: "endcodespacerange",
    beginbfchar: "beginbfchar",
    endbfchar: "endbfchar",
    beginbfrange: "beginbfrange",
    endbfrange: "endbfrange",

    // Marked Content
    beginMarkedContentProperties: "BDC",
    beginMarkedContent: "BMC",
    endMarkedContent: "EMC",
    defineMarkedContentPointProperties: "DP",
    defineMarkedContentPoint: "MP",

    // Functions
    beginFunction: "{",
    endFunction: "}"

};

})();