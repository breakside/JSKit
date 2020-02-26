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

// #import "PDFFilter.js"
'use strict';

// The stream data is a JPEG2000 image, so we probably don't need to decode

JSClass("PDFJPXFilter", PDFFilter, {
    decode: function(input){
        throw new Error("PDFJPXFilter decode not implemented");
    },

    encode: function(input){
        throw new Error("PDFJPXFilter encode not implemented");
    }
});