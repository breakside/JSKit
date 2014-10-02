// #import "JSKit/JSKit.js"

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

    setLayerNeedsRenderForKeyPath: function(layer, keyPath){
        if (!(layer.objectID in this.renderQueue)){
            this.renderQueue[layer.objectID] = {layer: layer, properties: {}};
        }
        this.renderQueue[layer.objectID].properties[keyPath] = true;
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
            var context = this.contextForLayer(layer);
            this._renderLayerInContext(layer, context);
        }
    },

    _renderLayerInContext: function(layer, context){
        var properties = this.renderQueue[layer.objectID].properties;
        for (var keyPath in properties){
            this.layerPropertyRenderer[keyPath].call(this, layer, context);
        }
        delete this.renderQueue[layer.objectID];
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
        var completedAnimations = this._updateAnimations(t);
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
            layer = this.animationQueue[id];
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
            if (layer.objectID in this.renderQueue){
                this._renderLayerInContext(layer, context);
            }
            if (layer.animationCount === 0){
                delete this.animationQueue[id];
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
            for (var keyPath in properties){
                this.layerPropertyRenderer[keyPath].call(this, layer, context);
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
    get: function UIRenderer_lazyInitDefaultRenderer(){
        Object.defineProperty(UIRenderer, 'defaultRenderer', {
            configurable: false,
            enumerable: false,
            value: UIRendererInit()
        });
        return UIRenderer.defaultRenderer;
    }
});