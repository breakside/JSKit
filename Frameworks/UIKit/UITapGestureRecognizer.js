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

JSClass("UITapGestureRecognizer", UIGestureRecognizer, {

    // MARK: - Events

    _firstTouchInfo: null,

    touchesBegan: function(touches, event){
        if (this._state === UIGestureRecognizer.State.possible){
            if (touches.length === 1 && event.touches.length === 1){
                var touch = touches[0];
                this._firstTouchInfo = {
                    identifier: touch.identifier,
                    location: JSPoint(touch.locationInWindow)
                };
                this._setState(UIGestureRecognizer.State.began);
            }
        }else{
            this._firstTouchInfo = null;
            this._setState(UIGestureRecognizer.State.failed);
        }
    },

    touchesMoved: function(touches, event){
        if (this._firstTouchInfo === null){
            return;
        }
        var touch = event.touchForIdentifier(this._firstTouchInfo.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        var distance = touch.locationInWindow.distanceToPoint(this._firstTouchInfo.location);
        if (distance > 10){
            this._firstTouchInfo = null;
            this._setState(UIGestureRecognizer.State.failed);
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
        this._firstTouchInfo = null;
        this._setState(UIGestureRecognizer.State.recognized);
    },

    touchesCanceled: function(touches, event){
        if (this._firstTouchInfo === null){
            return;
        }
        var touch = event.touchForIdentifier(this._firstTouchInfo.identifier);
        if (touches.indexOf(touch) < 0){
            return;
        }
        this._firstTouchInfo = null;
        this._setState(UIGestureRecognizer.State.failed);
    }

});