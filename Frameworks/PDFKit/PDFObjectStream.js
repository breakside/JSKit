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

// #import "PDFStream.js"
// #import "PDFName.js"
/* global PDFTokenizer */
'use strict';

JSGlobalObject.PDFObjectStream = function(){
    if (this === undefined){
        return new PDFObjectStream();
    }
};

JSGlobalObject.PDFObjectStream.prototype = Object.create(PDFStream.prototype, {
    Type:           { enumerable: true, value: PDFName("ObjStm") },
    N:              PDFObjectProperty,
    First:          PDFObjectProperty,
    Extends:        PDFObjectProperty,

    tokenizer: {
        writable: true,
        value: null
    },

    objectOffsets: {
        configurable: true,
        get: function(){
            var offsets = [];
            var Token = PDFTokenizer.Token;
            this.tokenizer.stream.seek(0);
            var token;
            var entry;
            for (var i = 0, l = this.N; i < l; ++i){
                entry = {objectID: 0, offset: 0};
                token = this.tokenizer.readMeaningfulToken(Token.integer);
                entry.objectID = token.pdfObject;
                token = this.tokenizer.readMeaningfulToken(Token.integer);
                entry.offset = token.pdfObject;
                offsets.push(entry);
            }
            Object.defineProperty(this, 'objectOffsets', {value: offsets});
            return offsets;
        }
    },

    object: {
        value: function PDFObjectStream_getObject(index){
            var offset = this.First + this.objectOffsets[index].offset;
            this.tokenizer.stream.seek(offset);
            var object = this.tokenizer.readObject();
            return object;
        }
    }
});