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

JSClass("UITouch", JSObject, {

    identifier: JSReadOnlyProperty('_identifier', 0),
    phase: JSReadOnlyProperty('_phase', 0),
    timestamp: JSReadOnlyProperty('_timestamp', 0),
    window: JSReadOnlyProperty('_window', null),
    locationInWindow: JSReadOnlyProperty('_locationInWindow', null),

    initWithIdentifier: function(identifier, timestamp, window, location){
        this._identifier = identifier;
        this._phase = UITouch.Phase.began;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
    },

    update: function(phase, timestamp, window, location){
        this._phase = phase;
        this._timestamp = timestamp;
        this._window = window;
        this._locationInWindow = location;
    },

    locationInView: function(view){
        return this.window.convertPointToView(this._locationInWindow, view);
    },

    isActive: function(){
        return this.phase == UITouch.Phase.began || this.phase == UITouch.Phase.moved;
    }

});

UITouch.Phase = {
    began: 0,
    moved: 1,
    ended: 2,
    canceled: 3
};