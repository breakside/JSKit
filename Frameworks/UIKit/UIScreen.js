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
// #import "UIUserInterface.js"
// #import "UITraitCollection.js"
'use strict';

JSClass("UIScreen", JSObject, {

    scale: JSReadOnlyProperty('_scale', 1),
    frame: JSDynamicProperty('_frame', null),
    availableInsets: JSDynamicProperty('_availableInsets', null),
    availableFrame: JSReadOnlyProperty(),

    initWithFrame: function(frame, scale){
        this._scale = scale;
        this.frame = frame;
        this._availableInsets = JSInsets.Zero;
    },

    getAvailableFrame: function(){
        return this.frame.rectWithInsets(this._availableInsets);
    },

    setAvailableInsets: function(availableInsets){
        this._availableInsets = JSInsets(availableInsets);
    },

    setFrame: function(frame){
        this._frame = JSRect(frame);
        this._setTraitCollection(UITraitCollection.initWithSize(this.frame.size));
    },
    
    traitCollection: JSReadOnlyProperty('_traitCollection', null),

    _setTraitCollection: function(traitCollection){
        var previous = this._traitCollection;
        this._traitCollection = traitCollection;
        if (previous !== null && !previous.isEqual(this._traitCollection)){
            this.traitCollectionDidChange(previous);
        }
    },

    traitCollectionDidChange: function(){
    }

});