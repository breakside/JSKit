// #import "JSKit/JSObject.js"

JSClass("UIRenderer", JSObject, {

    layoutQueue: null,
    displayQueue: null,
    animations: null,
    displayFrameID: null,
    _displayFrameBound: null,

    init: function(){
        this.animations = [];
        this.displayQueue = [];
        this.layoutQueue = [];
        this._displayFrameBound = this.displayFrame.bind(this);
    },

    viewInserted: function(view){
    },

    viewRemoved: function(view){
    },

    layerInserted: function(layer){
    },

    layerRemoved: function(layer){
    },

    requestDisplayFrame: function(){
    },

    displayFrame: function(t){
        // Start by updating any animations
        var animation;
        var callbacks = [];
        var i, l;
        var id, key;
        // We'll count backwards here because we might remove elements from the array while looping.
        // Couting backwards ensures the removal won't mess up the iteration
        for (i = this.animations.length - 1; i >= 0; --i){
            animation = this.animations[i];
            if (!animation.t0){
                animation.t0 = t;
            }
            animation.timeProgress = Math.max(0, Math.min(1, (t - animation.t0) / animation.duration));
            animation.progress = animation.timingFunction(animation.timeProgress);
            var entry;
            var property;
            if (animation.timeProgress >= 1){
                for (id in animation.queue){
                    entry = animation.queue[id];
                    for (key in entry.properties){
                        property = entry.properties[key];
                        entry.layer._clearAnimationValueForKey(key);
                    }
                }
                var index = this.animations.indexOf(animation);
                if (index >= 0){
                    this.animations.splice(index, 1);
                }
                if (animation.callback){
                    callbacks.push(animation.callback);
                }
            }else{
                for (id in animation.queue){
                    entry = animation.queue[id];
                    for (key in entry.properties){
                        property = entry.properties[key];
                        entry.layer.presentationLayer[key] = property.interpolate(animation.timeProgress, animation.progress);
                    }
                }
            }
        }

        // Then flush the layout queue
        for (id in this.layoutQueue){
            this.layoutQueue[id]._layout();
        }
        this.layoutQueue = {};

        // Then flush the display queue
        for (id in this.displayQueue){
            this.displayQueue[id]._display();
        }
        this.displayQueue = {};

        // Request a new frame if still animating
        this.displayFrameRequestID = null;
        if (this.animations.length > 0){
            this.requestDisplayFrame();
        }

        // Call any animation callbacks
        for (i = 0, l = callbacks.length; i < l; ++i){
            callbacks[i]();
        }
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
            value: UIRenderer.environmentRenderers[UIViewRenderingEnvironment]
        });
        return UIRenderer.defaultRenderer;
    }
});

UIRenderer.environmentRenderers = {};