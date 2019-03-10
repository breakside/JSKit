// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/PDFColorSpace.js"
// #import "PDFKit/PDFStreamOperation.js"
/* global JSGlobalObject, JSPoint, JSColor, PDFColorSpace, PDFGraphicsState, JSAffineTransform, PDFName, PDFStreamOperation */
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
    firstPoint: null,
    lastPoint: null,
    lineWidth: 1.0,
    strokeColorSpace: PDFColorSpace.deviceGray,
    strokeColorComponents: [0],
    fillColorSpace: PDFColorSpace.deviceGray,
    fillColorComponents: [0],
    lineCap: PDFGraphicsState.LineCap.butt,
    lineJoin: PDFGraphicsState.LineJoin.miter,
    miterLimit: 10.0,
    dashArray: [],
    dashPhase: 0,
    renderingIntent: PDFName("RelativeColorimetric"),
    strokeAdjustment: false,
    blendMode: PDFName("Normal"),
    softMask: null,
    strokeAlpha: 1.0,
    fillAlpha: 1.0,
    alphaSource: false,
    flatness: 1.0,

    // Text
    textTransform: null,
    textLineTransform: null,
    characterSpacing: 0,
    wordSpacing: 0,
    textHorizontalScaling: 1,
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
    resources: null,

    handleOperation: function(operation){
        var handler = operationHandler[operation.operator];
        if (handler){
            handler.apply(this, operation.operands);
        }
    },

    _rememberPoint: function(x, y){
        if (this.state.firstPoint === null){
            this.state.firstPoint = JSPoint(x, y);
        }
        this.state.lastPoint = JSPoint(x, y);
    },

    _clearPoints: function(){
        this.state.firstPoint = null;
        this.state.lastPoint = null;
    }

};

