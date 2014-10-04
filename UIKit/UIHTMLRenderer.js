// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIHTMLRendererContext.js"

JSClass("UIHTMLRenderer", UIRenderer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayer: null,
    rootContext: null,
    environmentSize: null,
    domEventMethodMap: {
        'mousedown'     : 'mouseDown',
        'mouseup'       : 'mouseUp',
        'mousemove'     : 'mouseMoved',
        'mouseover'     : 'mouseEntered',
        'mouseout'      : 'mouseExited'
    },
    contextsByLayerID: null,

    initWithRootElement: function(rootElement){
        UIHTMLRenderer.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayer = null;
        this.contextsByLayerID = {};
        this.setupRenderingEnvironment();
    },

    setupRenderingEnvironment: function(){
        this.rootContext = UIHTMLRendererContext.initWithElement(this.rootElement);
        this.rootElement.style = 'relative';
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            body.style.padding = '0';
            html.style.padding = '0';
            body.style.margin = '0';
            html.style.margin = '0';
            body.style.height = '100%';
            html.style.height = '100%';
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative'){
                this.rootElement.style.position = 'relative';
            }
        }
        this.determineEnvironmentSize();
        this.domWindow.addEventListener('resize', this, false);
    },

    determineEnvironmentSize: function(){
        this.environmentSize = JSSize(this.rootElement.offsetWidth, this.rootElement.offsetHeight);
    },

    viewInserted: function(view){
        var context = this.contextsByLayerID[view.layer.objectID];
        if (context){
            if (context.element.dataset){
                context.element.dataset.uiViewClass = view.$class.className;
            }
            context.view = view;
            for (var eventType in this.domEventMethodMap){
                if (this.domEventMethodMap[eventType] in view){
                    context.element.addEventListener(eventType, this, false);
                }
            }
            for (var i = 0, l = view.subviews.length; i < l; ++i){
                this.viewInserted(view.subviews[i]);
            }
        }
    },

    viewRemoved: function(view){
    },

    layerInserted: function(layer){
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByLayerID[layer.superlayer.objectID];
        }else{
            parentContext = this.rootContext;
            this.rootLayer = layer;
            layer._updateFrameAfterSuperSizeChange(this.environmentSize);
        }
        if (parentContext){
            var context = this.contextForLayer(layer);
            var insertIndex = parentContext.firstSublayerNodeIndex + layer.level;
            if (insertIndex < parentContext.element.childNodes.length){
                parentContext.element.insertBefore(context.element, parentContext.element.childNodes[insertIndex]);
            }else{
                parentContext.element.appendChild(context.element);
            }
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }
    },

    layerRemoved: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context){
            if (context.element.parentNode){
                context.element.parentNode.removeChild(element);
            }
            context.destroy();
            delete this.contextsByLayerID[layer.objectID];
        }
    },

    setLayerNeedsRenderForKeyPath: function(layer, keyPath){
        if (keyPath === 'superlayer.frame.size'){
            // superlayer.frame.size is a special keyPath used when the superlayer of a
            // layer with a constraint box changes its frame size, affecting the sublayer's
            // layout based on the constraints specified on the sublayer and the new size.
            // Because of the way we assign CSS positional styles for a constraint box,
            // specifically that CSS already does the exact same calculation we do,
            // There's no CSS that needs to change in this case, so we won't queue anything.
            return;
        }
        if (keyPath == 'shadowColor' || keyPath == 'shadowOffset' || keyPath == 'shadowRadius'){
            // Because the boxShadow property in CSS is a single property, and the combination
            // of several UILayer properties, we'll treat any shadow-related property as the same
            // thing so only one update gets queued.
            keyPath = 'shadow';
        }
        if (keyPath == 'frame' || keyPath == 'position' || keyPath == 'constraintBox'){
            // Changes to any of these UILayer properties triggers the same CSS updates, so
            // we'll treat them as the same thing so only one update gets queued.
            keyPath = 'box';
        }
        UIHTMLRenderer.$super.setLayerNeedsRenderForKeyPath.call(this, layer, keyPath);
    },

    layerPropertyRenderer: {

        box: function (layer, context){
            var box = layer.presentation.constraintBox;
            if (!box){
                box = JSConstraintBox.Rect(layer.presentation.frame);
            }
            for (var property in box){
                if (box[property] === undefined){
                    context.style[property] = '';
                }else{
                    context.style[property] = box[property] + 'px';
                }
            }
            if (box.left === undefined && box.right === undefined){
                var width = box.width;
                if (width === undefined){
                    width = layer.presentation.frame.size.width;
                }
                context.style.left = '50%';
                context.style.marginLeft = (-width) + 'px';
            }else{
                context.style.marginLeft = '';
            }
            if (box.top === undefined && box.bottom === undefined){
                var height = box.height;
                if (height === undefined){
                    height = layer.presentation.frame.size.height;
                }
                context.style.top = '50%';
                context.style.marginTop = (-height) + 'px';
            }else{
                context.style.marginTop = '';
            }
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'frame.origin.x': function(layer, context){
            context.style.left = layer.presentation.frame.origin.x + 'px';
        },

        'frame.origin.y': function(layer, context){
            context.style.top = layer.presentation.frame.origin.y + 'px';
        },

        'frame.size.width': function(layer, context){
            context.style.width = layer.presentation.frame.size.width + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'frame.size.height': function(layer, context){
            context.style.height = layer.presentation.frame.size.height + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'constraintBox.top': function(layer, context){
            context.style.top = layer.presentation.constraintBox.top + 'px';
        },

        'constraintBox.right': function(layer, context){
            context.style.right = layer.presentation.constraintBox.right + 'px';
        },

        'constraintBox.bottom': function(layer, context){
            context.style.bottom = layer.presentation.constraintBox.bottom + 'px';
        },

        'constraintBox.left': function(layer, context){
            context.style.left = layer.presentation.constraintBox.left + 'px';
        },

        'constraintBox.width': function(layer, context){
            context.style.width = layer.presentation.constraintBox.width + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'constraintBox.height': function(layer, context){
            context.style.height = layer.presentation.constraintBox.height + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        hidden: function(layer, context){
            context.style.display = layer.presentation.hidden ? 'none' : '';
        },

        opacity: function(layer, context){
            context.style.opacity = layer.presentation.opacity != 1.0 ? layer.presentation.opacity : '';
        },

        backgroundColor: function(layer, context){
            context.style.backgroundColor = layer.presentation.backgroundColor ? layer.presentation.backgroundColor.cssString() : '';
        },

        borderColor: function(layer, context){
            context.style.borderColor = layer.presentation.borderColor ? layer.presentation.borderColor.cssString() : '';
        },

        borderWidth: function(layer, context){
            if (layer.presentation.borderWidth){
                context.style.borderWidth = layer.presentation.borderWidth + 'px';
                context.style.borderStyle = 'solid';
            }else{
                context.style.borderWidth = '';
                context.style.borderStyle = '';
            }
        },

        borderRadius: function(layer, context){
            context.style.borderRadius = layer.presentation.borderRadius ? layer.presentation.borderRadius + 'px' : '';
        },

        shadow: function(layer, context){
            if (layer.shadowColor){
                context.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(layer.shadowOffset.x, layer.shadowOffset.y, layer.shadowRadius, layer.shadowColor.cssString());
            }else{
                context.style.boxShadow = '';
            }
        },

        transform: function(layer, context){
            var transform = layer.presentation.transform;
            if (transform){
                context.style.webkitTransform = context.style.MozTransform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
            }else{
                context.style.webkitTransform = context.style.MozTransform = '';
            }
        },

        text: function(layer, context){
            context.textNode.value = layer.text;
        },

        textColor: function(layer, context){
            context.style.color = layer.presentation.textColor ? layer.presentation.textColor.cssString() : '';
        },

        contentSize: function(layer, context){
            context.scrollContentSizer.style.width = layer.presentation.contentSize.width + 'px';
            context.scrollContentSizer.style.height = layer.presentation.contentSize.height + 'px';
        },

        contentOffset: function(layer, context){
            context.element.scrollLeft = layer.presentation.contentOffset.x;
            context.element.scrollTop = layer.presentation.contentOffset.y;
        }

    },

    contextForLayer: function(layer){
        if (layer.objectID in this.contextsByLayerID){
            return this.contextsByLayerID[layer.objectID];
        }
        var element = this.domDocument.createElement('div');
        var context = UIHTMLRendererContext.initWithElement(element);
        if (layer.isKindOfClass(UIScrollLayer)){
            var sizer = element.appendChild(this.domDocument.createElement('div'));
            element.style.position = 'relative';
            sizer.style.position = 'absolute';
            sizer.style.top = '0px';
            sizer.style.left = '0px';
            sizer.style.width = '0px';
            sizer.style.height = '0px';
            context.scrollContentSizer = sizer;
        }else if (layer.isKindOfClass(UITextLayer)){
            context.textNode = element.appendChild(this.domDocument.createTextNode(''));
        }
        context.firstSublayerNodeIndex = element.childNodes.length;
        element.style.position = 'absolute'; // TODO: allow other layout strategies
        element.style.boxSizing = 'border-box';
        element.style.mozBoxSizing = 'border-box';
        if (element.dataset){
            element.dataset.layerId = layer.objectID;
        }
        this.contextsByLayerID[layer.objectID] = context;
        return context;
    },

    handleEvent: function(domEvent){
        if (domEvent.type == 'resize' && domEvent.currentTarget === this.domWindow){
            this.determineEnvironmentSize();
            if (this.rootLayer.constraintBox){
                this.rootLayer._updateFrameAfterSuperSizeChange(this.environmentSize);
            }
        }else{
            var element = domEvent.currentTarget;
            var context = element._UIHTMLRendererContext;
            var methodName = this.domEventMethodMap[domEvent.type.lower()];
            var event = UIEvent.init();
            context.view[methodName](event);
            domEvent.stopPropagation();
        }
    },

    requestDisplayFrame: function(){
        if (!this.displayFrameID){
            this.displayFrameID = this.domWindow.requestAnimationFrame(this._displayFrameBound);
        }
    }

});

Object.defineProperty(JSColor.prototype, 'cssString', {
    enumerable: false,
    value: function JSColor_cssString(){
        if (this.colorSpace === JSColorSpaceIdentifier.RGBA){
            return 'rgba(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.RGB){
            return 'rgb(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.HSLA){
            return 'hsla(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.HSL){
            return 'hsl(' + this.components.join(',') + ')';
        }else if (this.colorSpace === JSColorSpaceIdentifier.GRAY){
            var w = this.components[0];
            return 'rgb(' + [w, w, w].join(',') + ')';
        }else{
            throw Error("Unsupported color space.  Cannot generate css string for '%s'".sprintf(this.colorSpace));
        }
    }
});

Object.defineProperty(JSFont.prototype, 'cssString', {
    enumerable: false,
    value: function JSFont_cssString(){
        return '%spx %s'.sprintf(this.pointSize, this.familyName);
    }
});

Object.defineProperty(JSData.prototype, 'blobURL', {
    enumerable: false,
    value: function JSData_blobURL(){
        if (!this._blob){
            this._blob = Blob([this.bytes]);
        }
        return createObjectURL(this._blob);
    }
});