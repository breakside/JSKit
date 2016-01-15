// #import "JSKit/JSKit+HTML.js"
/* global JSClass, JSContext, JSObject, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint */
'use strict';

function HTMLCanvasProperty(name){
    if (this === undefined){
        return new HTMLCanvasProperty(name);
    }else{
        this.name = name;
    }
}

HTMLCanvasProperty.prototype = Object.create(JSCustomProperty.prototype);

HTMLCanvasProperty.prototype.define = function(C, key, extensions){
    var ckey = this.name || key;
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function HTMLCanvasProperty_set(value){
            this.canvasContext[ckey] = value;
        },
        get: function HTMLCanvasProperty_get(){
            return this.canvasContext[ckey];
        }
    });
};

function HTMLCanvasMethod(name){
    if (this === undefined){
        return new HTMLCanvasMethod(name);
    }else{
        this.name = name;
    }
}

HTMLCanvasMethod.prototype = Object.create(JSCustomProperty.prototype);

HTMLCanvasMethod.prototype.define = function(C, key, extensions){
    var ckey = this.name || key;
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        get: function HTMLCanvasMethod_get(){
            return this.canvasContext[ckey];
        }
    });
};

JSClass("UIHTMLRendererContext", JSContext, {

    element: null,
    style: null,
    canvas: null,
    canvasContext: JSLazyInitProperty('_createCanvasContext'),
    textNode: null,
    scrollContentSizer: null,
    firstSublayerNodeIndex: 0,

    init: function(){
    },

    initWithElement: function(element){
        this.element = element;
        this.element._UIHTMLRendererContext = this;
        this.style = element.style;
    },

    destroy: function(){
        this.element._UIHTMLRendererContext = null;
        this.element = null;
        this.style = null;
        this.canvas = null;
        this.textNode = null;
        this.scrollContentSizer = null;
    },

    _createCanvasContext: function(){
        if (!this.canvas){
            this.canvas = this.element.ownerDocument.createElement('canvas');
            // TODO: set width & height
            if (this.element.childNodes.length){
                this.element.insertBefore(this.canvas, this.element.childNodes[0]);
            }else{
                this.element.appendChild(this.canvas);
            }
            ++this.firstSublayerNodeIndex;
        }
        return this.canvas.getContext('2d');
    },

    // State

    alpha:          HTMLCanvasProperty('globalAlpha'),
    fillColor:      JSDynamicProperty('_fillColor'),
    strokeColor:    JSDynamicProperty('_strokeColor'),
    lineWidth:      HTMLCanvasProperty(),
    lineCap:        HTMLCanvasProperty(),
    lineJoin:       HTMLCanvasProperty(),
    lineDash:       JSDynamicProperty('_lineDash'),
    miterLimit:     HTMLCanvasProperty(),
    shadowColor:    JSDynamicProperty('_shadowColor'),
    shadowOffset:   JSDynamicProperty('_shadowOffset'),
    shadowBlur:     HTMLCanvasProperty(),

    save: HTMLCanvasMethod(),
    restore: HTMLCanvasMethod(),

    getFillColor: function(){
        return this._fillColor;
    },

    setFillColor: function(color){
        this._fillColor = color;
        this.canvasContext.fillStyle = color ? color.cssString() : '';
    },

    getStrokeColor: function(){
        return this._strokeColor;
    },

    setStrokeColor: function(color){
        this._strokeColor = color;
        this.canvasContext.strokeStyle = color ? color.cssString() : '';
    },

    getShadowColor: function(){
        return this._shadowColor;
    },

    setShadowColor: function(color){
        this._shadowColor = color;
        this.canvasContext.shadowColor = color ? color.cssString() : '';
    },

    getShadowOffset: function(){
        return this._shadowOffset;
    },

    setShadowOffset: function(offset){
        this._shadowOffset = offset;
        this.canvasContext.shadowOffsetX = offset.x;
        this.canvasContext.shadowOffsetY = offset.y;
    },

    getLineDash: function(){
        return this._lineDash;
    },

    setLineDash: function(dash){
        this._lineDash = dash;
        this.canvasContext.lineDashOffset = dash.phase;
        this.canvasContext.setLineDash(dash.segments);
    },

    // Paths

    beginPath: HTMLCanvasMethod(),
    closePath: HTMLCanvasMethod(),

    addArc: function(x, y, radius, startAngle, endAngle, clockwise){
        this.canvasContext.arc(x, y, radius, startAngle, endAngle, !clockwise);
    },

    addArcToPoint: HTMLCanvasMethod('arcTo'),
    addCurveToPoint: HTMLCanvasMethod('bezierCurveTo'),
    addLineToPoint: HTMLCanvasMethod('lineTo'),
    addQuadraticCurveToPoint: HTMLCanvasMethod('quadraticCurveTo'),

    addRect: function(rect){
        this.canvasContext.rect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    moveToPoint: HTMLCanvasMethod('moveTo'),

    // Painting

    clearRect: function(rect){
        this.canvasContext.clearRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    fillRect: function(rect){
        this.canvasContext.fillRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    strokeRect: function(rect){
        this.canvasContext.strokeRect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    drawPath: function(drawingMode){
        throw Error("UIHTMLRendererContext.drawPath not implemented");
    },

    eoFillPath: function(){
        throw Error("UIHTMLRendererContext.drawPath not implemented");
    },

    fillPath: HTMLCanvasMethod('fill'),
    strokePath: HTMLCanvasMethod('stroke'),

    // Transforms

    scaleCTM: HTMLCanvasMethod('scale'),
    rotateCTM: HTMLCanvasMethod('rotate'),
    translateCTM: HTMLCanvasMethod('translate'),

    concatCTM: function(transform){
        this.canvasContext.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
    },

    // Images

    drawImage: function(rect, image){
        throw Error("UIHTMLRendererContext.drawPath not implemented");
    },

    drawLinearGradient: function(gradient, p1, p2){
        throw Error("UIHTMLRendererContext.drawPath not implemented");
    },

    drawRadialGradient: function(gradient, p1, r1, p2, r2){
        throw Error("UIHTMLRendererContext.drawPath not implemented");
    }

});