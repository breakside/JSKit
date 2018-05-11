// #import "Foundation/Foundation.js"
/* global JSClass, JSObject, JSReadOnlyProperty, UIAnimationTransaction, UIDisplayServer, UIDisplayServerInit, UIEvent, JSPoint */
'use strict';

JSClass("UIDisplayServer", JSObject, {

    typesetter: JSReadOnlyProperty("_typesetter"),
    layerDisplayQueue: null,
    layerLayoutQueue: null,
    layerRepositionQueue: null,
    layerAnimationQueue: null,
    _animationCount: 0,
    _animationScale: 1,
    _isUpdating: false,

    init: function(){
        this.layerDisplayQueue = UIDisplayServerQueue();
        this.layerLayoutQueue = UIDisplayServerQueue();
        this.layerRepositionQueue = UIDisplayServerQueue();
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

    windowInserted: function(window){
        this.layerInserted(window.layer);
    },

    windowRemoved: function(window){
        this.layerRemoved(window.layer);
    },

    layerDidChangeProperty: function(layer, keyPath){
        var parts = keyPath.split('.');
        switch (parts[0]){
            case 'position':
            case 'anchorPoint':
                this.setLayerNeedsReposition(layer);
                break;
            default:
                this.setLayerNeedsDisplay(layer);
                break;
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Cycle

    setUpdateNeeded: function(){
        throw new Error("UIDisplayServer.setUpdateNeeded must be implemented by subclass");
    },

    updateDisplay: function(t){
        this._isUpdating = true;
        var completedAnimations = this._updateAnimations(t);
        this._flushLayerLayoutQueue();
        this._flushLayerDisplayQueue();
        this._flushLayerRepositionQueue();
        if (this._animationCount > 0){
            this.setUpdateNeeded();
        }
        this._isUpdating = false;

        // Call any animation callbacks
        for (var i = 0, l = completedAnimations.length; i < l; ++i){
            completedAnimations[i].completionFunction(completedAnimations[i]);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Display

    contextForLayer: function(layer){
        throw new Error("UIDisplayServer.contextForLayer must be implemented by subclass");
    },

    layerNeedsDisplay: function(layer){
        return this.layerDisplayQueue.contains(layer);
    },

    displayLayerIfNeeded: function(layer){
        if (this.layerNeedsDisplay(layer)){
            this.layerDisplayQueue.remove(layer);
            layer.display();
        }
    },

    setLayerNeedsDisplay: function(layer){
        if (!this.layerNeedsDisplay(layer)){
            this.layerDisplayQueue.enqueue(layer);
            if (!this._isUpdating){
                this.setUpdateNeeded();
            }
        }
    },

    _flushLayerDisplayQueue: function(){
        var layer;
        while ((layer = this.layerDisplayQueue.dequeue()) !== null){
            this.displayLayer(layer);
        }
    },

    displayLayer: function(layer){
        layer.display();
    },

    // -------------------------------------------------------------------------
    // MARK: - Position

    setLayerNeedsReposition: function(layer){
        if (!this.layerRepositionQueue.contains(layer)){
            this.layerRepositionQueue.enqueue(layer);
            if (!this._isUpdating){
                this.setUpdateNeeded();
            }
        }
    },

    _flushLayerRepositionQueue: function(){
        var layer;
        while ((layer = this.layerRepositionQueue.dequeue()) !== null){
            this.positionLayer(layer);
        }
    },

    positionLayer: function(layer){
        throw new Error("UIDisplayServer.positionLayer must be implemented by subclass");
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
                this.setUpdateNeeded();
            }
        }
    },

    _flushLayerLayoutQueue: function(){
        var layer;
        while ((layer = this.layerLayoutQueue.dequeue()) !== null){
            layer.layout();
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Animation

    setLayerNeedsAnimation: function(layer){
        if (!(layer.objectID in this.layerAnimationQueue)){
            ++this._animationCount;
        }
        this.layerAnimationQueue[layer.objectID] = layer;
        this.setUpdateNeeded();
    },

    _updateAnimations: function(t){
        t /= this._animationScale;
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
                this.layerDidChangeProperty(layer, key);
            }
            if (layer.animationCount === 0){
                delete this.layerAnimationQueue[id];
                --this._animationCount;
            }
        }
        return completedAnimations;
    }

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