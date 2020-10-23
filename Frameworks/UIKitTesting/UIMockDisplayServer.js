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

// #import UIKit
// #import "UIMockDisplayContext.js"
"use strict";

JSClass("UIMockDisplayServer", UIDisplayServer, {

    rootContext: null,
    rootLayers: null,
    contextsByObjectID: null,
    updateNeeded: true,
    layerChangeCallback: null,

    init: function(){
        UIMockDisplayServer.$super.init.call(this);
        this.rootLayers = [];
        this.contextsByObjectID = {};
        this.rootContext = UIMockDisplayContext.init();
    },

    layerInserted: function(layer){
        if (layer.superlayer === null){
            this._layerInserted(layer, this.rootContext);
        }else{
            var parentContext = this.contextsByObjectID[layer.superlayer.objectID];
            if (!parentContext){
                throw new Error("Cannot insert a layer without a superlayer also inserted.");
            }
            this._layerInserted(layer, parentContext);
        }
    },

    _layerInserted: function(layer, parentContext){
        layer._displayServer = this;
        if (layer.superlayer === null){
            this.rootLayers.push(layer);
        }
        var context = this.contextForLayer(layer);
        if (layer._needsLayout){
            this.setLayerNeedsLayout(layer);
            layer._needsLayout = false;
        }
        this.setLayerNeedsReposition(layer);
        this.setLayerNeedsDisplay(layer);
        for (var i = 0, l = layer.sublayers.length; i < l; ++i){
            this.layerInserted(layer.sublayers[i]);
        }
    },

    layerRemoved: function(layer){
        if (this.contextsByObjectID[layer.objectID]){
            delete this.contextsByObjectID[layer.objectID];
        }
        if (layer.superlayer === null){
            for (var i = this.rootLayers.length - 1; i >= 0; --i){
                this.rootLayers.splice(i, 1);
                break;
            }
        }
        layer._displayServer = null;
    },

    layerDidChangeProperty: function(layer, keyPath){
        if (this.layerChangeCallback !== null){
            this.layerChangeCallback.call(layer, keyPath);
        }
        UIMockDisplayServer.$super.layerDidChangeProperty.call(this, layer, keyPath);
    },

    setUpdateNeeded: function(){
        this.updateNeeded = true;
    },

    updateDisplay: function(t){
        UIMockDisplayServer.$super.updateDisplay.call(this, t);
        this.updateNeeded = false;
    },

    contextForLayer: function(layer){
        var context = this.contextsByObjectID[layer.objectID];
        if (context === undefined){
            context = UIMockDisplayContext.init();
            this.contextsByObjectID[layer.objectID] = context;
        }
        return context;
    },

    positionLayer: function(layer){
    },

    createTextFramesetter: function(){
        return JSTextFramesetter.init();
    }

});
