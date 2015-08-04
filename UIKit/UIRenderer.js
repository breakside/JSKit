// #import "JSKit/JSKit.js"
/* global JSClass, JSObject, UIAnimationTransaction, UIRenderer, UIRendererInit */
'use strict';

JSClass("UIRenderer", JSObject, {

    layerRenderQueue: null,
    layerRedrawQueue: null,
    layerLayoutQueue: null,
    viewLayoutQueue: null,
    layerAnimationQueue: null,
    _animationCount: 0,
    keyWindow: null,

    init: function(){
        this.layerRenderQueue = {};
        this.layerRedrawQueue = {};
        this.layerLayoutQueue = {};
        this.viewLayoutQueue = {};
        this.layerAnimationQueue = {};
    },

    makeKeyWindow: function(window){
        this.keyWindow = window;
    },

    setDisplayNeeded: function(){
        throw new Error("UIRenderer.setDisplayNeeded must be implemented by subclass");
    },

    viewInserted: function(view){
        throw new Error("UIRenderer.viewInserted must be implemented by subclass");
    },

    viewRemoved: function(view){
        throw new Error("UIRenderer.viewRemoved must be implemented by subclass");
    },

    layerInserted: function(layer){
        throw new Error("UIRenderer.layerInserted must be implemented by subclass");
    },

    layerRemoved: function(layer){
        throw new Error("UIRenderer.layerRemoved must be implemented by subclass");
    },

    contextForLayer: function(layer){
        throw new Error("UIRenderer.contextForLayer must be implemented by subclass");
    },

    setLayerNeedsRedraw: function(layer){
        this.layerRedrawQueue[layer.objectID] = layer;
        this.setDisplayNeeded();
    },

    setLayerNeedsLayout: function(layer){
        this.layerLayoutQueue[layer.objectID] = layer;
        this.setDisplayNeeded();
    },

    setLayerNeedsRenderForKeyPath: function(layer, keyPath){
        if (!(layer.objectID in this.layerRenderQueue)){
            this.layerRenderQueue[layer.objectID] = {layer: layer, properties: {}};
        }
        this.layerRenderQueue[layer.objectID].properties[keyPath] = true;
        this.setDisplayNeeded();
    },

    setLayerNeedsAnimation: function(layer){
        if (!(layer.objectID in this.layerAnimationQueue)){
            ++this._animationCount;
        }
        this.layerAnimationQueue[layer.objectID] = layer;
        this.setDisplayNeeded();
    },

    setViewNeedsLayout: function(view){
        this.viewLayoutQueue[view.objectID] = view;
        this.setDisplayNeeded();
    },

    _renderLayerInContext: function(layer, context){
        var properties = this.layerRenderQueue[layer.objectID].properties;
        for (var keyPath in properties){
            this.layerPropertyRenderer[keyPath].call(this, layer, context);
        }
        delete this.layerRenderQueue[layer.objectID];
    },

    redrawLayerIfNeeded: function(layer){
        if (layer.objectID in this.layerRedrawQueue){
            if (!UIAnimationTransaction.currentTransaction){
                var context = this.contextForLayer(layer);
                layer.drawInContext(context);
            }
            delete this.displayQueue[layer.objectID];
        }
    },

    layoutLayerIfNeeded: function(layer){
        if (layer.objectID in this.layerLayoutQueue){
            layer.layout();
            delete this.layerLayoutQueue[layer.objectID];
        }
    },

    updateDisplay: function(t){
        var completedAnimations = this._updateAnimations(t);
        this._flushViewLayoutQueue();
        this._flushLayerLayoutQueue();
        this._flushLayerRenderQueue();
        this._flushLayerRedrawQueue();

        if (this._animationCount > 0){
            this.setDisplayNeeded();
        }

        // Call any animation callbacks
        for (var i = 0, l = completedAnimations.length; i < l; ++i){
            completedAnimations[i].completionFunction(completedAnimations[i]);
        }
    },

    _updateAnimations: function(t){
        var animation;
        var completedAnimations = [];
        var id, key;
        var layer;
        var context;
        for (id in this.layerAnimationQueue){
            layer = this.layerAnimationQueue[id];
            context = this.contextForLayer(layer);
            for (key in layer.animationsByKey){
                animation = layer.animationsByKey[key];
                animation.updateForTime(t);
                if (animation.isComplete){
                    layer.removeAnimationForKey(key);
                    if (animation.completionFunction){
                        completedAnimations.push(animation);
                    }
                }
                this.setLayerNeedsRenderForKeyPath(layer, animation.keyPath);
            }
            if (layer.animationCount === 0){
                delete this.layerAnimationQueue[id];
                --this._animationCount;
            }
        }
        return completedAnimations;
    },

    _flushLayerRenderQueue: function(){
        var layer;
        var properties;
        var context;
        for (var id in this.layerRenderQueue){
            layer = this.layerRenderQueue[id].layer;
            context = this.contextForLayer(layer);
            layer.renderInContext(context);
        }
        this.layerRenderQueue = {};
    },

    _flushLayerRedrawQueue: function(){
        var context;
        var layer;
        for (var id in this.layerRedrawQueue){
            layer = this.layerRedrawQueue[id];
            context = this.contextForLayer(layer);
            layer.drawInContext(context);
        }
        this.layerRedrawQueue = {};
    },

    _flushLayerLayoutQueue: function(){
        for (var id in this.layerLayoutQueue){
            this.layerLayoutQueue[id].layout();
        }
        this.layerLayoutQueue = {};
    },

    _flushViewLayoutQueue: function(){
        for (var id in this.viewLayoutQueue){
            this.viewLayoutQueue[id].layout();
        }
        this.viewLayoutQueue = {};
    }

});

// Lazy init a property, so the first access is a function call, but subsequent accesses are simple values
Object.defineProperty(UIRenderer, 'defaultRenderer', {
    configurable: true,
    enumerable: false,
    get: function UIRenderer_lazyInitDefaultRenderer(){
        Object.defineProperty(UIRenderer, 'defaultRenderer', {
            configurable: false,
            enumerable: false,
            value: UIRendererInit()
        });
        return UIRenderer.defaultRenderer;
    }
});