var operationHandler = {

    // push
    q: function(){
        this.stack.push(this.state);
        this.state = Object.create(this.state);
    },

    // pop
    Q: function(){
        if (this.stack.length > 0){
            this.state = this.stack.pop();
        }
    },

    // update state
    gs: function(name){
        if (!this.resources){
            return;
        }
        var params = this.resources.graphicsState(name);
        if (!params){
            return;
        }
        var updater;
        for (var key in params){
            updater = stateUpdater[key];
            if (updater){
                updater.call(this.state, params[key]);
            }
        }
    },

    // concatenate matrix
    cm: function(a, b, c, d, e, f){
        var transform = JSAffineTransform(a, b, c, d, e, f);
        // TODO: verify this operation is the correct one to use
        this.state.transform = this.state.transform.concatenatedWith(transform);
    },

    w: function(lineWidth){
        this.state.lineWidth = lineWidth;
    },

    J: function(lineCap){
        this.state.lineCap = lineCap;
    },

    j: function(lineJoin){
        this.state.lineJoin = lineJoin;
    },

    M: function(miterLimit){
        this.state.miterLimit = miterLimit;
    },

    d: function(array, phase){
        this.state.dashArray = array;
        this.state.dashPhase = phase;
    },

    ri: function(renderingIntent){
        this.state.renderingIntent = renderingIntent;
    },

    i: function(flatness){
        this.state.flatness = flatness;
    },

    m: function(x, y){
        this._clearPoints();
        this._rememberPoint(x, y);
    },

    l: function(x, y){
        this._rememberPoint(x, y);
    },

    c: function(c1x, c1y, c2x, c2y, x, y){
        this._rememberPoint(x, y);
    },

    v: function(c2x, c2y, x, y){
        this._rememberPoint(x, y);
    },

    y: function(c1x, c1y, x, y){
        this._rememberPoint(x, y);
    },

    h: function(){
        if (this.state.firstPoint){
            this._rememberPoint(this.state.firstPoint.x, this.state.firstPoint.y);
        }
    },

    re: function(x, y, w, h){
        this._rememberPoint(x, y);
    },

    n: function(){
        this._clearPoints();
    },

    W: function(){
        this._clearPoints();
    },

    'W*': function(){
        this._clearPoints();
    },

    S: function(){
        this._clearPoints();
    },

    s: function(){
        this._clearPoints();
    },

    f: function(){
        this._clearPoints();
    },

    'f*': function(){
        this._clearPoints();
    },

    B: function(){
        this._clearPoints();
    },

    'B*': function(){
        this._clearPoints();
    },

    b: function(){
        this._clearPoints();
    },

    'b*': function(){
        this._clearPoints();
    },

    CS: function(name){
        this.state.strokeColorSpace = this.resources.colorSpace(name) || PDFColorSpace(name);
        this.state.strokeColorComponents = this.state.strokeColorSpace.defaultComponents();
    },

    cs: function(name){
        this.state.fillColorSpace = this.resources.colorSpace(name) || PDFColorSpace(name);
        this.state.fillColorComponents = this.state.fillColorSpace.defaultComponents();
    },

    SC: function(){
        var components = Array.prototype.slice.call(arguments, 0);
        this.state.strokeColorComponents = components;
    },

    sc: function(){
        var components = Array.prototype.slice.call(arguments, 0);
        this.state.fillColorComponents = components;
    },

    SCN: function(){
        var components = Array.prototype.slice.call(arguments, 0);
        this.state.strokeColorComponents = components;
    },

    scn: function(){
        var components = Array.prototype.slice.call(arguments, 0);
        this.state.fillColorComponents = components;
    },

    G: function(w){
        this.state.strokeColorSpace = PDFName("DeviceGray");
        this.state.strokeColorComponents = [w];
    },

    g: function(w){
        this.state.fillColorSpace = PDFName("DeviceGray");
        this.state.fillColorComponents = [w];
    },

    RG: function(r, g, b){
        this.state.strokeColorSpace = PDFName("DeviceRGB");
        this.state.strokeColorComponents = [r, g, b];
    },

    rg: function(r, g, b){
        this.state.fillColorSpace = PDFName("DeviceRGB");
        this.state.fillColorComponents = [r, g, b];
    },

    K: function(c, m, y, k){
        this.state.fillColorSpace = PDFName("DeviceCMYK");
        this.state.fillColorComponents = [c, m, y, k];
    },

    k: function(c, m, y, k){
        this.state.fillColorSpace = PDFName("DeviceCMYK");
        this.state.fillColorComponents = [c, m, y, k];
    },

    // begin text
    BT: function(){
        this.state.textTransform = JSAffineTransform.Identity;
        this.state.textLineTransform = JSAffineTransform.Identity;
    },

    // end text
    ET: function(){
        this.state.textTransform = null;
        this.state.textLineTransform = null;
    },

    Tm: function(a, b, c, d, e, f){
        this.state.textTransform = JSAffineTransform(a, b, c, d, e, f);
        this.state.textLineTransform = JSAffineTransform(a, b, c, d, e, f);
    },

    __PDFKit_xTextAdvance__: function(x, y){
        this.state.textTransform = this.state.textTransform.translatedBy(-x / 1000.0 * this.state.fontSize * this.state.textHorizontalScaling, y / 1000.0 * this.state.fontSize);
    },

    Tc: function(spacing){
        this.state.characterSpacing = spacing;
    },

    Tw: function(spacing){
        this.state.wordSpacing = spacing;
    },

    Tz: function(scaling){
        this.state.textHorizontalScaling = scaling / 100;
    },

    TL: function(leading){
        this.state.textLeading = leading;
    },

    Ts: function(rise){
        this.state.textRise = rise;
    },

    Tr: function(renderingMode){
        this.state.textRenderingMode = renderingMode;
    },

    // Font
    Tf: function(name, size){
        this.state.font = this.resources.font(name);
        this.state.fontSize = size;
    },

    // next line using custom offset
    Td: function(x, y){
        this.state.textLineTransform = this.state.textLineTransform.translatedBy(x, y);
        this.state.textTransform = JSAffineTransform(this.state.textLineTransform);
    },

    // next line using custom offset and set leading
    TD: function(x, y){
        this.state.textLineTransform = this.state.textLineTransform.translatedBy(x, y);
        this.state.textTransform = JSAffineTransform(this.state.textLineTransform);
        this.state.textLeading = -y;
    },

    // next line using leading
    'T*': function(){
        this.state.textLineTransform = this.state.textLineTransform.translatedBy(0, -this.state.textLeading);
        this.state.textTransform = JSAffineTransform(this.state.textLineTransform);
    },

    // show string
    Tj: function(binaryString){
        // advance text matrix
        var width = this.state.font.widthOfData(binaryString, this.state.characterSpacing, this.state.wordSpacing) * this.state.fontSize * this.state.textHorizontalScaling;
        this.state.textTransform = this.state.textTransform.translatedBy(width, 0);
    },


};

var stateUpdater = {
    LW: function(value){
        this.lineWidth = value;
    },
    LC: function(value){
        this.lineCap = value;
    },
    LJ: function(value){
        this.lineJoin = value;
    },
    ML: function(value){
        this.miterLimit = value;
    },
    D: function(value){
        this.dashArray = value[0];
        this.dashPhase = value[1];
    },
    RI: function(value){
        this.renderingIntent = value;
    },
    Font: function(value){
        this.font = value[0];
        this.fontSize = value[1];
    },
    FL: function(value){
        this.flatness = value;
    },
    SA: function(value){
        this.strokeAdjustment = value;
    },
    BM: function(value){
        this.blendMode = value;
    },
    CA: function(value){
        this.strokeAlpha = value;
    },
    ca: function(value){
        this.fillAlpha = value;
    },
    AIS: function(value){
        this.alphaSource = value;
    }
};

})();