// #import "Foundation/Foundation.js"
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
    strokePath: "S",
    closeStrokePath: "s",

    // Path Painting
    fillPath: "f",
    fillPathCompatibility: "F",
    fillPathEvenOdd: "f*",
    fillStrokePath: "B",
    fillStrokePathEvenOdd: "B*",
    closeFillStrokePath: "b",
    closeFillStrokePathEvenOdd: "b*",
    endPath: "n",
    clip: "W",
    clipEvenOdd: "W*",
    colorSpaceStroke: "CS",
    colorSpaceNonStroke: "cs",
    colorSpaceStrokeFIXME: "SC",
    colorSpaceStrokeFIXME2: "SCN",
    colorSpaceNonStrokeFIXME: "sc",
    colorSpaceNonStrokeFIXME2: "scn",
    colorSpaceStrokeGray: "G",
    colorSpaceNonStrokeGray: "g",
    colorSpaceStrokeRGB: "RG",
    colorSpaceNonStrokeRGB: "rg",
    colorSpaceStrokeCMYK: "K",
    colorSpaceNonStrokeCMYK: "k",
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
    defineMarkedContentPoint: "MP"

};

})();