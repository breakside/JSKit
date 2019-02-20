// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
// #import "PDFKit/PDFStreamObject.js"
/* global JSGlobalObject, JSData, JSSize, JSRect, PDFObject, PDFObjectProperty, PDFPageObject, PDFNameObject, PDFStreamObject */
'use strict';

(function(){

JSGlobalObject.PDFPageObject = function(){
    if (this === undefined){
        return new PDFPageObject();
    }
};

JSGlobalObject.PDFPageObject.prototype = Object.create(PDFObject.prototype, {
    Type:                   { enumerable: true, value: PDFNameObject("Page") },
    Parent:                 PDFObjectProperty,
    LastModified:           PDFObjectProperty,
    Resources:              PDFObjectProperty,
    MediaBox:               PDFObjectProperty,
    CropBox:                PDFObjectProperty,
    BleedBox:               PDFObjectProperty,
    TrimBox:                PDFObjectProperty,
    ArtBox:                 PDFObjectProperty,
    BoxColorInfo:           PDFObjectProperty,
    Contents:               PDFObjectProperty,
    Rotate:                 PDFObjectProperty,
    Group:                  PDFObjectProperty,
    Thumb:                  PDFObjectProperty,
    B:                      PDFObjectProperty,
    Dur:                    PDFObjectProperty,
    Trans:                  PDFObjectProperty,
    Annots:                 PDFObjectProperty,
    AA:                     PDFObjectProperty,
    Metadata:               PDFObjectProperty,
    PieceInfo:              PDFObjectProperty,
    StructParents:          PDFObjectProperty,
    ID:                     PDFObjectProperty,
    PZ:                     PDFObjectProperty,
    SeparationInfo:         PDFObjectProperty,
    Tabs:                   PDFObjectProperty,
    TemplateInstantiated:   PDFObjectProperty,
    PresSteps:              PDFObjectProperty,
    UserUnit:               PDFObjectProperty,
    VP:                     PDFObjectProperty,

    effectiveMediaBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveMediaBox(){
            if (this.MediaBox){
                return this.MediaBox;
            }
            if (this.Parent){
                return this.Parent.effectiveMediaBox;
            }
            return [0, 0, 100, 100];
        }
    },

    inheritedCropBox: {
        enumerable: false,
        get: function PDFPageObject_getInheritedCropBox(){
            if (this.CropBox){
                return this.CropBox;
            }
            if (this.Parent){
                return this.Parent.inheritedCropBox;
            }
            return null;
        }
    },

    effectiveCropBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveCropBox(){
            var box = this.inheritedCropBox;
            if (box){
                return box;
            }
            return this.effectiveMediaBox;
        }
    },

    effectiveRotation: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveCropBox(){
            if (this.Rotate){
                return this.Rotate;
            }
            if (this.Parent){
                return this.Parent.effectiveRotation;
            }
            return 0;
        }
    },

    bounds: {
        configurable: true,
        get: function PDFPageObject_getBounds(){
            var mediaBox = normalizedBox(this.effectiveMediaBox);
            var cropBox = normalizedBox(this.effectiveCropBox, mediaBox);
            var contentBox;
            if (this.ArtBox){
                contentBox = normalizedBox(this.ArtBox, cropBox);
            }else if (this.TrimBox){
                contentBox = normalizedBox(this.TrimBox, cropBox);
            }else{
                contentBox = cropBox;
            }
            var bounds = JSRect(contentBox[0], contentBox[1], contentBox[2] - contentBox[0], contentBox[3] - contentBox[1]);
            Object.defineProperty(this, 'bounds', { value: bounds });
            return bounds;
        }
    },

    getContentsData: {
        value: function PDFPageObject_getContentsData(completion, target){
            var contents = this.Contents;
            if (!contents){
                completion.call(target, null);
                return;
            }
            if (contents instanceof PDFStreamObject){
                contents.getData(completion, target);
                return;
            }
            if (contents.length === 0){
                completion.call(target, null);
                return;
            }
            var chunks = [];
            var contentIndex = 0;
            var handleChunk = function(chunk){
                chunks.push(chunk.bytes);
                ++contentIndex;
                if (contentIndex < contents.length){
                    contents[contentIndex].getData(handleChunk);
                }else{
                    var data = JSData.initWithChunks(chunks);
                    completion.call(target, data);
                }
            };
            contents[contentIndex].getData(handleChunk);
        }
    }
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