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

// #import "JSObject.js"
// #import "JSImage.js"
'use strict';

JSClass("JSTextAttachment", JSObject, {

    size: JSReadOnlyProperty('_size', null),
    image: JSDynamicProperty('_image', null),
    representedObject: null,
    baselineAdjustment: 0,

    init: function(){
        this._size = JSSize.Zero;
    },

    initWithImageForFont: function(image, font){
        this._image = image;
        var ratio = image.size.width / image.size.height;
        this._size = JSSize(ratio * font.displayLineHeight, font.displayLineHeight);
        this.baselineAdjustment = font.displayDescender;
    },

    initWithImage: function(image, size){
        if (size === undefined){
            size = image.size;
        }
        this._image = image;
        this._size = JSSize(size);
    },

    initWithImageName: function(name, size){
        var image = JSImage.initWithResourceName(name);
        this.initWithImage(image, size);
    },

    layout: function(font, lineWidth){
        if (this._size.width > lineWidth){
            this._size = JSSize(lineWidth, this._size.height * lineWidth / this._size.width);
        }
    },

    drawInContextAtPoint: function(context, point){
        context.drawImage(this._image, JSRect(point, this._size));
    }

});