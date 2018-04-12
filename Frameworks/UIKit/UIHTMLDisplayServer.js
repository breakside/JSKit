// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIHTMLDisplayServerContext.js"
// #import "UIKit/UIHTMLTextFramesetter.js"
// #import "UIKit/UITextAttachmentView.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
/* global JSClass, UIDisplayServer, UIHTMLDisplayServer, UIHTMLDisplayServerContext, JSSize, JSRect, JSPoint, UILayer, jslog_create, UIHTMLTextFramesetter, UIView, UITextAttachmentView */
'use strict';

(function(){

var logger = jslog_create("uikit.display-server");

JSClass("UIHTMLDisplayServer", UIDisplayServer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayers: null,
    rootContext: null,
    rootBounds: null,
    displayFrameID: null,
    _displayFrameBound: null,
    contextsByObjectID: null,

    // -------------------------------------------------------------------------
    // MARK: - HTML Display Setup

    initWithRootElement: function(rootElement){
        UIHTMLDisplayServer.$super.init.call(this);
        this.rootElement = rootElement;
        this.rootContext = UIHTMLDisplayServerContext.initWithElement(this.rootElement);
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayers = [];
        this.contextsByObjectID = {};
        this._displayFrameBound = this.displayFrame.bind(this);
        this.determineRootBounds();
        // TODO: fill in system fonts
        // (use the trick of creating some divs and spans offscreen and deriving font properties from their relative sizes)
    },

    determineRootBounds: function(){
        this.rootBounds = JSRect(0, 0, this.rootElement.offsetWidth, this.rootElement.offsetHeight);
    },

    updateRootBounds: function(){
        this.determineRootBounds();
        var layer;
        for (var i = 0, l = this.rootLayers.length; i < l; ++i){
            layer = this.rootLayers[i];
            if (layer.constraintBox){
                layer.frame = UILayer.FrameForConstraintBoxInBounds(layer.constraintBox, this.rootBounds);
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
                UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
                break;
            default:
                context = this.contextForLayer(layer);
                context.propertiesNeedingUpdate[parts[0]] = true;
                UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
                break;
        }
    },

    setLayerNeedsDisplay: function(layer){
        var context = this.contextForLayer(layer);
        context.needsFullDisplay = true;
        UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
    },

    displayLayer: function(layer){
        var context = this.contextForLayer(layer);
        if (context.needsFullDisplay){
            context.resetForDisplay();
            layer.display();
            context.cleanupAfterDisplay();
        }else{
            context.drawLayerProperties(layer);
        }
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
        var context = this.contextsByObjectID[layer.objectID];
        if (context === undefined){
            var element = this.domDocument.createElement('div');
            context = UIHTMLDisplayServerContext.initWithElement(element);
            this.associateContextWithLayer(context, layer);
        }
        return context;
    },

    attachmentInserted: function(attachment, parentElement){
        if (attachment.isKindOfClass(UITextAttachmentView)){
            var layer = attachment.view.layer;
            if (layer._displayServer === null){
                var context = this.contextForLayer(layer);
                layer._displayServer = this;
                if (layer._needsLayout){
                    this.setLayerNeedsLayout(layer);
                    layer._needsLayout = false;
                }
                this.setLayerNeedsReposition(layer);
                this.setLayerNeedsDisplay(layer);
                for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                    this.layerInserted(layer.sublayers[i]);
                }
                if (context.element.parentNode !== parentElement){
                    parentElement.appendChild(context.element);
                }
            }
        }
    },

    contextForAttachment: function(attachment, parentElement){
        var context;
        if (attachment.isKindOfClass(UITextAttachmentView)){
            var layer = attachment.view.layer;
            context = this.contextForLayer(layer);
        }else{
            context = this.contextsByObjectID[attachment.objectID];
            if (context === undefined){
                var element = this.domDocument.createElement('div');
                context = UIHTMLDisplayServerContext.initWithElement(element);
                this.contextsByObjectID[attachment.objectID] = context;
            }
        }
        if (context.element.parentNode !== parentElement){
            parentElement.appendChild(context.element);
        }
        return context;
    },

    associateContextWithLayer: function(context, layer){
        if (layer.objectID in this.contextsByObjectID){
            throw new Error("Layer already has a context");
        }
        layer.initializeHTMLContext(context);
        context.layerManagedNodeCount = context.element.childNodes.length;
        context.firstSublayerNodeIndex = context.layerManagedNodeCount;
        if (context.element.dataset){
            context.element.dataset.layerId = layer.objectID;
            if (layer.delegate !== null){
                if (layer.delegate.isKindOfClass(UIView) && layer.delegate.layer !== layer){
                    context.element.dataset.layerClass = layer.$class.className;
                }else{
                    context.element.dataset.viewClass = layer.delegate.$class.className;
                }
            }else{
                context.element.dataset.layerClass = layer.$class.className;
            }
        }
        this.contextsByObjectID[layer.objectID] = context;
    },

    // -------------------------------------------------------------------------
    // MARK: - Notifications

    layerInserted: function(layer){
        layer._displayServer = this;
        var parentContext;
        if (layer.superlayer){
            parentContext = this.contextsByObjectID[layer.superlayer.objectID];
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
            if (layer._needsLayout){
                this.setLayerNeedsLayout(layer);
                layer._needsLayout = false;
            }
            this.setLayerNeedsReposition(layer);
            this.setLayerNeedsDisplay(layer);
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }else{
            logger.warn("layerInserted called without valid parent context");
        }
    },

    layerRemoved: function(layer){
        var context = this.contextsByObjectID[layer.objectID];
        if (context){
            if (context.element.parentNode){
                context.element.parentNode.removeChild(context.element);
            }
            // FIXME: when a view is just moving to a new superview, we shouldn't destroy the context
            layer.destroyHTMLContext(context);
            context.destroy();
            delete this.contextsByObjectID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
        layer._displayServer = null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Text

    createTextFramesetter: function(){
        return UIHTMLTextFramesetter.initWithDocument(this.domDocument, this);
    },

    // MARK: - Debugging

    _clientRectElements: null,

    _clientRectColors: [
        'rgba(255,0,0,0.5)',
        'rgba(0,0,255,0.5)',
        'rgba(0,255,128,0.5)',
        'rgba(255,128,128,0.5)',
    ],

    showClientRects: function(obj){
        if (this._clientRectElements === null){
            this._clientRectElements = [];
        }
        var parentRect = this.rootElement.getBoundingClientRect();
        var rects = obj.getClientRects();
        var element;
        for (var i = 0, l = rects.length; i < l; ++i){
            if (i < this._clientRectElements.length){
                element = this._clientRectElements[i];
            }else{
                element = this.domDocument.createElement('div');
                element.style.position = 'absolute';
                element.style.border = '1px solid %s'.sprintf(this._clientRectColors[i % this._clientRectColors.length]);
                element.style.boxSizing = 'border-box';
                this.rootElement.appendChild(element);
                this._clientRectElements.push(element);
            }
            element.style.width = '%dpx'.sprintf(rects[i].width || 1);
            element.style.height = '%dpx'.sprintf(rects[i].height || 1);
            element.style.left = '%dpx'.sprintf(rects[i].x - parentRect.x);
            element.style.top = '%dpx'.sprintf(rects[i].y - parentRect.y);
        }
        for (var j = this._clientRectElements.length - 1; j >= i; --j){
            element = this._clientRectElements.pop();
            element.parentNode.removeChild(element);
        }
    },

    hideClientRects: function(){
        for (var i = 0, l = this._clientRectElements.length; i < l; ++i){
            this._clientRectElements[i].parentNode.removeChild(this._clientRectElements[i]);
        }
        this._clientRectElements = [];
    }

});

})();