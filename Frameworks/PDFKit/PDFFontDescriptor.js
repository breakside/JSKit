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

// #import FontKit
// #import "PDFObject.js"
// #import "PDFName.js"
'use strict';

JSGlobalObject.PDFFontDescriptor = function(){
    if (this === undefined){
        return new PDFFontDescriptor();
    }
};

JSGlobalObject.PDFFontDescriptor.prototype = Object.create(PDFObject.prototype, {
    Type:           { enumerable: true, value: PDFName("FontDescriptor") },
    FontName:       PDFObjectProperty,
    FontFamily:     PDFObjectProperty,
    FontStretch:    PDFObjectProperty,
    FontWeight:     PDFObjectProperty,
    Flags:          PDFObjectProperty,
    FontBBox:       PDFObjectProperty,
    ItalicAngle:    PDFObjectProperty,
    Ascent:         PDFObjectProperty,
    Descent:        PDFObjectProperty,
    Leading:        PDFObjectProperty,
    CapHeight:      PDFObjectProperty,
    XHeight:        PDFObjectProperty,
    StemV:          PDFObjectProperty,
    StemH:          PDFObjectProperty,
    AvgWidth:       PDFObjectProperty,
    MaxWidth:       PDFObjectProperty,
    MissingWidth:   PDFObjectProperty,
    FontFile:       PDFObjectProperty,
    FontFile2:      PDFObjectProperty,
    FontFile3:      PDFObjectProperty,
    CharSet:        PDFObjectProperty,

    embeddedType1Font: {
        value: null,
        writable: true
    },

    embeddedCompactFont: {
        value: null,
        writable: true,
    },

    embeddedTrueTypeFont: {
        value: null,
        writable: true
    },

    embeddedOpenTypeFont: {
        value: null,
        writable: true
    },

    load: {
        value: function PDFFontDescriptor_load(completion, target){
            if (this.FontFile){
                if (this.Subtype == "Type1" || this.Subtype == "MMType1"){
                    this.FontFile.getData(function(type1){
                        this.embeddedType1Font = FNTType1Font.initWithData(type1);
                        completion.call(target);
                    }, this);
                }else{
                    completion.call(target, null);
                }
            }if (this.FontFile2){
                this.FontFile2.getData(function(ttf){
                    this.embeddedTrueTypeFont = FNTOpenTypeFont.initWithData(ttf);
                    completion.call(target, null);
                }, this);
            }else if (this.FontFile3){
                if (this.FontFile3.Subtype == "OpenType"){
                    this.FontFile3.getData(function(otf){
                        this.embeddedOpenTypeFont = FNTOpenTypeFont.initWithData(otf);
                        completion.call(target, null);
                    }, this);
                }else if (this.FontFile3.Subtype == "Type1C" || this.FontFile3.Subtype == "CIDFontType0C"){
                    this.FontFile3.getData(function(ccf){
                        this.embeddedCompactFont = FNTCompactFontFormat.initWithData(ccf);
                        completion.call(target, null);
                    }, this);
                }else{
                    completion.call(target, null);
                }
            }else{
                completion.call(target, null);
            }
        }
    },

    getOpenTypeFont: {
        value: function PDFFontDescriptor_getOpenTypeFont(info, completion, target){
            if (this.embeddedOpenTypeFont){
                this.embeddedOpenTypeFont.getCorrectedFont(completion, target);
            }else if (this.embeddedTrueTypeFont){
                this.embeddedTrueTypeFont.getCorrectedFont(completion, target);
            }else if (this.embeddedCompactFont){
                info = JSCopy(info);
                info.ascender = this.Ascent;
                info.descender = this.Descent;
                info.bbox = this.FontBBox;
                info.nominalWidth = this.AvgWidth || 0;
                this.embeddedCompactFont.getOpenTypeData(info, function(data){
                    var font = FNTOpenTypeFont.initWithData(data);
                    completion.call(target, font);
                });
            }else if (this.embeddedType1Font){
                this.embeddedType1Font.getOpenTypeData(function(data){
                    var font = FNTOpenTypeFont.initWithData(data);
                    completion.call(target, font);
                });
            }else{
                completion.call(target, null);
            }
        }
    }
});

PDFFontDescriptor.Flags = {
    fixedPitch: 1 >> 0,
    serif: 1 >> 1,
    symbolic: 1 >> 2,
    script: 1 >> 3,
    nonsymbolic: 1 >> 5,
    italic: 1 >> 6,
    allCapitals: 1 >> 16,
    smallCapitials: 1 >> 17,
    forceBold: 1 >> 18
};