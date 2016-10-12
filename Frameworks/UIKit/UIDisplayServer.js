// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIAnimationTransaction, UIDisplayServer, UIDisplayServerInit, UIEvent, JSPoint */
'use strict';

JSClass("UIDisplayServer", JSObject, {

    layerDisplayQueue: null,
    layerLayoutQueue: null,
    viewLayoutQueue: null,
    layerAnimationQueue: null,
    _animationCount: 0,

    init: function(){
        this.layerDisplayQueue = {};
        this.layerLayoutQueue = {};
        this.viewLayoutQueue = {};
        this.layerAnimationQueue = {};
    },

    // -------------------------------------------------------------------------
    // MARK: Notifications

    layerInserted: function(layer){
        throw new Error("UIDisplayServer.layerInserted must be implemented by subclass");
    },

    layerRemoved: function(layer){
        throw new Error("UIDisplayServer.layerRemoved must be implemented by subclass");
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Cycle

    setDisplayNeeded: function(){
        throw new Error("UIDisplayServer.setDisplayNeeded must be implemented by subclass");
    },

    updateDisplay: function(t){
        var completedAnimations = this._updateAnimations(t);
        this._flushViewLayoutQueue();
        this._flushLayerLayoutQueue();
        this._flushLayerDisplayQueue();

        if (this._animationCount > 0){
            this.setDisplayNeeded();
        }

        // Call any animation callbacks
        for (var i = 0, l = completedAnimations.length; i < l; ++i){
            completedAnimations[i].completionFunction(completedAnimations[i]);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Layer Display Updates

    setLayerNeedsDisplay: function(layer){
        if (!(layer.objectID in this.layerDisplayQueue)){
            this.layerDisplayQueue[layer.objectID] = {layer: layer, properties: {}, redraw: true};
        }else{
            this.layerDisplayQueue[layer.objectID].redraw = true;
        }
        this.setDisplayNeeded();
    },

    setLayerNeedsDisplayForProperty: function(layer, keyPath){
        if (!(layer.objectID in this.layerDisplayQueue)){
            this.layerDisplayQueue[layer.objectID] = {layer: layer, properties: {}};
        }
        this.layerDisplayQueue[layer.objectID].properties[keyPath] = true;
        this.setDisplayNeeded();
    },

    layerNeedsDisplay: function(layer){
        return (layer.objectID in this.layerDisplayQueue);
    },

    displayLayerIfNeeded: function(layer){
        if (this.layerNeedsDisplay()){
            this._displayLayerQueueEntry(this.layerDisplayQueue[layer.objectID]);
            delete this.layerDisplayQueue[layer.objectID];
        }
    },

    _flushLayerDisplayQueue: function(){
        for (var id in this.layerDisplayQueue){
            this._displayLayerQueueEntry(this.layerDisplayQueue[id]);
        }
        this.layerDisplayQueue = {};
    },

    _displayLayerQueueEntry: function(entry){
        throw new Error("UIDisplayServer._displayLayerQueueEntry must be implemented by subclass");
    },

    // -------------------------------------------------------------------------
    // MARK: - Animation

    setLayerNeedsAnimation: function(layer){
        if (!(layer.objectID in this.layerAnimationQueue)){
            ++this._animationCount;
        }
        this.layerAnimationQueue[layer.objectID] = layer;
        this.setDisplayNeeded();
    },

    _updateAnimations: function(t){
        var animation;
        var completedAnimations = [];
        var id, key;
        var layer;
        for (id in this.layerAnimationQueue){
            layer = this.layerAnimationQueue[id];
            for (key in layer.animationsByKey){
                animation = layer.animationsByKey[key];
                animation.updateForTime(t);
                if (animation.isComplete){
                    layer.removeAnimationForKey(key);
                    if (animation.completionFunction){
                        completedAnimations.push(animation);
                    }
                }
                this.setLayerNeedsDisplayForProperty(layer, animation.keyPath);
            }
            if (layer.animationCount === 0){
                delete this.layerAnimationQueue[id];
                --this._animationCount;
            }
        }
        return completedAnimations;
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    setViewNeedsLayout: function(view){
        this.viewLayoutQueue[view.objectID] = view;
        this.setDisplayNeeded();
    },

    setLayerNeedsLayout: function(layer){
        this.layerLayoutQueue[layer.objectID] = layer;
        this.setDisplayNeeded();
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
    },

});

// Lazy init a property, so the first access is a function call, but subsequent accesses are simple values
Object.defineProperty(UIDisplayServer, 'defaultServer', {
    configurable: true,
    enumerable: false,
    get: function UIDisplayServer_lazyInitDefaultRenderer(){
        Object.defineProperty(UIDisplayServer, 'defaultServer', {
            configurable: false,
            enumerable: false,
            value: UIDisplayServerInit()
        });
        return UIDisplayServer.defaultServer;
    }
});