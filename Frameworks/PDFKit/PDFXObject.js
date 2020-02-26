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

// #import ImageKit
// #import "PDFStream.js"
'use strict';

JSGlobalObject.PDFXObject = function(){
    if (this === undefined){
        return new PDFXObject();
    }
};

JSGlobalObject.PDFXObject.prototype = Object.create(PDFStream.prototype, {
    Type: { enumerable: true, value: PDFName("XObject") },

    load: {
        value: function PDFXObject_load(completion, target){
            completion.call(target);
        }
    }
});