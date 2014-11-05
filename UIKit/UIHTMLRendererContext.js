// #import "JSKit/JSKit.js"
/* global JSClass, JSObject, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint */
'use strict';

function HTMLCanvasVariable(name){
    if (this === undefined){
        return new HTMLCanvasVariable(name);
    }else{
        this.name = name;
    }
}

HTMLCanvasVariable.prototype = Object.create(JSCustomProperty.prototype);

HTMLCanvasVariable.prototype.define = function(C, key, extensions){
    var ckey = this.name || key;
    Object.defineProperty(C.prototype, key, {
        configurable: false,
        enumerable: false,
        set: function HTMLCanvasVariable_set(value){
            this.canvasContext[ckey] = value;
        },
        get: function HTMLCanvasVariable_get(){
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

JSClass("UIHTMLRendererContext", JSObject, {

    LINE_CAP_BUTT: 'butt',
    LINE_CAP_ROUND: 'round',
    LINE_CAP_SQUARE: 'square',

    LINE_JOIN_ROUND: 'round',
    LINE_JOIN_BEVEL: 'bevel',
    LINE_JOIN_MITER: 'miter',

    element: null,
    style: null,
    canvas: null,
    canvasContext: JSLazyInitProperty('_createCanvasContext'),
    textNode: null,
    scrollContentSizer: null,
    firstSublayerNodeIndex: 0,
    view: null,

    font:           JSDynamicProperty('_font', null),
    fillColor:      JSDynamicProperty('_fillColor', null),
    shadowColor:    JSDynamicProperty('_shadowColor', null),
    shadowOffset:   JSDynamicProperty(),
    save:           HTMLCanvasMethod(),
    restore:        HTMLCanvasMethod(),
    scale:          HTMLCanvasMethod(),
    rotate:         HTMLCanvasMethod(),
    translate:      HTMLCanvasMethod(),
    transform:      HTMLCanvasMethod(),
    setTransform:   HTMLCanvasMethod(),

    // Needs review for naming consistency
    lineWidth:      HTMLCanvasVariable(),
    lineCap:        HTMLCanvasVariable(),
    lineJoin:       HTMLCanvasVariable(),
    globalAlpha:    HTMLCanvasVariable(),
    globalCompositionOperation: HTMLCanvasVariable(),
    strokeStyle:    HTMLCanvasVariable(),
    shadowBlur:     HTMLCanvasVariable(),
    miterLimit:     HTMLCanvasVariable(),
    lineDashOffset: HTMLCanvasVariable(),
    textAlign:      HTMLCanvasVariable(),
    textBaseline:   HTMLCanvasVariable(),
    // Needs review for path related functionality
    beginPath:      HTMLCanvasMethod(),
    closePath:      HTMLCanvasMethod(),
    moveTo:         HTMLCanvasMethod(),
    lineTo:         HTMLCanvasMethod(),
    quadraticCurveTo:  HTMLCanvasMethod(),
    bezierCurveTo:  HTMLCanvasMethod(),
    arcTo:          HTMLCanvasMethod(),
    rect:           HTMLCanvasMethod(),
    arc:            HTMLCanvasMethod(),
    fill:           HTMLCanvasMethod(),
    stroke:         HTMLCanvasMethod(),
    clip:           HTMLCanvasMethod(),
    isPointInPath:  HTMLCanvasMethod(),
    fillText:       HTMLCanvasMethod(),
    strokeText:     HTMLCanvasMethod(),
    measureText:    HTMLCanvasMethod(),
    drawImage:      HTMLCanvasMethod(),
    getLineDash:    HTMLCanvasMethod(),

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
        this.view = null;
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

    clearRect: function(rect){
        this.canvasContext.clearRect(rect.x, rect.y, rect.width, rect.height);
    },

    fillRect: function(rect){
        this.canvasContext.fillRect(rect.x, rect.y, rect.width, rect.height);
    },

    strokeRect: function(rect){
        this.canvasContext.strokeRect(rect.x, rect.y, rect.width, rect.height);
    },

    setFont: function(font){
        this._font = font;
        this.canvasContext.font = font.cssString();
    },

    getFont: function(){
        return this._font;
    },

    setFillColor: function(color){
        this._fillColor = color;
        this.canvasContext.fillStyle = color.cssString();
    },

    getFillColor: function(color){
        return this._fillColor;
    },

    setShadowColor: function(color){
        this._shadowColor = color;
        this.canvasContext.shadowColor = color.cssString();
    },

    getShadowColor: function(color){
        return this._shadowColor;
    },

    setShadowOffset: function(offset){
        this.canvasContext.shadowOffsetX = offset.x;
        this.canvasContext.shadowOffsetY = offset.y;
    },

    getShadowOffset: function(offset){
        return JSPoint(this.canvasContext.shadowOffsetX, this.canvasContext.shadowOffsetY);
    }

});