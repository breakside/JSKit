// #import "UIKit/UIDisplayServer.js"
// #import "UIKit/UIHTMLDisplayServerCanvasContext.js"
/// #import "UIKit/UIHTMLDisplayServerSVGContext.js"
// #import "UIKit/UIHTMLTextFramesetter.js"
// #import "UIKit/UITextAttachmentView.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
/* global JSGlobalObject, Element, JSClass, UIDisplayServer, UIHTMLDisplayServer, UIHTMLDisplayServerContext, UIHTMLDisplayServerCanvasContext, UIHTMLDisplayServerSVGContext, JSSize, JSRect, JSPoint, UILayer, JSLog, UITextFramesetter, UIHTMLTextFramesetter, UIView, UITextAttachmentView */
'use strict';

(function(){

var logger = JSLog("ui", "display");

var sharedInstance = null;

JSClass("UIHTMLDisplayServer", UIDisplayServer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    windowsContext: null,
    displayFrameID: null,
    _displayFrameBound: null,
    contextsByObjectID: null,
    contextClass: null,

    // -------------------------------------------------------------------------
    // MARK: - HTML Display Setup

    initWithRootElement: function(rootElement){
        UIHTMLDisplayServer.$super.init.call(this);
        this.contextClass = UIHTMLDisplayServerCanvasContext;
        this.rootElement = rootElement;
        this.rootElement.style.webkitOverflowScrolling = 'auto';
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.windowsContext = this.contextClass.initWithElementUnmodified(this.rootElement);
        this.contextsByObjectID = {};
        this._insertedLayers = {};
        this._removedLayers = {};
        this._displayFrameBound = this.displayFrame.bind(this);
        if (sharedInstance !== null){
            throw new Error("Only one UIHTMLDisplayServer instance is allowed");
        }
        sharedInstance = this;

        UITextFramesetter.definePropertiesFromExtensions({

            init: function(){
                if (sharedInstance){
                    return UIHTMLTextFramesetter.initWithDocument(sharedInstance.domDocument, sharedInstance);
                }else{
                    UITextFramesetter.$super.init.call(this);
                }
            }

        });
    },

    deinit: function(){
        sharedInstance = null;
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
        this.updateDisplay(t / 1000.0);
    },

    updateDisplay: function(t){
        if (this.displayFrameID === null){
            this.domWindow.cancelAnimationFrame(this.displayFrameID);
            this.displayFrameID = null;
        }
        this._flushDOMInsertsAndRemovals();
        UIHTMLDisplayServer.$super.updateDisplay.call(this, t);
    },

    // -------------------------------------------------------------------------
    // MARK: - Overrides

    layerDidChangeProperty: function(layer, keyPath){
        var parts = keyPath.split('.');
        var context;
        if (parts.length > 1 && parts[0] == 'bounds' && parts[1] == 'origin'){
            this._layerDidChangeBoundsOrigin(layer);
            return;
        }
        switch (parts[0]){
            case 'position':
            case 'anchorPoint':
                this.setLayerNeedsReposition(layer);
                break;
            default:
                context = this.contextForLayer(layer);
                context.layerDidChangeProperty(layer, parts[0]);
                UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
                break;
        }
    },

    setLayerNeedsDisplay: function(layer){
        var context = this.contextForLayer(layer);
        context.needsCustomDisplay = true;
        UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
    },

    positionLayer: function(layer){
        // Layers need to be positioned in the coordinates of their superlayer
        // Position and anchor point get us most of the way there, but there's still
        // the superlayer's bounds to consider.
        var context = this.contextForLayer(layer);
        var origin = JSPoint(layer.presentation.position);
        var superorigin;
        if (layer.superlayer !== null){
            var superContext = this.contextForLayer(layer.superlayer);
            superorigin = layer.superlayer.presentation.bounds.origin;
        }else{
            superorigin = JSPoint.Zero;
        }
        var size = layer.presentation.bounds.size;
        origin.x -= size.width * layer.presentation.anchorPoint.x + superorigin.x;
        origin.y -= size.height * layer.presentation.anchorPoint.y + superorigin.y;
        context.style.top = origin.y + 'px';
        context.style.left = origin.x + 'px';
    },

    _layerDidChangeBoundsOrigin: function(layer){
        var context = this.contextForLayer(layer);
        context.layerDidChangeProperty(layer, 'origin');
        UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
        for (var i = 0, l = layer.sublayers.length; i < l; ++i){
            this.setLayerNeedsReposition(layer.sublayers[i]);
        }
    },

    contextForLayer: function(layer){
        var context = this.contextsByObjectID[layer.objectID];
        if (context === undefined){
            var element = this.domDocument.createElement('div');
            context = this.contextClass.initWithElement(element);
            this.associateContextWithLayer(context, layer);
        }
        return context;
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
                context = this.contextClass.initWithElement(element);
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
        if (layer.delegate && layer.delegate.initializeLayerHTMLContext){
            layer.delegate.initializeLayerHTMLContext(layer, context);
        }
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

    _insertedLayers: null,
    _removedLayers: null,

    windowInserted: function(window){
        this._layerInserted(window.layer, this.windowsContext);
        this.windowInsertedQueue.enqueue(window);
    },

    layerInserted: function(layer){
        if (!layer.superlayer){
            throw new Error("Cannot insert layer without a superlayer");
        }
        var parentContext = this.contextForLayer(layer.superlayer);
        this._layerInserted(layer, parentContext);
    },

    _layerInserted: function(layer, parentContext){
        var known = layer._displayServer === this;
        var removeQueued = layer.objectID in this._removedLayers;
        layer._displayServer = this;
        if (parentContext !== null){
            this._insertedLayers[layer.objectID] = {layer: layer, parentContext: parentContext};
        }
        if (removeQueued){
            delete this._removedLayers[layer.objectID];
        }
        // For completely new layers, a full display and position are required since this
        // is the first opportunity to display and position the layer.  A layout may be
        // required, but this is something the layer can do without a display server, and
        // therefore is based on a private flag.
        if (!known){
            if (layer._needsLayout){
                this.setLayerNeedsLayout(layer);
                layer._needsLayout = false;
            }
            if (layer.animationCount > 0){
                this.setLayerNeedsAnimation(layer);
            }
            this.setLayerNeedsReposition(layer);
            if (layer._needsDisplay){
                this.setLayerNeedsDisplay(layer);
                layer._needsDisplay = false;
            }else{
                UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
            }
        }
        // For completely new layers, or removed layers that are re-inserted within the same
        // display cyle, all sublayers need to be inserted (or re-inserted)
        if (!known || removeQueued){
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
        }
        this.setUpdateNeeded();
    },

    layerRemoved: function(layer){
        // While it might seem like setting the layer._displayServer property to
        // null is appropirate here, we'll instead do so only in the final removal
        // within _flushDOMInsertsAndRemovals. This allows a layer that is immediately
        // re-inserted to not go through a full re-dsiplay unless absolutely necessary.
        // NOTE: If this needs to change in the future, at least 3 operations need
        // to happen in coordination:
        // 1. layer._displayServer = null
        // 2. layer._needsDisplay = this.layerNeedsDisplay(layer)
        // 3. layer's context._hasRenderedOnce = false
        // A previous bug (forgetting #3) led to the rethink that setting layer._displayServer = null
        // wasn't really necessary.
        this._removedLayers[layer.objectID] = layer;
        if (layer.objectID in this._insertedLayers){
            delete this._insertedLayers[layer.objectID];
        }
        for (var i = 0, l = layer.sublayers.length; i < l; ++i){
            this.layerRemoved(layer.sublayers[i]);
        }
        this.setUpdateNeeded();
    },

    _flushDOMInsertsAndRemovals: function(){
        var layerId;
        var layer;

        // Removals
        for (layerId in this._removedLayers){
            layer = this._removedLayers[layerId];
            layer._displayServer = null;
            this._removeLayerFromDOM(layer);
            this._removeLayerFromUpdateQueues(layer);
        }
        this._removedLayers = {};

        // Insertions
        // Insert layers sorted by sublayerIndex within each parent context to ensure that
        // the inserted layers are placed in the correct spot.  For example, say we have a
        // superlayer with three existing layers, and are inserting two more.  If we insert
        // the higher sublayer index first, the calculation that translates sublayer index
        // to dom child index will be off, since the lower sublayer isn't in yet.
        var insertedLayersByParentContext = {};
        var parentContextsById = {};
        var info;
        for (layerId in this._insertedLayers){
            info = this._insertedLayers[layerId];
            if (!(info.parentContext.objectID in insertedLayersByParentContext)){
                insertedLayersByParentContext[info.parentContext.objectID] = [];
                parentContextsById[info.parentContext.objectID] = info.parentContext;
            }
            insertedLayersByParentContext[info.parentContext.objectID].push(info.layer);
        }
        for (var contextId in insertedLayersByParentContext){
            insertedLayersByParentContext[contextId].sort(function(a, b){
                return a.sublayerIndex - b.sublayerIndex;
            });
            for (var i = 0, l = insertedLayersByParentContext[contextId].length; i < l; ++i){
                this._insertLayerIntoDOM(insertedLayersByParentContext[contextId][i], parentContextsById[contextId]);
            }
        }
        this._insertedLayers = {};
    },

    _removeLayerFromDOM: function(layer){
        layer._displayServer = null;
        var context = this.contextsByObjectID[layer.objectID];
        if (context){
            if (context.element.isConnected){
                context.element.parentNode.removeChild(context.element);
            }
            this._destroyContextForLayer(layer);
        }
    },

    _destroyContextForLayer: function(layer){
        for (var i = 0, l = layer.sublayers.length; i < l; ++i){
            this._destroyContextForLayer(layer.sublayers[i]);
        }
        var context = this.contextsByObjectID[layer.objectID];
        if (context){
            if (layer.delegate && layer.delegate.destroyLayerHTMLContext){
                layer.delegate.destroyLayerHTMLContext(layer, context);
            }
            context.destroy();
            delete this.contextsByObjectID[layer.objectID];
        }
    },

    _insertLayerIntoDOM: function(layer, parentContext){
        var context = this.contextForLayer(layer);
        var insertIndex = parentContext.firstSublayerNodeIndex + layer.sublayerIndex;
        // If we're moving within the same node, we need to be careful about the index
        // calculations.  For example, if context.element is currently at index 4, and it's
        // moving to index 7, that 7 was calculated assuming that index 4 was removed.  So it
        // really should be 8 in the DOM since our element is still in there.  But we can't just
        // add 1 because the same doesn't hold if we're moving down in index, like from 7 to 4.
        // So the easiest thing to do is remove our element from the parent first.  Alternatively,
        // we could find the current index with Array.indexOf(), and conditionally add 1 if moving up.
        // I doubt there's a big performance difference.
        if (context.element.parentNode === parentContext.element){
            parentContext.element.removeChild(context.element);
        }
        if (insertIndex < parentContext.element.childNodes.length){
            if (context.element !== parentContext.element.childNodes[insertIndex]){
                parentContext.element.insertBefore(context.element, parentContext.element.childNodes[insertIndex]);
            }
        }else{
            parentContext.element.appendChild(context.element);
        }
    },

    attachmentInserted: function(attachment){
        if (attachment.isKindOfClass(UITextAttachmentView)){
            var layer = attachment.view.layer;
            this._layerInserted(layer, null);
        }
    },

    attachmentRemoved: function(attachment){
        if (attachment.isKindOfClass(UITextAttachmentView)){
            var layer = attachment.view.layer;
            this.layerRemoved(layer);
        }else{
            var context = this.contextsByObjectID[attachment.objectID];
            if (context !== null){
                context.destroy();
                delete this.contextsByObjectID[attachment.objectID];
            }
        }
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

if (JSGlobalObject.Node && !('isConnected' in Node.prototype)){
    Object.defineProperty(Element.prototype, 'isConnected', {
        get: function Element_isConnected(){
            return this.ownerDocument.body.contains(this);
        }
    });
}

})();