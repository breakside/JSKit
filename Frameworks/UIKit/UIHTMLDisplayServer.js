// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIDisplayServer.js"
// #import "UIHTMLDisplayServerCanvasContext.js"
// #import "UIHTMLDisplayServerSVGContext.js"
// #import "UIHTMLTextFramesetter.js"
// #import "UITextAttachmentView.js"
// #feature Window.prototype.addEventListener
// #feature window.getComputedStyle
// #feature window.requestAnimationFrame
// #feature Document.prototype.createElement
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("uikit", "display");

var sharedInstance = null;

JSClass("UIHTMLDisplayServer", UIDisplayServer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    screenContext: null,
    displayFrameID: null,
    _fontStyleElement: null,
    _displayFrameBound: null,
    contextsByObjectID: null,
    contextClass: null,
    _windowServer: null,

    // -------------------------------------------------------------------------
    // MARK: - HTML Display Setup

    initWithRootElement: function(rootElement){
        UIHTMLDisplayServer.$super.init.call(this);
        this.contextClass = UIHTMLDisplayServerCanvasContext;
        this.rootElement = rootElement;
        this.rootElement.style.webkitOverflowScrolling = 'auto';
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.screenContext = this.contextClass.initScreenInContainer(this.rootElement);
        this.rootElement.appendChild(this.screenContext.element);
        this.screenContext.displayServer = this;
        this.contextsByObjectID = {};
        this._insertedLayers = {};
        this._removedLayers = {};
        this._registeredFontCSSRules = {};
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

    // MARK: - Screen Size

    setScreenSize: function(size){
        this.screenContext.setSize(size);
    },

    // MARK: - Fonts

    _registeredFontCSSRules: null,

    registerBundleFontDescriptor: function(descriptor){
        // bundle fonts rules are already in a linked 
        var name = "%s|%s|%d".sprintf(descriptor.family, descriptor.style, Math.floor(descriptor.weight));
        this._registeredFontCSSRules[name] = null;
    },

    registerFontDescriptor: function(descriptor, completion, target){
        var name = "%s|%s|%d".sprintf(descriptor.family, descriptor.style, Math.floor(descriptor.weight));
        if (name in this._registeredFontCSSRules){
            completion.call(target);
            return;
        }
        var font = descriptor.htmlFontFace();
        var doc = this.domDocument;
        if (font){
            font.load().then(function(){
                doc.fonts.add(font);
                completion.call(target);
            }, function(e){
                logger.error("Failed to load font");
                completion.call(target);
            });
            this._registeredFontCSSRules[name] = font;
        }else{
            if (!this._fontStyleElement){
                this._fontStyleElement = doc.createElement("style");
                this._fontStyleElement.type = "text/css";
                doc.head.appendChild(this._fontStyleElement);
            }
            var stylesheet = this._fontStyleElement.sheet;
            var ruleText = descriptor.cssFontFaceRuleString();
            if (ruleText !== null){
                this._registeredFontCSSRules[name] = stylesheet.insertRule(ruleText, stylesheet.cssRules.length);
            }else{
                this._registeredFontCSSRules[name] = null;
            }
            // TODO: need to force load the font by using it somewhere
            JSRunLoop.main.schedule(completion, target);
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
        this.updateDisplay(t / 1000.0);
    },

    updateDisplay: function(t){
        if (this.displayFrameID !== null){
            this.domWindow.cancelAnimationFrame(this.displayFrameID);
            this.displayFrameID = null;
        }
        this._flushDOMInsertsAndRemovals();
        UIHTMLDisplayServer.$super.updateDisplay.call(this, t);
    },

    stop: function(){
        UIHTMLDisplayServer.$super.stop.call(this);
        if (this.displayFrameID !== null){
            this.domWindow.cancelAnimationFrame(this.displayFrameID);
            this.displayFrameID = null;
        }
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
            case 'bounds':
                if (parts.length === 1){
                    this.layerDidChangeProperty(layer, 'bounds.origin');
                    this.layerDidChangeProperty(layer, 'bounds.size');
                }else{
                    switch (parts[1]){
                        case 'origin':
                            this._layerDidChangeBoundsOrigin(layer);
                            break;
                        case 'size':
                            context = this.contextForLayer(layer);
                            context.layerDidChangeProperty(layer, 'size');
                            UIHTMLDisplayServer.$super.setLayerNeedsDisplay.call(this, layer);
                            break;
                    }
                }
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
        layer._UIHTMLDisplayServerCustomDrawing = true;
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
        context.setOrigin(origin);
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
            context = this.contextClass.initForScreenContext(this.screenContext);
            context.displayServer = this;
            this.associateContextWithLayer(context, layer);
        }
        return context;
    },

    contextForAttachment: function(attachment){
        var context;
        if (attachment.isKindOfClass(UITextAttachmentView)){
            var layer = attachment.view.layer;
            context = this.contextForLayer(layer);
        }else{
            context = this.contextsByObjectID[attachment.objectID];
            if (context === undefined){
                context = this.contextClass.initForScreenContext(this.screenContext);
                context.displayServer = this;
                this.contextsByObjectID[attachment.objectID] = context;
            }
        }
        return context;
    },

    associateContextWithLayer: function(context, layer){
        if (layer.objectID in this.contextsByObjectID){
            throw new Error("Layer already has a context");
        }
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
        this._layerInserted(window.layer, this.screenContext);
        this.windowInsertedQueue.enqueue(window);
        this.windowRemovalQueue.remove(window);
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
        if (this._isUpdating){
            if (parentContext !== null){
                this._flushDOMInsertsAndRemovals();
            }
        }else{
            this.setUpdateNeeded();
        }
    },

    layerRemoved: function(layer, isRecursive){
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
            this.layerRemoved(layer.sublayers[i], true);
        }
        if (this._isUpdating){
            if (!isRecursive){
                this._flushDOMInsertsAndRemovals();
            }
        }else{
            this.setUpdateNeeded();
        }
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
        if (layer._UIHTMLDisplayServerCustomDrawing){
            // So the layer will redraw if it's ever re-added
            layer.setNeedsDisplay();
        }
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
            context.destroy();
            context.displayServer = null;
            delete this.contextsByObjectID[layer.objectID];
        }
    },

    _insertLayerIntoDOM: function(layer, parentContext){
        var context = this.contextForLayer(layer);
        parentContext.insertSublayerContext(layer, context);
    },

    attachmentInserted: function(attachment){
        if (attachment.isKindOfClass(UITextAttachmentView)){
            attachment.view._setWindowServer(this._windowServer, true);
            var layer = attachment.view.layer;
            this._layerInserted(layer, null);
        }
    },

    attachmentRemoved: function(attachment){
        if (attachment.isKindOfClass(UITextAttachmentView)){
            attachment.view._setWindowServer(null, true);
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