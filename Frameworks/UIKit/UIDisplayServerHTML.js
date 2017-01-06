// #import "UIKit/UIDisplayServer.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
/* global JSClass, UIDisplayServer, UIDisplayServerHTML, JSHTMLContext, JSSize, JSRect, JSPoint, UILayer */
'use strict';

JSClass("UIDisplayServerHTML", UIDisplayServer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayers: null,
    rootContext: null,
    rootBounds: null,
    displayFrameID: null,
    _displayFrameBound: null,
    contextsByLayerID: null,

    // -------------------------------------------------------------------------
    // MARK: - HTML Display Setup

    initWithRootElement: function(rootElement){
        UIDisplayServerHTML.$super.init.call(this);
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayers = [];
        this.contextsByLayerID = {};
        this._displayFrameBound = this.displayFrame.bind(this);
        this.setupRenderingEnvironment();
    },

    setupRenderingEnvironment: function(){
        this.rootContext = JSHTMLContext.initWithElement(this.rootElement);
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            body.style.padding = '0';
            html.style.padding = '0';
            body.style.margin = '0';
            html.style.margin = '0';
            body.style.height = '100%';
            html.style.height = '100%';
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative' && style.position != 'fixed'){
                this.rootElement.style.position = 'relative';
            }
        }
        this.rootElement.style.fontFamily = '"San Francisco", "Helvetica Neue", "Helvetica", sans-serif';
        this.rootElement.style.fontSize = '14px';
        this.rootElement.style.fontWeight = 300;
        this.rootElement.style.lineHeight = '19px';
        this.rootElement.style.cursor = 'default';
        this._determineRootBounds();
        this.setupEventListeners();
    },

    // -------------------------------------------------------------------------
    // MARK: - Display-related Events

    setupEventListeners: function(){
        this.domWindow.addEventListener('resize', this, false);
    },

    handleEvent: function(e){
        this[e.type](e);
    },

    resize: function(e){
        if (e.currentTarget === this.domWindow){
            this._determineRootBounds();
            var layer;
            for (var i = 0, l = this.rootLayers.length; i < l; ++i){
                layer = this.rootLayers[i];
                if (layer.constraintBox){
                    layer.frame = UILayer.FrameForConstraintBoxInBounds(layer.constraintBox, this.rootBounds);
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Cycle

    setUpdateNeeded: function(){
        this.requestDisplayFrame();
    },

    requestDisplayFrame: function(){
        if (this.displayFrameID === null){
            this.displayFrameID = this.domWindow.requestAnimationFrame(this._displayFrameBound);
        }
    },

    displayFrame: function(t){
        this.displayFrameID = null;
        this.updateDisplay(t);
    },

    // -------------------------------------------------------------------------
    // MARK: - Overrides

    layerDidChangeProperty: function(layer, keyPath){
        var parts = keyPath.split('.');
        var context;
        switch (parts[0]){
            case 'position':
            case 'anchorPoint':
                this.setLayerNeedsReposition(layer);
                break;
            case 'shadowColor':
            case 'shadowOffset':
            case 'shadowRadius':
                context = this.contextForLayer(layer);
                context.propertiesNeedingUpdate.shadow = true;
                UIDisplayServerHTML.$super.setLayerNeedsDisplay.call(this, layer);
                break;
            default:
                context = this.contextForLayer(layer);
                context.propertiesNeedingUpdate[parts[0]] = true;
                UIDisplayServerHTML.$super.setLayerNeedsDisplay.call(this, layer);
                break;
        }
    },

    setLayerNeedsDisplay: function(layer){
        var context = this.contextForLayer(layer);
        context.needsRedraw = true;
        UIDisplayServerHTML.$super.setLayerNeedsDisplay.call(this, layer);
    },

    positionLayer: function(layer){
        // Layers need to be positioned in the coordinates of their superlayer
        // Position and anchor point get us most of the way there, but there's still
        // the superlayer's bounds to consider.
        var context = this.contextForLayer(layer);
        var origin = JSPoint(layer.presentation.position);
        var parentScrolls = context.element.parentNode !== null && (context.element.parentNode.style.overflow == 'auto' || context.element.parentNode.style.overflow == 'scroll');
        var superorigin = (layer.superlayer !== null && !parentScrolls) ? layer.superlayer.presentation.bounds.origin : JSPoint.Zero;
        var size = layer.presentation.bounds.size;
        origin.x -= size.width * layer.presentation.anchorPoint.x - superorigin.x;
        origin.y -= size.height * layer.presentation.anchorPoint.y - superorigin.y;
        context.style.top = origin.y + 'px';
        context.style.left = origin.x + 'px';
    },

    contextForLayer: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context === undefined){
            var element = this.domDocument.createElement('div');
            context = JSHTMLContext.initWithElement(element);
            if (element.dataset){
                element.dataset.layerId = layer.objectID;
                if (layer.delegate !== null){
                    element.dataset.viewClass = layer.delegate.$class.className;
                }
            }
            this.contextsByLayerID[layer.objectID] = context;
            layer.initializeHTMLContext(context);
        }
        return context;
    },

    // -------------------------------------------------------------------------
    // MARK: - Notifications

    layerInserted: function(layer){
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByLayerID[layer.superlayer.objectID];
        }else{
            parentContext = this.rootContext;
            this.rootLayers.push(layer);
            layer.frame = UILayer.FrameForConstraintBoxInBounds(layer.constraintBox, this.rootBounds);
        }
        if (parentContext){
            var context = this.contextForLayer(layer);
            var insertIndex = parentContext.firstSublayerNodeIndex + layer.level;
            if (insertIndex < parentContext.element.childNodes.length){
                parentContext.element.insertBefore(context.element, parentContext.element.childNodes[insertIndex]);
            }else{
                parentContext.element.appendChild(context.element);
            }
            context.firstSublayerNodeIndex = context.element.childNodes.length;
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }
    },

    layerRemoved: function(layer){
        var context = this.contextsByLayerID[layer.objectID];
        if (context){
            if (context.element.parentNode){
                context.element.parentNode.removeChild(context.element);
            }
            // FIXME: when a view is just moving to a new superview, we shouldn't destroy the context
            layer.destroyHTMLContext(context);
            context.destroy();
            delete this.contextsByLayerID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Private Helpers

    _determineRootBounds: function(){
        this.rootBounds = JSRect(0, 0, this.rootElement.offsetWidth, this.rootElement.offsetHeight);
    }

});