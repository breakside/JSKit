// #import "Foundation/Foundation.js"
/* global JSClass, JSContext, JSObject, UIHTMLDisplayServerContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash */
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

JSClass("UIHTMLDisplayServerContext", JSContext, {

    element: null,
    borderElement: null,
    style: null,
    canvas: null,
    canvasContext: JSDynamicProperty('_canvasContext', null),
    firstSublayerNodeIndex: 0,
    propertiesNeedingUpdate: null,
    needsFullDisplay: false,
    _childInsertionIndex: 0,
    _canvasElements: null,
    _canvasElementIndex: 0,
    _imageElements: null,
    _imageElementIndex: 0,
    _hasRenderedOnce: false,

    initWithElementUnmodified: function(element){
        this.element = element;
        this.style = element.style;
        this.propertiesNeedingUpdate = {};
        this._imageElements = [];
        this._canvasElements = [];
    },

    initWithElement: function(element){
        this.initWithElementUnmodified(element);
    },

    destroy: function(){
        this.element = null;
        this.style = null;
    },

    resetForDisplay: function(){
        this._canvasElementIndex = 0;
        this._imageElementIndex = 0;
        this._childInsertionIndex = 0;
        for (var i = 0, l = this._canvasElements.length; i < l; ++i){
            this._canvasElements[i].getContext('2d').clearRect(0, 0, this._canvasElements[i].width, this._canvasElements[i].height);
        }
    },

    cleanupAfterDisplay: function(){
        var i;
        for (i = this._canvasElements.length - 1; i >= this._canvasElementIndex; --i){
            this._canvasElements[i].parentNode.removeChild(this._canvasElements[i]);
            this._canvasElements.splice(i, 1);
            --this.firstSublayerNodeIndex;
        }
        for (i = this._imageElements.length - 1; i >= this._imageElementIndex; --i){
            this._imageElements[i].parentNode.removeChild(this._imageElements[i]);
            this._imageElements.splice(i, 1);
            --this.firstSublayerNodeIndex;
        }
    },

    _insertChildElement: function(element){
        // FIXME: added element should inherit current state transform
        if (this.element.childNodes.length < this._childInsertionIndex){
            this.element.insertBefore(element, this.element.childNodes[this._childInsertionIndex]);
        }else{
            this.element.appendChild(element);
        }
        ++this._childInsertionIndex;
        ++this.firstSublayerNodeIndex;
        this._canvasContext = null;
    },

    _dequeueReusableCanvasElement: function(){
        if (this._canvasElementIndex == this._canvasElements.length){
            var canvasElement = this.element.ownerDocument.createElement('canvas');
            canvasElement.style.position = 'absolute';
            this._canvasElements.push(canvasElement);
        }
        var element = this._canvasElements[this._canvasElementIndex];
        ++this._canvasElementIndex;
        return element;
    },

    getCanvasContext: function(){
        // FIXME: needs to respect state of any prior canvas
        if (!this._canvasContext){
            var canvas = this._dequeueReusableCanvasElement();
            // TODO: size canvas
            this._insertChildElement(canvas);
            this._canvasContext = canvas.getContext('2d');
        }
        return this._canvasContext;
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

    save: function(){
        UIHTMLDisplayServerContext.$super.save.call(this);
        if (this._canvasContext){
            this._canvasContext.save();
        }
    },


    restore: function(){
        UIHTMLDisplayServerContext.$super.restore.call(this);
        if (this.canvasContext){
            this._canvasContext.restore();
        }
    },

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
        this._shadowOffset = JSPoint(offset);
        this.canvasContext.shadowOffsetX = offset.x;
        this.canvasContext.shadowOffsetY = offset.y;
    },

    getLineDash: function(){
        return this._lineDash;
    },

    setLineDash: function(dash){
        this._lineDash = JSContextLineDash(dash);
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
        throw Error("UIHTMLDisplayServerContext.drawPath not implemented");
    },

    eoFillPath: function(){
        throw Error("UIHTMLDisplayServerContext.drawPath not implemented");
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

    _dequeueReusableImageElement: function(){
        if (this._imageElementIndex == this._imageElements.length){
            var imageElement = this.element.ownerDocument.createElement('div');
            imageElement.style.position = 'absolute';
            imageElement.style.borderColor = 'transparent';
            imageElement.style.borderStyle = 'solid';
            imageElement.style.boxSizing = 'border-box';
            imageElement.style.mozBoxSizing = 'border-box';
            this._imageElements.push(imageElement);
        }
        var element = this._imageElements[this._imageElementIndex];
        ++this._imageElementIndex;
        return element;
    },

    drawImage: function(rect, image){
        if (image !== null){
            var url = image.htmlURLString();
            if (url){
                var imageElement = this._dequeueReusableImageElement();
                imageElement.style.top = rect.origin.y + 'px';
                imageElement.style.left = rect.origin.x + 'px';
                imageElement.style.width = rect.size.width + 'px';
                imageElement.style.height = rect.size.height + 'px';
                var cssURL = "url('" + url + "')";
                var box = image.stretchBox;
                if (box === null){
                    imageElement.style.backgroundImage = cssURL;
                    imageElement.style.backgroundSize = '100% 100%';
                    imageElement.style.borderWidth = '';
                    imageElement.style.borderImage = '';
                }else{
                    imageElement.style.backgroundImage = '';
                    imageElement.style.borderWidth = '%dpx %dpx %dpx %dpx'.sprintf(box.top, box.right, box.bottom, box.left);
                    imageElement.style.borderImage = cssURL + " %d %d %d %d fill stretch".sprintf(box.top * image.scale, box.right * image.scale, box.bottom * image.scale, box.left * image.scale);
                }
                this._insertChildElement(imageElement);
            }else{
                // TODO: draw to canvas using putImageData
            }
        }
    },

    drawLinearGradient: function(gradient, p1, p2){
        throw Error("UIHTMLDisplayServerContext.drawPath not implemented");
    },

    drawRadialGradient: function(gradient, p1, r1, p2, r2){
        throw Error("UIHTMLDisplayServerContext.drawPath not implemented");
    },

    drawAttributedString: function(string, rect){
        var container = this.element.ownerDocument.createElement('div');
    },

    // HTML shortcuts

    drawLayerProperties: function(layer){
        var needsBorderElement = this.borderElement === null && layer.presentation.borderWidth > 0;
        if (needsBorderElement){
            this.borderElement = this.element.ownerDocument.createElement('div');
            this.element.appendChild(this.borderElement);
            this.borderElement.style.position = 'absolute';
            this.borderElement.style.top = '0';
            this.borderElement.style.left = '0';
            this.borderElement.style.bottom = '0';
            this.borderElement.style.right = '0';
        }

        if (!this._hasRenderedOnce){
            layer.updateAllHTMLProperties(this);
            this._hasRenderedOnce = true;
        }else{
            var methodName;
            for (var keyPath in this.propertiesNeedingUpdate){
                methodName = 'updateHTMLProperty_' + keyPath;
                if (layer[methodName]){
                    layer[methodName](this);
                }else{
                    throw new Error("UIHTMLDisplayServerContext could not find html display method for keyPath '%s'".sprintf(keyPath));
                }
            }
            this.propertiesNeedingUpdate = {};
        }
    }

});