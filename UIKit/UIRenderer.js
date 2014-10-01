// #import "JSKit/JSObject.js"

JSClass("UIRenderer", JSObject, {

    renderQueue: null,
    redrawQueue: null,
    layoutQueue: null,
    animationQueue: null,
    displayFrameID: null,
    _displayFrameBound: null,
    _animationCount: 0,

    init: function(){
        this.renderQueue = {};
        this.redrawQueue = {};
        this.layoutQueue = {};
        this.animationQueue = {};
        this._displayFrameBound = this.displayFrame.bind(this);
    },

    viewInserted: function(view){
    },

    viewRemoved: function(view){
    },

    setViewNeedsRedraw: function(view){
        this.redrawQueue[view.objectID] = view;
        this.requestDisplayFrame();
    },

    setViewNeedsLayout: function(view){
        this.layoutQueue[view.objectID] = view;
        this.requestDisplayFrame();
    },

    redrawViewIfNeeded: function(view){
        if (view.objectID in this.redrawQueue){
            this.drawView(view);
            delete this.redrawQueue[view.objectID];
        }
    },

    drawView: function(view){
        context = this.contextForLayer(view.layer);
        view.drawInContext(context);
    },

    layoutViewIfNeeded: function(view){
        if (view.objectID in this.layoutQueue){
            view.layout();
            delete this.layoutQueue[view.objectID];
        }
    },

    layerInserted: function(layer){
    },

    layerRemoved: function(layer){
    },

    setLayerNeedsRenderForKey: function(layer, key){
        if (!(layer.objectID in this.renderQueue)){
            this.renderQueue[layer.objectID] = {layer: layer, properties: {}};
        }
        this.renderQueue[layer.objectID].properties[key] = true;
        this.requestDisplayFrame();
    },

    setLayerNeedsRedraw: function(layer){
        this.redrawQueue[layer.objectID] = layer;
        this.requestDisplayFrame();
    },

    setLayerNeedsLayout: function(layer){
        this.layoutQueue[layer.objectID] = layer;
        this.requestDisplayFrame();
    },

    setLayerNeedsAnimation: function(layer){
        if (!(layer.objectID in this.animationQueue)){
            ++this._animationCount;
        }
        this.animationQueue[layer.objectID] = layer;
        this.requestDisplayFrame();
    },

    renderLayerIfNeeded: function(layer){
        if (layer.objectID in this.renderQueue){
            if (!UIAnimationTransaction.currentTransaction){
                var properties = this.renderQueue[layer.objectID].properties;
                var context = this.contextForLayer(layer);
                for (var key in properties){
                    this.layerPropertyRenderer[key].call(this, layer, context);
                }
                delete this.renderQueue[layer.objectID];
            }
        }
    },

    redrawLayerIfNeeded: function(layer){
        if (layer.objectID in this.redrawQueue){
            if (!UIAnimationTransaction.currentTransaction){
                context = this.contextForLayer(layer);
                layer.drawInContext(context);
            }
            delete this.displayQueue[layer.objectID];
        }
    },

    layoutLayerIfNeeded: function(layer){
        if (layer.objectID in this.layoutQueue){
            layer.layout();
            delete this.layoutQueue[layer.objectID];
        }
    },

    contextForLayer: function(layer){
    },

    requestDisplayFrame: function(){
    },

    displayFrame: function(t){
        var completedAnimations = this._updateAnimations();
        this._flushLayoutQueue();
        this._flushRenderQueue();
        this._flushRedrawQueue();

        this.displayFrameID = null;
        if (this._animationCount > 0){
            this.requestDisplayFrame();
        }

        // Call any animation callbacks
        for (i = 0, l = completedAnimations.length; i < l; ++i){
            completedAnimations[i].completionFunction(completedAnimations[i]);
        }
    },

    _updateAnimations: function(t){
        var animation;
        var completedAnimations = [];
        var id, key;
        var layer;
        var context;
        for (id in this.animationQueue){
            layer = this.animationQueue[layer];
            context = this.contextForLayer(layer);
            for (key in layer.animationsByKey){
                animation = layer.animationsByKey[key];
                if (!animation.t0){
                    // This is our first time seeing the animation.  We'll set a time marker.
                    animation.t0 = t;
                }
                animation.timeProgress = Math.max(0, Math.min(1, (t - animation.t0) / animation.duration));
                animation.progress = animation.timingFunction(animation.timeProgress);
                if (animation.timeProgress >= 1){
                    layer.removeAnimationForKey(key);
                    layer.presentationLayer[key] = layer.properties[key];
                    if (animation.completionFunction){
                        completedAnimations.push(animation);
                    }
                }else{
                    animation.updateLayer(layer.presentationLayer);
                }
            }
            if (layer.animationCount === 0){
                delete this.animationQueue[id];
                layer.presentationLayer.modelLayer = null;
                layer.presentationLayer = null;
                --this._animationCount;
            }
        }
        return completedAnimations;
    },

    _flushRenderQueue: function(){
        var layer;
        var properties;
        var context;
        for (var id in this.renderQueue){
            layer = this.renderQueue[id].layer;
            context = this.contextForLayer(layer.modelLayer ? layer.modelLayer : layer);
            properties = this.renderQueue[id].properties;
            for (var key in properties){
                this.layerPropertyRenderer[key].call(this, layer, context);
            }
        }
        this.renderQueue = {};
    },

    _flushRedrawQueue: function(){
        var context;
        var layer;
        for (var id in this.redrawQueue){
            layer = this.redrawQueue[id];
            context = this.contextForLayer(layer.modelLayer ? layer.modelLayer : layer);
            layer.drawInContext(context, layer);
        }
        this.redrawQueue = {};
    },

    _flushLayoutQueue: function(){
        for (var id in this.layoutQueue){
            this.layoutQueue[id].layout();
        }
        this.layoutQueue = {};
    }

});

// Lazy init a property, so the first access is a function call, but subsequent accesses are simple values
Object.defineProperty(UIRenderer, 'defaultRenderer', {
    configurable: true,
    enumerable: false,
    get: function(){
        Object.defineProperty(UIRenderer, 'defaultRenderer', {
            configurable: false,
            enumerable: false,
            value: UIRendererInit()
        });
        return UIRenderer.defaultRenderer;
    }
});