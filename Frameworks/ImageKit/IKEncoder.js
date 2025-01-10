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

JSClass("IKEncoder", JSObject, {

    initWithFormat: function(format, bitmap){
        var encoderClass = IKEncoder.EncoderClassesByFormat[format];
        if (encoderClass !== undefined){
            return encoderClass.initWithBitmap(bitmap);
        }
        return null;
    },

    initWithBitmap: function(bitmap){
        this.bitmap = bitmap;
    },

    bitmap: null,

    lossyCompressionQuality: 0.92,

    getData: function(){
    }

});

IKEncoder.EncoderClassesByFormat = {};

IKEncoder.$extend = function(extensions, name){
    var subclass = JSClass.prototype.$extend.call(this, extensions, name);
    this.EncoderClassesByFormat[extensions.format] = subclass;
    return subclass;
};

IKEncoder.LossyCompressionQuality = {
    best: 1,
    better: 0.95,
    standard: 0.92,
    low: 0.5,
    platformDefault: -1
};
