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

// #import "UILayer.js"
'use strict';

JSClass("UIFocusRingLayer", UILayer, {

    init: function(){
        UIFocusRingLayer.$super.init.call(this);
        // this.borderWidth = 1;
        // this.borderColor = JSColor.red;
    },

    color: JSDynamicProperty("_color", JSColor.black),

    setColor: function(color){
        this._color = color;
        this.setNeedsDisplay();
    },

    width: JSDynamicProperty("_width", 3.5),

    setWidth: function(width){
        this._width = width;
        this.setNeedsDisplay();
    },

    path: JSDynamicProperty("_path", null),

    setPath: function(path){
        this._path = path;
        this.bounds = JSRect(0, 0, path.boundingRect.rectWithInsets(-this._width).size);
        this.setNeedsDisplay();
    },

    drawInContext: function(context){
        if (this._path === null){
            return;
        }
        context.save();
        context.setStrokeColor(this.color);
        context.setLineWidth(this._width * 2);
        context.setLineJoin(JSContext.LineJoin.round);
        context.beginPath();
        context.addRect(this.bounds);
        context.translateBy(this._width - this._path.boundingRect.origin.x, this._width - this._path.boundingRect.origin.y);
        context.addPath(this._path);
        context.clip(JSContext.FillRule.evenOdd);
        context.beginPath();
        context.addPath(this._path);
        context.strokePath();
        context.restore();
    },

});