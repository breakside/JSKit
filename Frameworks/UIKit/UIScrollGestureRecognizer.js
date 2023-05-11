// Copyright 2022 Breakside Inc.
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

// #import "UIGestureRecognizer.js"
'use strict';

JSClass("UIScrollGestureRecognizer", UIGestureRecognizer, {

    scrollsVertically: JSDynamicProperty("_scrollsVertically", true),
    scrollsHorizontally: JSDynamicProperty("_scrollsHorizontally", true),
    contentOffset: JSDynamicProperty("_contentOffset", null),

    getContentOffset: function(){
        if (this._contentOffset === null){
            this._contentOffset = JSPoint.Zero;
        }
        return this._contentOffset;
    },

    setContentOffset: function(contentOffset){
        this._contentOffset = JSPoint(contentOffset);
    },

    _touchTracking: null,
    _coasting: null,

    _beginTrackingTouches: function(touches, event){
        if (this._state !== UIGestureRecognizer.State.possible){
            this._endCoasting();
            this._setState(UIGestureRecognizer.State.ended);
        }
        var velocity = JSPoint.Zero;
        if (this._coasting !== null){
            velocity = this._coasting.velocity;
        }
        var touch = touches[0];
        var location = touch.locationInWindow;
        this._touchTracking = {
            identifier: touch.identifier,
            startingLocation: JSPoint(location),
            location: location,
            contentOffset: JSPoint(this.contentOffset),
            timestamp: event.timestamp,
            startingVelocity: velocity,
            velocity: velocity
        };
        this._setState(UIGestureRecognizer.State.began);
    },

    _endTrackingTouches: function(){
        this._touchTracking = null;
    },

    _beginCoasting: function(velocity){
        this._coasting = {
            timestamp: -1,
            displayServer: this.view.layer._displayServer,
            velocity: velocity
        };
        this._coasting.displayServer.schedule(this._displayUpdate, this);
    },

    _endCoasting: function(){
        this._coasting = null;
    },

    touchesBegan: function(touches, event){
        if (!this._scrollsVertically && !this._scrollsHorizontally){
            return;
        }
        if (this._touchTracking !== null){
            if (event.touchForIdentifier(this._touchTracking.identifier) !== null){
                return;
            }
        }
        this._beginTrackingTouches(touches, event);
    },

    touchesMoved: function(touches, event){
        if (!this._scrollsVertically && !this._scrollsHorizontally){
            return;
        }
        if (this._touchTracking === null){
            this._beginTrackingTouches(touches, event);
            if (this._touchTracking === null){
                return;
            }
        }
        var touch = event.touchForIdentifier(this._touchTracking.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        var location = touch.locationInWindow;
        var delta = location.subtracting(this._touchTracking.startingLocation);
        if (!this._scrollsVertically){
            delta.y = 0;
        }
        if (!this._scrollsHorizontally){
            delta.x = 0;
        }
        var offset = this._touchTracking.contentOffset.subtracting(delta);
        offset.x = Math.round(offset.x);
        offset.y = Math.round(offset.y);
        delta = location.subtracting(this._touchTracking.location);
        if (!this._scrollsVertically){
            delta.y = 0;
        }
        if (!this._scrollsHorizontally){
            delta.x = 0;
        }
        var dt = event.timestamp - this._touchTracking.timestamp;
        this._touchTracking.location = location;
        this._touchTracking.timestamp = event.timestamp;
        if (dt > 0){
            this._touchTracking.velocity = JSPoint(delta.x / dt, delta.y / dt);
        }
        if (!this.contentOffset.isEqual(offset)){
            this.contentOffset = offset;
            this._setState(UIGestureRecognizer.State.changed);
        }
    },

    touchesEnded: function(touches, event){
        if (!this._scrollsVertically && !this._scrollsHorizontally){
            return;
        }
        if (this._touchTracking === null){
            return;
        }
        var touch = event.touchForIdentifier(this._touchTracking.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        var dt = event.timestamp - this._touchTracking.timestamp;
        if (dt < 0.05){
            this._beginCoasting(this._touchTracking.velocity);
        }else{
            this._setState(UIGestureRecognizer.State.ended);
        }
        this._endTrackingTouches();
    },

    touchesCanceled: function(touches, event){
        if (!this._scrollsVertically && !this._scrollsHorizontally){
            return;
        }
        if (this._touchTracking === null){
            return;
        }
        var touch = event.touchForIdentifier(this._touchTracking.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        this._endTrackingTouches();
        this._setState(UIGestureRecognizer.State.ended);
    },

    _displayUpdate: function(t){
        if (this._coasting === null){
            return;
        }
        if (this._coasting.timestamp < 0){
            this._coasting.timestamp = t;
            this._coasting.displayServer.schedule(this._displayUpdate, this);
            return;
        }
        if (this.view.window === null){
            this._endCoasting();
            return;
        }
        if ((this._scrollsHorizontally && Math.abs(this._coasting.velocity.x) >= 10) || (this._scrollsVertically && (Math.abs(this._coasting.velocity.y) >= 10))){
            var dt = t - this._coasting.timestamp;
            this._coasting.timestamp = t;
            var delta = JSPoint(this._coasting.velocity.x * dt, this._coasting.velocity.y * dt);
            var offset = this.contentOffset.subtracting(delta);
            offset.x = Math.round(offset.x);
            offset.y = Math.round(offset.y);
            this.contentOffset = offset;
            this._coasting.velocity.x *= 0.97;
            this._coasting.velocity.y *= 0.97;
            this._coasting.displayServer.schedule(this._displayUpdate, this);
            this._setState(UIGestureRecognizer.State.changed);
        }else{
            this._endCoasting();
            this._setState(UIGestureRecognizer.State.ended);
        }
    },

});