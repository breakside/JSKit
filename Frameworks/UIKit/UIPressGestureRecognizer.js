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

// #import "UIGestureRecognizer.js"
'use strict';

JSClass("UIPressGestureRecognizer", UIGestureRecognizer, {

    init: function(){
        UIPressGestureRecognizer.$super.init.call(this);
        this.minimumPressInterval = UIPressGestureRecognizer.PressInterval.long;
    },

    initWithSpec: function(spec){
        UIPressGestureRecognizer.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("minimumPressInterval")){
            this.minimumPressInterval = spec.valueForKey("minimumPressInterval");
        }else{
            this.minimumPressInterval = UIPressGestureRecognizer.PressInterval.long;
        }
    },

    minimumPressInterval: 0,

    // MARK: - Events

    _firstTouchInfo: null,

    touchesBegan: function(touches, event){
        if (this._state === UIGestureRecognizer.State.possible){
            if (touches.length === 1 && event.touches.length === 1){
                var touch = touches[0];
                this._firstTouchInfo = {
                    identifier: touch.identifier,
                    location: touch.locationInWindow,
                    timer: JSTimer.scheduledTimerWithInterval(this.minimumPressInterval, this.minimumTimeReached, this)
                };
                this._setState(UIGestureRecognizer.State.began);
            }
        }else{
            this.end(UIGestureRecognizer.State.failed);
        }
    },

    minimumTimeReached: function(timer){
        this._firstTouchInfo = null;
        this._setState(UIGestureRecognizer.State.recognized);
    },

    end: function(state){
        if (this._firstTouchInfo !== null){
            if (this._firstTouchInfo.timer !== null){
                this._firstTouchInfo.timer.invalidate();
            }
            this._firstTouchInfo = null;
        }
        this._setState(state);
    },

    touchesMoved: function(touches, event){
        if (this._firstTouchInfo === null){
            return;
        }
        var touch = event.touchForIdentifier(this._firstTouchInfo.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        var location = touch.locationInView(this.view);
        var distance = location.distanceToPoint(this.beganLocation);
        if (distance > 10){
            this.end(UIGestureRecognizer.State.failed);
        }
    },

    touchesEnded: function(touches, event){
        if (this._firstTouchInfo === null){
            return;
        }
        var touch = event.touchForIdentifier(this._firstTouchInfo.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        this.end(UIGestureRecognizer.State.cancled);
    },

    touchesCanceled: function(touches, event){
        if (this._firstTouchInfo === null){
            return;
        }
        var touch = event.touchForIdentifier(this._firstTouchInfo.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        this.end(UIGestureRecognizer.State.failed);
    }

});

UIPressGestureRecognizer.PressInterval = {
    long: 1
};