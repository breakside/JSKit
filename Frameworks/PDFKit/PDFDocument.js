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
'use strict';

JSGlobalObject.PDFDocument = function(){
    if (this === undefined){
        return new PDFDocument();
    }
};

JSGlobalObject.PDFDocument.prototype = Object.create(PDFObject.prototype, {
    Type:               { enumerable: true, value: PDFName("Catalog") },
    Version:            PDFObjectProperty,
    Extensions:         PDFObjectProperty,
    Pages:              PDFObjectProperty,
    PageLabels:         PDFObjectProperty,
    Names:              PDFObjectProperty,
    Dests:              PDFObjectProperty,
    ViewerPreferences:  PDFObjectProperty,
    PageLayout:         PDFObjectProperty,
    PageMode:           PDFObjectProperty,
    Outlines:           PDFObjectProperty,
    Threads:            PDFObjectProperty,
    OpenAction:         PDFObjectProperty,
    AA:                 PDFObjectProperty,
    URI:                PDFObjectProperty,
    ArcoForm:           PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    StructTreeRoot:     PDFObjectProperty,
    MarkInfo:           PDFObjectProperty,
    Lang:               PDFObjectProperty,
    SpiderInfo:         PDFObjectProperty,
    OutputIntents:      PDFObjectProperty,
    PieceInfo:          PDFObjectProperty,
    OCProperties:       PDFObjectProperty,
    Perms:              PDFObjectProperty,
    Legal:              PDFObjectProperty,
    Requirements:       PDFObjectProperty,
    Collection:         PDFObjectProperty,
    NeedsRendering:     PDFObjectProperty,

    pageCount: {
        get: function PDFDocument_getPageCount(){
            if (this.Pages === null){
                return 0;
            }
            return this.Pages.Count;
        }
    },

    page: {
        value: function PDFDocument_getPage(index){
            if (this.Pages === null){
                return null;
            }
            return this.Pages.page(index);
        }
    }
});