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

// #import Foundation
'use strict';

(function(){

JSClass("UIDisplayServer", JSObject, {

    typesetter: JSReadOnlyProperty("_typesetter"),
    layerDisplayQueue: null,
    layerLayoutQueue: null,
    layerRepositionQueue: null,
    layerAnimationQueue: null,
    reducedMotionEnabled: false,
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
        this._completedAnimations = [];
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

    stopped: false,

    stop: function(){
        if (!this.stopped){
            return;
        }
        this.stopped = true;
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
        this._updateAnimations(t);
        this._flushLayerLayoutQueue();
        this._flushLayerDisplayQueue();
        this._flushLayerRepositionQueue();
        if (this._animationCount > 0){
            this.setUpdateNeeded();
        }
        this._isUpdating = false;

        // Call any animation callbacks
        this._flushCompletedAnimations();

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
            if (layer.superlayer !== null && this.layerLayoutQueue.contains(layer.superlayer)){
                this.layerLayoutQueue.enqueue(layer);
            }else{
                layer.layout();   
            }
        }
    },

    _removeLayerFromUpdateQueues: function(layer){
        if (this.layerLayoutQueue.remove(layer)){
            layer._needsLayout = true;
        }
        if (this.layerDisplayQueue.remove(layer)){
            layer._needsDisplay = true;
        }
        var key;
        var animation;
        var completedAnimationKeys;
        var i, l;
        this.layerRepositionQueue.remove(layer);
        if (layer.objectID in this.layerAnimationQueue){
            completedAnimationKeys = [];
            for (key in layer.animationsByKey){
                animation = layer.animationsByKey[key];
                this.completeAnimation(animation);
                completedAnimationKeys.push(key);
            }
            for (i = 0, l = completedAnimationKeys.length; i < l; ++i){
                key = completedAnimationKeys[i];
                layer.removeAnimationForKey(key);
            }
            delete this.layerAnimationQueue[layer.objectID];
            --this._animationCount;
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

    _completedAnimations: null,

    completeAnimation: function(animation){
        this._completedAnimations.push(animation);
    },

    _flushCompletedAnimations: function(){
        var i, l;
        var animation;
        for (i = 0, l = this._completedAnimations.length; i < l; ++i){
            animation = this._completedAnimations[i];
            if (animation.completionFunction){
                animation.completionFunction(animation);
            }
        }
        this._completedAnimations = [];
    },

    _updateAnimations: function(t){
        t /= this._animationScale;
        var animation;
        var id, key;
        var layer;
        var completedAnimationKeys;
        var i, l;
        var parts;
        for (id in this.layerAnimationQueue){
            layer = this.layerAnimationQueue[id];
            completedAnimationKeys = [];
            for (key in layer.animationsByKey){
                animation = layer.animationsByKey[key];
                animation.updateForTime(t);
                if (this.reducedMotionEnabled || animation.isComplete){
                    if (this.reducedMotionEnabled){
                        animation.percentComplete = 1;
                    }
                    completedAnimationKeys.push(key);
                }else{
                    parts = key.split('.');
                    if (parts[0] in layer.presentation){
                        this.layerDidChangeProperty(layer, key);
                    }
                }
            }
            for (i = 0, l = completedAnimationKeys.length; i < l; ++i){
                key = completedAnimationKeys[i];
                animation = layer.animationsByKey[key];
                layer.removeAnimationForKey(key);
                this.completeAnimation(animation);
                parts = key.split('.');
                if (parts[0] in layer.presentation){
                    this.layerDidChangeProperty(layer, key);
                }
            }
            if (layer.animationCount === 0){
                delete this.layerAnimationQueue[id];
                --this._animationCount;
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Fonts

    registerFontDescriptors: function(descriptors, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        if (descriptors.length === 0){
            completion.call(target, null);
        }else{
            var remaining = descriptors.length;
            var firstError = null;
            var handleRegistration = function(error){
                if (error !== null && firstError === null){
                    firstError = error;
                }
                --remaining;
                if (remaining === 0){
                    completion.call(target, firstError);
                }
            };
            for (var i = 0, l = descriptors.length; i < l; ++i){
                this.registerFontDescriptor(descriptors[i], handleRegistration, this);
            }
        }
        return completion.promise;
    },

    registerFontDescriptor: function(descriptor, completion, target){
        completion.call(target, null);
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
            return false;
        }
        var link = this.map[value.objectID];
        this._removeLink(link);
        return true;
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

})();