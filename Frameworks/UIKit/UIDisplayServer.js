// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, UIAnimationTransaction, UIDisplayServer, UIDisplayServerInit, UIEvent, JSPoint */
'use strict';

JSClass("UIDisplayServer", JSObject, {

    layerDisplayQueue: null,
    layerLayoutQueue: null,
    viewLayoutQueue: null,
    layerAnimationQueue: null,
    _animationCount: 0,
    _isUpdating: false,

    init: function(){
        this.layerDisplayQueue = {};
        this.layerLayoutQueue = UIDisplayServerQueue();
        this.viewLayoutQueue = UIDisplayServerQueue();
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
        this._isUpdating = true;
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
        this._isUpdating = false;
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

    layerNeedsLayout: function(layer){
        return this.layerLayoutQueue.contains(layer);
    },

    layoutLayerIfNeeded: function(layer){
        if (this.layerNeedsLayout(layer)){
            this.layerLayoutQueue.remove(layer);
            layer.layout();
        }
    },

    setLayerNeedsLayout: function(layer){
        if (!this.layerNeedsLayout(layer)){
            this.layerLayoutQueue.enqueue(layer);
            if (!this._isUpdating){
                this.setDisplayNeeded();
            }
        }
    },

    viewNeedsLayout: function(view){
        return this.viewLayoutQueue.contains(view);
    },

    layoutViewIfNeeded: function(view){
        if (this.viewNeedsLayout(view)){
            this.viewLayoutQueue.remove(view);
            view.layout();
        }
    },

    setViewNeedsLayout: function(view){
        if (!this.viewNeedsLayout(view)){
            this.viewLayoutQueue.enqueue(view);
            if (!this._isUpdating){
                this.setDisplayNeeded();
            }
        }
    },

    _flushLayerLayoutQueue: function(){
        var layer;
        while ((layer = this.layerLayoutQueue.dequeue()) !== null){
            layer.layout();
        }
    },

    _flushViewLayoutQueue: function(){
        var view;
        while ((view = this.viewLayoutQueue.dequeue()) !== null){
            view.layout();
        }
    },

});

function UIDisplayServerQueueItem(value){
    if (this === undefined){
        return new UIDisplayServerQueueItem(value);
    }
    this.value = value;
}

UIDisplayServerQueueItem.prototype = {
    prev: null,
    next: null,
    value: null,

    unlink: function(){
        if (this.prev !== null){
            this.prev.next = this.next;
        }
        if (this.next !== null){
            this.next.prev = this.prev;
        }
        this.prev = null;
        this.next = null;
    },

    link: function(next){
        if (this.next !== null){
            this.next.prev = next;
        }
        this.next = next;
        next.prev = this;
    }
};

function UIDisplayServerQueue(){
    if (this === undefined){
        return new UIDisplayServerQueue();
    }
    this.map = {};
}

UIDisplayServerQueue.prototype = {

    first: null,
    last: null,
    map: null,

    enqueue: function(value){
        var link = new UIDisplayServerQueueItem(value);
        if (this.first === null){
            this.first = link;
            this.last = link;
        }else{
            this.last.link(link);
            this.last = link;
        }
        this.map[value.objectID] = link;
    },

    dequeue: function(){
        if (this.first === null){
            return null;
        }
        var link = this.first;
        this._removeLink(link);
        return link.value;
    },

    contains: function(value){
        return (value.objectID in this.map);
    },

    remove: function(value){
        var link = this.map[value.objectID];
        this._removeLink(link);
    },

    _removeLink: function(link){
        if (link === this.first){
            this.first = link.next;
        }
        if (link === this.last){
            this.last = link.prev;
        }
        link.unlink();
        delete this.map[link.value.objectID];
    }

};

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