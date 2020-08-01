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
// #import "IKBitmap.js"
'use strict';

JSClass("IKBitmapContext", JSContext, {

    initWithPixelSize: function(size){
        IKBitmap.$super.init.call(this);
        this.size = JSSize(Math.ceil(size.width), Math.ceil(size.height));
    },

    size: null,

    bitmap: function(){
    },

    image: function(scale){
        var bitmap = this.bitmap();
        var png = bitmap.encodedData(IKBitmap.Format.png);
        var image = JSImage.initWithData(png, this.size, scale);
        return image;
    },

});