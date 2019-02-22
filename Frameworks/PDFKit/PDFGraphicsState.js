// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/PDFStreamOperation.js"
/* global JSGlobalObject, PDFGraphicsState, JSAffineTransform, PDFNameObject, PDFStreamOperation */
'use strict';

(function(){

JSGlobalObject.PDFGraphicsState = {};


PDFGraphicsState.LineCap = {
    butt: 0,
    round: 1,
    square: 2
};

PDFGraphicsState.LineJoin = {
    miter: 0,
    round: 1,
    bevel: 2
};

PDFGraphicsState.TextRenderingMode = {
    fill: 0,
    stroke: 1,
    fillStroke: 2,
    invisible: 3,
    fillAddPath: 4,
    strokeAddPath: 5,
    fillStrokeAddPath: 6,
    addPath: 7
};

PDFGraphicsState.Properties = {
    transform: JSAffineTransform.Identity,
    clippingPath: null,
    colorSpace: PDFNameObject("DeviceGray"),
    color: 0,
    lineWidth: 1.0,
    lineCap: PDFGraphicsState.LineCap.butt,
    lineJoin: PDFGraphicsState.LineJoin.miter,
    miterLimit: 10.0,
    dashArray: [],
    dashPhase: 0,
    renderingIntent: PDFNameObject("RelativeColorimetric"),
    strokeAdjustment: false,
    blendMode: PDFNameObject("Normal"),
    softMask: null,
    alphaStroke: 1.0,
    alphaNonStroke: 1.0,
    alphaSource: false,
    flatness: 1.0,

    // Text
    textTransform: null,
    textLineTransform: null,
    characterSpacing: 0,
    wordSpacing: 0,
    textHorizontalScaling: 100,
    textLeading: 0,
    font: null,
    fontSize: 0,
    textRenderingMode: 0,
    textRise: 0,
    textKnockout: 0
};

PDFGraphicsState.stack = function(){
    return new PDFGraphicsStateStack();
};

var PDFGraphicsStateStack = function(){
    this.state = Object.create(PDFGraphicsState.Properties);
    this.stack = [];
};

PDFGraphicsStateStack.prototype = {

    state: null,
    stack: null,

    handleOperation: function(operation, resources){
        var Op = PDFStreamOperation.Operator;
        var params;
        var transform;
        switch (operation.operator){
            case Op.pushState:
                this.push();
                break;
            case Op.popState:
                this.pop();
                break;
            case Op.updateState:
                params = resources.graphicsState(operation.operands[0]);
                this.update(params);
                break;
            case Op.concatenateCTM:
                transform = JSAffineTransform.apply(undefined, operation.operands);
                // TODO: verify this operation is the correct one to use
                this.state.transform = this.state.transform.concatenatedWith(transform);
                break;
            case Op.lineWidth:
                this.state.lineWidth = operation.operands[0];
                break;
            case Op.lineCap:
                this.state.lineCap = operation.operands[0];
                break;
            case Op.lineJoin:
                this.state.lineJoin = operation.operands[0];
                break;
            case Op.miterLimit:
                this.state.miterLimit = operation.operands[0];
                break;
            case Op.dashPattern:
                this.state.dashArray = operation.operands[0];
                this.state.dashPhase = operation.operands[1];
                break;
            case Op.renderingIntent:
                this.state.renderingIntent = operation.operands[0];
                break;
            case Op.flatness:
                this.state.flatness = operation.operands[0];
                break;
            case Op.beginText:
                this.state.textTransform = JSAffineTransform.Identity;
                this.state.textLineTransform = JSAffineTransform.Identity;
                break;
            case Op.endText:
                this.state.textTransform = null;
                this.state.textLineTransform = null;
                break;
            case Op.textMatrix:
                this.textTransform = JSAffineTransform.apply(undefined, operation.operands);
                this.textLineTransform = JSAffineTransform.apply(undefined, operation.operands);
                break;
            case Op.xTextAdvance:
                this.textTransform = this.textTransform.translatedBy(operation.operands[0] / 1000.0 * this.state.fontSize * this.state.textHorizontalScaling / 100.0, operation.operands[1] / 1000.0 * this.state.fontSize);
                break;
            case Op.characterSpacing:
                this.state.characterSpacing = operation.operands[0];
                break;
            case Op.wordSpacing:
                this.state.wordSpacing = operation.operands[0];
                break;
            case Op.textHorizontalScaling:
                this.state.textHorizontalScaling = operation.operands[0];
                break;
            case Op.textLeading:
                this.state.textLeading = operation.operands[0];
                break;
            case Op.textRise:
                this.state.textRise = operation.operands[0];
                break;
            case Op.textRenderingMode:
                this.state.textRenderingMode = operation.operands[0];
                break;
            case Op.font:
                this.state.font = resources.font(operation.operands[0]);
                this.state.fontSize = operation.operands[1];
                break;
            case Op.nextLineManual:
                this.textLineTransform = this.textLineTransform.translatedBy(operation.operands[0], operation.operands[1]);
                this.textTransform = JSAffineTransform(this.textLineTransform);
                break;
            case Op.nextLineLeading:
                this.textLineTransform = this.textLineTransform.translatedBy(operation.operands[0], operation.operands[1]);
                this.textTransform = JSAffineTransform(this.textLineTransform);
                this.textLeading = -operation.operands[1];
                break;
            case Op.nextLine:
                this.textLineTransform = this.textLineTransform.translatedBy(0, -this.state.textLeading);
                this.textTransform = JSAffineTransform(this.textLineTransform);
                break;
            case Op.text:
                // TODO: advance text matrix
                break;
        }
    },

    update: function(params){
        if ('LW' in params){
            this.state.lineWidth = params.LW;
        }
        if ('LC' in params){
            this.state.lineCap = params.LC;
        }
        if ('LJ' in params){
            this.state.lineJoin = params.LJ;
        }
        if ('ML' in params){
            this.state.miterLimit = params.ML;
        }
        if ('D' in params){
            this.state.dashArray = params.D[0];
            this.state.dashPhase = params.D[1];
        }
        if ('RI' in params){
            this.state.renderingIntent = params.RI;
        }
        if ('Font' in params){
            this.state.font = params[0];
            this.state.fontSize = params[1];
        }
        if ('FL' in params){
            this.state.flatness = params.FL;
        }
        if ('SA' in params){
            this.state.strokeAdjustment = params.SA;
        }
        if ('BM' in params){
            this.state.blendMode = params.BM;
        }
        if ('CA' in params){
            this.state.alphaStroke = params.CA;
        }
        if ('ca' in params){
            this.state.alphaNonStroke = params.ca;
        }
        if ('AIS' in params){
            this.state.alphaSource = params.AIS;
        }
    },

    push: function(){
        this.stack.push(this.state);
        this.state = Object.create(this.state);
    },

    pop: function(){
        if (this.stack.length > 0){
            this.state = this.stack.pop();
        }
    },

};

})();