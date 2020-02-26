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


JSGlobalObject.PDFStream = function(){
    if (this === undefined){
        return new PDFStream();
    }
};

JSGlobalObject.PDFStream.prototype = Object.create(PDFObject.prototype, {
    Length:         PDFObjectProperty,
    Filter:         PDFObjectProperty,
    DecodeParms:    PDFObjectProperty,
    F:              PDFObjectProperty,
    FFilter:        PDFObjectProperty,
    FDecodeParms:   PDFObjectProperty,
    DL:             PDFObjectProperty,

    filters: {
        value: function PDFStream_getFilters(){
            if (!this.Filter){
                return [];
            }
            if (this.Filter instanceof PDFName){
                return [{name: this.Filter, params: this.DecodeParms}];
            }
            var filters = [];
            for (var i = 0, l = this.Filter.length; i < l; ++i){
                filters.push({name: this.Filter[i], params: this.DecodeParms ? this.DecodeParms[i] : null});
            }
            return filters;
        }
    },

    // PDFReader will redefine this property so it reads data from the pdf file
    getData: {
        value: function PDFStream_getData(completion, target){
            return completion.call(target, null);
        }
    }
});

PDFStream.Filters = {
    asciiHex: PDFName("ASCIIHexDecode"),
    ascii85: PDFName("ASCII85Decode"),
    lzw: PDFName("LZWDeccode"),
    flate: PDFName("FlateDecode"),
    runLength: PDFName("RunLengthDecode"),
    ccittFax: PDFName("CCITTFaxDecode"),
    jbig2: PDFName("JBIG2Decode"),
    dct: PDFName("DCTDecode"),
    jpx: PDFName("JPXDecode"),
    crypt: PDFName("Crypt")
};