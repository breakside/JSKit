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

    size: null,

    bitmap: function(completion, target){
    },

    image: function(encoding, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        this.bitmap(function(bitmap){
            if (bitmap === null){
                completion.call(target, null);
                return;
            }
            var encoded = bitmap.encodedData(encoding);
            var image = JSImage.initWithData(encoded, bitmap.size);
            return completion.call(target, image);
        }, this);
        return completion.promise;
    },

});