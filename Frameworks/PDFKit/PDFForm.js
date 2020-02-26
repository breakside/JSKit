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

// #import "PDFXObject.js"
// #import "PDFColorSpace.js"
// #import "PDFDrawing.js"
// #import "PDFOperationIterator.js"
'use strict';

(function(){

var logger = JSLog("pdfkit", "image");

JSGlobalObject.PDFForm = function(){
    if (this === undefined){
        return new PDFForm();
    }
};

JSGlobalObject.PDFForm.prototype = Object.create(PDFXObject.prototype, {
    Subtype:            { enumerable: true, value: PDFName("Form") },
    FormType:           PDFObjectProperty,
    BBox:               PDFObjectProperty,
    Matrix:             PDFObjectProperty,
    Resources:          PDFObjectProperty,
    Group:              PDFObjectProperty,
    Ref:                PDFObjectProperty,
    Metadata:           PDFObjectProperty,
    PieceInfo:          PDFObjectProperty,
    LastModified:       PDFObjectProperty,
    StructParent:       PDFObjectProperty,
    StructParents:      PDFObjectProperty,
    OPI:                PDFObjectProperty,
    OC:                 PDFObjectProperty,
    Name:               PDFObjectProperty,

    drawing: {
        writable: true,
        value: null
    },

    bounds: {
        configurable: true,
        get: function PDFForm_getBounds(){
            var bbox = normalizedBox(this.BBox);
            var bounds = JSRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
            Object.defineProperty(this, 'bounds', { value: bounds });
            return bounds;
        }
    },

    transform: {
        configurable: true,
        get: function PDFForm_getTransform(){
            var transform;
            if (this.Matrix){
                transform = JSAffineTransform.apply(undefined, this.Matrix);
            }else{
                transform = JSAffineTransform.Identity;
            }
            Object.defineProperty(this, 'transform', { value: transform });
            return transform;
        }
    },

    load: {
        value: function PDFForm_load(completion, target){
            var drawing = PDFDrawing.init();
            drawing.flipped = false;
            drawing.backgroundColor = null;
            drawing.bounds = this.bounds;
            this.getOperationIterator(function PDFForm_prepareForDrawing_handleIterator(iterator){
                drawing.operationIterator = iterator;
                drawing.resources = iterator.resources;
                this.drawing = drawing;
                completion.call(target);
            }, this);
        }
    },

    getOperationIterator: {
        value: function PDFPage_getOperationIterator(completion, target){
            this.getData(function(data){
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                if (this.Resources){
                    this.Resources.load(function(){
                        var iterator = PDFOperationIterator.initWithData(data, this.Resources);
                        completion.call(target, iterator);
                    }, this);
                }else{
                    var iterator = PDFOperationIterator.initWithData(data);
                    completion.call(target, iterator);
                }
            }, this);
        }
    },
});

var normalizedBox = function(box, intersectingBox){
    var tmp;
    var normalized = [box[0], box[1], box[2], box[3]];
    if (normalized[2] < normalized[0]){
        tmp = normalized[0];
        normalized[0] = normalized[2];
        normalized[2] = tmp;
    }
    if (normalized[3] < normalized[1]){
        tmp = normalized[1];
        normalized[1] = normalized[3];
        normalized[3] = tmp;
    }
    if (intersectingBox){
        if (normalized[0] < intersectingBox[0]){
            normalized[0] = intersectingBox[0];
        }
        if (normalized[1] < intersectingBox[1]){
            normalized[1] = intersectingBox[1];
        }
        if (normalized[2] > intersectingBox[2]){
            normalized[2] = intersectingBox[2];
        }
        if (normalized[3] > intersectingBox[3]){
            normalized[3] = intersectingBox[3];
        }
    }
    return normalized;
};

})();