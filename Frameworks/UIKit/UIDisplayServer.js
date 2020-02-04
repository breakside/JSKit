// #import Foundation
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
    _scheduleQueue: null,
    _scheduled: null,

    init: function(){
        this.layerDisplayQueue = UIDisplayServerQueue();
        this.layerLayoutQueue = UIDisplayServerQueue();
        this.layerRepositionQueue = UIDisplayServerQueue();
        this.windowInsertedQueue = UIDisplayServerQueue();
        this.windowRemovalQueue = UIDisplayServerQueue();
        this.layerAnimationQueue = {};
        this._scheduleQueue = [];
        this._scheduled = [];
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
        this.windowInsertedQueue.enqueue(window);
        this.windowRemovalQueue.remove(window);
    },

    windowRemoved: function(window){
        this.layerRemoved(window.layer);
        this.windowRemovalQueue.enqueue(window);
        this.windowInsertedQueue.remove(window);
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

    stop: function(){
        Object.defineProperty(this, 'setUpdateNeeded', {
            value: function UIDisplayServer_setUpdateNeeded_stopped(){}
        });
    },

    // -------------------------------------------------------------------------
    // MARK: - Display Cycle

    setUpdateNeeded: function(){
        throw new Error("UIDisplayServer.setUpdateNeeded must be implemented by subclass");
    },

    updateDisplay: function(t){
        this._scheduled = this._scheduleQueue;
        this._scheduleQueue = [];
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

        // Call any window insert/remove callbacks
        var window;
        while ((window = this.windowRemovalQueue.dequeue()) !== null){
            window.didClose();
        }
        while ((window = this.windowInsertedQueue.dequeue()) !== null){
            window.didBecomeVisible();
        }

        this._flushScheduled(t);
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

    _removeLayerFromUpdateQueues: function(layer){
        this.layerLayoutQueue.remove(layer);
        this.layerDisplayQueue.remove(layer);
        this.layerRepositionQueue.remove(layer);
        if (layer.objectID in this.layerAnimationQueue){
            delete this.layerAnimationQueue[layer.objectID];
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
                var parts = key.split('.');
                if (parts[0] in layer.presentation){
                    this.layerDidChangeProperty(layer, key);
                }
            }
            if (layer.animationCount === 0){
                delete this.layerAnimationQueue[id];
                --this._animationCount;
            }
        }
        return completedAnimations;
    },

    // -------------------------------------------------------------------------
    // MARK: - Fonts

    registerFontDescriptors: function(descriptors, completion, target){
        if (descriptors.length === 0){
            completion.call(target);
            return;
        }
        var remaining = descriptors.length;
        var handleRegistration = function(){
            --remaining;
            if (remaining === 0){
                completion.call(target);
            }
        };
        for (var i = 0, l = descriptors.length; i < l; ++i){
            this.registerFontDescriptor(descriptors[i], handleRegistration, this);
        }
    },

    registerFontDescriptor: function(descriptor, completion, target){

    },

    // -------------------------------------------------------------------------
    // MARK: - Callbacks

    schedule: function(callback, target){
        this._scheduleQueue.push({fn: callback, target: target});
        this.setUpdateNeeded();
    },

    _flushScheduled: function(t){
        if (!this._scheduled.length){
            return;
        }
        var callback;
        for (var i = 0, l = this._scheduled.length; i < l; ++i){
            callback = this._scheduled[i];
            callback.fn.call(callback.target, t);
        }
        this._scheduled = [];
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
        if (!this.contains(value)){
            return;
        }
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