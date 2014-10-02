// #import "JSKit/JSObject.js"

JSClass("UIHTMLRendererContext", JSObject, {

    element: null,
    style: null,
    canvas: null,
    textNode: null,
    scrollContentSizer: null,
    firstSublayerNodeIndex: 0,
    view: null,
    strokeWidth: JSDynamicProperty(),

    initWithElement: function(element){
        this.element = element;
        this.style = element.style;
    },

    destroy: function(){
        this.element = null;
        this.style = null;
        this.canvas = null;
        this.textNode = null;
        this.scrollContentSizer = null;
        this.view = null;
    },

    _getOrCreateCanvas: function(){
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
        return this.canvas;
    }

});

Object.defineProperty(UIHTMLRendererContext.prototype, 'canvasContext', {
    configurable: true,
    enumerable: false,
    get: function(){
        var canvas = this._getOrCreateCanvas();
        var canvasContext = canvas.getContext('2d');
        Object.defineProperty(this, 'canvasContext', {
            configurable: false,
            enumerable: false,
            value: canvasContext
        });
        return canvasContext;
    }
});

UIHTMLRendererContext.defineCanvasContextReadWriteProperty = function(key){
    Object.defineProperty(this.prototype, key, {
        configurable: false,
        enumerable: false,
        get: function UIHTMLRendererContext_getCanvasContextProperty(){
            return this.canvasContext[key];
        },
        set: function UIHTMLRendererContext_setCanvasContextProperty(value){
            this.canvasContext[key] = value;
        }
    });
};

UIHTMLRendererContext.defineCanvasContextReadOnlyProperty = function(key){
    Object.defineProperty(this.prototype, key, {
        configurable: false,
        enumerable: false,
        get: function UIHTMLRendererContext_getCanvasContextProperty(){
            return this.canvasContext[key];
        }
    });
};

// TODO: a lot of these need actual methods to convert arguments and return values
// to/from UIKit types to canvas types
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('save');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('restore');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('scale');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('rotate');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('translate');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('transform');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('setTransform');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('createLinearGradient');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('createRadialGradient');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('clearRect');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('fillRect');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('strokeRect');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('beginPath');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('fill');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('stroke');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('clip');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('isPointInPath');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('fillText');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('strokeText');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('measureText');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('drawImage');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('getLineDash');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('closePath');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('moveTo');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('lineTo');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('quadraticCurveTo');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('bezierCurveTo');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('arcTo');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('rect');
UIHTMLRendererContext.defineCanvasContextReadOnlyProperty('arc');

UIHTMLRendererContext.defineCanvasContextReadWriteProperty('globalAlpha');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('globalCompositionOperation');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('strokeStyle');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('fillStyle');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('shadowOffsetX');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('shadowOffsetY');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('shadowBlur');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('shadowColor');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('lineWidth');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('lineCap');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('lineJoin');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('miterLimit');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('lineDashOffset');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('font');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('textAlign');
UIHTMLRendererContext.defineCanvasContextReadWriteProperty('textBaseline');