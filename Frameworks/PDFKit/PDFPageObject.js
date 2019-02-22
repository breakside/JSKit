// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
// #import "PDFKit/PDFStreamObject.js"
// #import "PDFKit/PDFStreamOperation.js"
// #import "PDFKit/PDFGraphicsState.js"
/* global JSGlobalObject, JSData, JSPoint, JSSize, JSRect, PDFObject, PDFObjectProperty, PDFPageObject, PDFNameObject, PDFStreamObject, PDFStreamOperation, PDFGraphicsState */
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
        get: function PDFPageObject_getEffectiveRotation(){
            if (this.Rotate){
                return this.Rotate;
            }
            if (this.Parent){
                return this.Parent.effectiveRotation;
            }
            return 0;
        }
    },


    effectiveResources: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveResources(){
            if (this.Resources){
                return this.Resources;
            }
            if (this.Parent){
                return this.Parent.effectiveResources;
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
            contents[contentIndex].getData(handleChunk, this);
        }
    },

    getText: {
        value: function PDFPageObject_getText(completion, target){
            var streams;
            var contents = this.Contents;
            if (!contents){
                completion.call(target, "");
            }
            if (contents instanceof PDFStreamObject){
                streams = [contents];
            }else{
                streams = contents;
            }
            if (streams.length === 0){
                completion.call(target, "");
            }
            var streamIndex = 0;
            var placedStrings = [];
            var handleIterator = function(iterator){
                var Op = PDFStreamOperation.Operator;
                var operation = iterator.next();
                var text;
                var stack = PDFGraphicsState.stack();
                var transform;
                var placed;
                while (operation !== null){
                    switch (operation.operator){
                        case Op.text:
                            transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                            text = stack.state.font.stringFromData(operation.operands[0]);
                            placed = {
                                origin: transform.convertPointFromTransform(JSPoint.Zero),
                                width: 0,
                                text: text
                            };
                            stack.handleOperation(operation, this.effectiveResources);
                            transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                            placed.width = transform.convertPointFromTransform(JSPoint.Zero).x - placed.origin.x;
                            // TODO: save space width so we can use it to compare later?
                            // TODO: save font or font size so we can use it to compare later?
                            placedStrings.push(placed);
                            break;
                        default:
                            stack.handleOperation(operation, this.effectiveResources);
                            break;
                    }
                    operation = iterator.next();
                }
                ++streamIndex;
                if (streamIndex < streams.length){
                    streams[streamIndex].getOperationIterator(handleIterator, this);
                }else{
                    consolidateText();
                }
            };
            var consolidateText = function(){
                var text = "";
                // TODO: analyze placedStrings and combine adjacent runs
                // - combine horizontally anything less than a space distance
                // - combine vertically anything that looks like a soft line break
                // - watch out for columns...
                // - remember that y gets decreases from the top of the page to the bottom (0)
                var placed;
                for (var i = 0, l = placedStrings.length; i < l; ++i){
                    placed = placedStrings[i];
                    text += placed.text;
                }
                completion.call(target, text);
            };
            streams[streamIndex].getOperationIterator(handleIterator, this);
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