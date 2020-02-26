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
// #import "PDFName.js"
/* global PDFASCIIHexFilter, PDFASCII85Filter, PDFLZWFilter, PDFDeflateFilter, PDFRunLengthFilter, PDFCCITTFaxFilter, PDFJBIG2Filter, PDFDCTFilter, PDFJPXFilter, PDFCryptFilter */
'use strict';

JSClass("PDFFilter", JSObject, {

    decodeParameters: null,

    initWithParametersDictionary: function(decodeParameters){
        this.decodeParameters = decodeParameters;
    },

    decode: function(input){
        throw new Error("PDFilter decode abstract method must be implemented by subclass");
    },

    encode: function(input){
        throw new Error("PDFilter encode abstract method must be implemented by subclass");
    }
});

PDFFilter.CreateChain = function(filters, decodeParameters){
    var chain = [];
    var filter;
    for (var i = 0, l = filters.length; i < l; ++i){
        filter = PDFFilter.Create(filters[i].name, filters[i].params || {});
        if (filter !== null){
            chain.push(filter);
        }
    }
    return chain;
};

PDFFilter.Create = function(name, decodeParameters){
    switch (name.toString()){
        case "ASCIIHexDecode":
            return PDFASCIIHexFilter.init();
        case "ASCII85Decode":
            return PDFASCII85Filter.init();
        case "LZWDecode":
            return PDFLZWFilter.initWithParametersDictionary(decodeParameters);
        case "FlateDecode":
            return PDFDeflateFilter.initWithParametersDictionary(decodeParameters);
        case "RunLengthDecode":
            return PDFRunLengthFilter.init();
        case "CCITTFaxDecode":
            return PDFCCITTFaxFilter.initWithParametersDictionary(decodeParameters);
        case "JBIG2Decode":
            return PDFJBIG2Filter.initWithParametersDictionary(decodeParameters);
        case "DCTDecode":
            return PDFDCTFilter.initWithParametersDictionary(decodeParameters);
        case "JPXDecode":
            return PDFJPXFilter.initWithParametersDictionary(decodeParameters);
        case "Crypt":
            return null;
    }
    return null;
};