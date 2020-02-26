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

// #import "PDFObject.js"
// #import "PDFName.js"
// #import "PDFResources.js"
'use strict';

JSGlobalObject.PDFPages = function(){
    if (this === undefined){
        return new PDFPages();
    }
    this.Kids = [];
    this.Count = 0;
};

JSGlobalObject.PDFPages.prototype = Object.create(PDFObject.prototype, {
    Type:       { enumerable: true, value: PDFName("Pages") },
    Parent:     PDFObjectProperty,
    Kids:       PDFObjectProperty,
    Count:      PDFObjectProperty,
    Resources:  PDFObjectProperty,
    MediaBox:   PDFObjectProperty,
    CropBox:    PDFObjectProperty,
    Rotate:     PDFObjectProperty,

    effectiveResources: {
        enumerable: false,
        get: function PDFPage_getEffectiveResources(){
            if (this.Resources){
                return this.Resources;
            }
            if (this.Parent){
                return this.Parent.effectiveResources;
            }
            return PDFResources();
        }
    },

    effectiveMediaBox: {
        enumerable: false,
        get: function PDFPage_getEffectiveMediaBox(){
            if (this.MediaBox){
                return this.MediaBox;
            }
            if (this.Parent){
                return this.Parent.effectiveMediaBox;
            }
            return null;
        }
    },

    inheritedCropBox: {
        enumerable: false,
        get: function PDFPage_getEffectiveMediaBox(){
            if (this.CropBox){
                return this.CropBox;
            }
            if (this.Parent){
                return this.Parent.inheritedCropBox;
            }
            return null;
        }
    },

    effectiveRotation: {
        enumerable: false,
        get: function PDFPage_getEffectiveMediaBox(){
            if (this.Rotate){
                return this.Rotate;
            }
            if (this.Parent){
                return this.Parent.effectiveRotation;
            }
            return 0;
        }
    },

    page: {
        value: function PDFPages_getPage(index){
            var kid;
            var number = 0;
            for (var i = 0, l = this.Kids.length; i < l; ++i){
                kid = this.Kids[i];
                kid.Parent = this;
                if (kid.Type == "Pages"){
                    if (index - number < kid.Count){
                        return kid.page(index - number);
                    }
                    number += kid.Count;
                }else{
                    if (number == index){
                        return kid;
                    }
                    number += 1;
                }
            }
            return null;
        }
    }
});