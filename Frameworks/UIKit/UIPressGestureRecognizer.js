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

    began: false,
    beganLocation: null,
    beganTouchID: null,
    pressTimer: null,

    touchesBegan: function(touches, event){
        if (this.began){
            return;
        }
        this.began = true;
        if (this._state === UIGestureRecognizer.State.possible){
            if (touches.length === 1){
                this.beganTouchID = touches[0].identifier;
                this.beganLocation = touches[0].locationInView(this.view);
                this.pressTimer = JSTimer.scheduledTimerWithInterval(this.minimumPressInterval, this.minimumTimeReached, this);
                this._setState(UIGestureRecognizer.State.began);
            }
        }else{
            this._setState(UIGestureRecognizer.State.failed);
        }
    },

    minimumTimeReached: function(timer){
        this._setState(UIGestureRecognizer.State.recognized);
        this.pressTimer = null;
    },

    end: function(state){
        if (this.pressTimer !== null){
            this.pressTimer.invalidate();
            this.pressTimer = null;
        }
        this._setState(UIGestureRecognizer.State.failed);
    },

    touchesMoved: function(touches, event){
        if (this._state === UIGestureRecognizer.State.possible){
            return;
        }
        var touch = event.touchForIdentifier(this.beganTouchID);
        if (touch === null){
            this.end(UIGestureRecognizer.State.failed);
            return;
        }
        var location = touch.locationInView(this.view);
        var distance = location.distanceToPoint(this.beganLocation);
        if (distance > 10){
            this.end(UIGestureRecognizer.State.failed);
        }
    },

    touchesEnded: function(touches, event){
        var beganTouchID = this.beganTouchID;
        this.began = false;
        this.beganLocation = null;
        this.beganTouchID = null;
        if (this._state === UIGestureRecognizer.State.possible){
            return;
        }
        var touch = event.touchForIdentifier(beganTouchID);
        if (touch === null){
            this.end(UIGestureRecognizer.State.failed);
            return;
        }
        this.end(UIGestureRecognizer.State.cancled);
    },

    touchesCanceled: function(touches, event){
        this.began = false;
        this.beganLocation = null;
        this.beganTouchID = null;
        if (this._state === UIGestureRecognizer.State.possible){
            return;
        }
        this.end(UIGestureRecognizer.State.failed);
    }

});

UIPressGestureRecognizer.PressInterval = {
    long: 1
};