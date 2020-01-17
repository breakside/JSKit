// #import "PDFObject.js"
// #import "PDFName.js"
// #import "PDFStream.js"
// #import "PDFImage.js"
// #import "PDFStreamOperation.js"
// #import "PDFGraphicsState.js"
// #import "PDFColorSpace.js"
// #import "PDFDrawing.js"
/* global JSGlobalObject, JSClass, JSObject, JSFont, JSData, JSPoint, JSSize, JSRect, JSColor, JSAffineTransform, JSContext, PDFObject, PDFColorSpace, PDFObjectProperty, PDFPage, PDFName, PDFResources, PDFStream, PDFStreamOperation, PDFGraphicsState, PDFOperationIterator, PDFDrawing, PDFImage */
'use strict';

(function(){

JSGlobalObject.PDFPage = function(){
    if (this === undefined){
        return new PDFPage();
    }
};

JSGlobalObject.PDFPage.prototype = Object.create(PDFObject.prototype, {
    Type:                   { enumerable: true, value: PDFName("Page") },
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
        get: function PDFPage_getEffectiveMediaBox(){
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
        get: function PDFPage_getInheritedCropBox(){
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
        get: function PDFPage_getEffectiveCropBox(){
            var box = this.inheritedCropBox;
            if (box){
                return box;
            }
            return this.effectiveMediaBox;
        }
    },

    effectiveRotation: {
        enumerable: false,
        get: function PDFPage_getEffectiveRotation(){
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

    uncroppedBounds: {
        configurable: true,
        get: function PDFPage_uncroppedBounds(){
            var mediaBox = normalizedBox(this.effectiveMediaBox);
            var bounds = JSRect(mediaBox[0], mediaBox[1], mediaBox[2] - mediaBox[0], mediaBox[3] - mediaBox[1]);
            Object.defineProperty(this, 'uncroppedBounds', {value: bounds});
            return bounds;
        }
    },

    bounds: {
        configurable: true,
        get: function PDFPage_getBounds(){
            var mediaBox = normalizedBox(this.effectiveMediaBox);
            var cropBox = normalizedBox(this.effectiveCropBox, mediaBox);
            var contentBox;
            if (this.TrimBox){
                contentBox = normalizedBox(this.TrimBox, cropBox);
            }else if (this.ArtBox){
                contentBox = normalizedBox(this.ArtBox, cropBox);
            }else{
                contentBox = cropBox;
            }
            var bounds = JSRect(contentBox[0], contentBox[1], contentBox[2] - contentBox[0], contentBox[3] - contentBox[1]);
            Object.defineProperty(this, 'bounds', { value: bounds });
            return bounds;
        }
    },

    getContentsData: {
        value: function PDFPage_getContentsData(completion, target){
            if (!completion){
                completion = Promise.completion(Promise.resolveNonNull);
            }
            var contents = this.Contents;
            if (!contents){
                completion.call(target, null);
                return;
            }
            if (contents instanceof PDFStream){
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
                if (chunk === null){
                    completion.call(target, null);
                    return;
                }
                chunks.push(chunk);
                ++contentIndex;
                if (contentIndex < contents.length){
                    contents[contentIndex].getData(handleChunk);
                }else{
                    var data = JSData.initWithChunks(chunks);
                    completion.call(target, data);
                }
            };
            contents[contentIndex].getData(handleChunk, this);
            return completion.promise;
        }
    },

    getOperationIterator: {
        value: function PDFPage_getOperationIterator(completion, target){
            if (!completion){
                completion = Promise.completion(Promise.resolveNonNull);
            }
            this.getContentsData(function(data){
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                var resources = this.effectiveResources;
                resources.load(function PDFPage_getOperationIterator_loadResources(){
                    var iterator = PDFOperationIterator.initWithData(data, resources);
                    completion.call(target, iterator);
                }, this);
            }, this);
            return completion.promise;
        }
    },

    _getStreams: {
        value: function PDFPage_getStreams(){
            var contents = this.Contents;
            if (!contents){
                return [];
            }
            if (contents instanceof PDFStream){
                return [contents];
            }
            return contents;
        }
    },

    getText: {
        value: function PDFPage_getText(completion, target){
            if (!completion){
                completion = Promise.completion(Promise.resolveNonNull);
            }
            var placedStrings = [];
            var handleOperationIterator = function PDFPage_getText_handleOperationIterator(iterator){
                if (iterator === null){
                    finish();
                    return;
                }
                var operation = iterator.next();
                var text;
                var transform;
                var placed;
                var font;
                while (operation !== null){
                    switch (operation.operator){
                        case Op.text:
                            font = iterator.state.font;
                            if (font && font.Subtype != "Type3"){
                                transform = iterator.state.textTransform.concatenatedWith(iterator.state.transform);
                                text = font.stringFromData(operation.operands[0]);
                                // TODO: expand characters like fi and fl
                                placed = {
                                    origin: transform.convertPointFromTransform(JSPoint.Zero),
                                    width: 0,
                                    text: text
                                };
                                iterator.updateState();
                                transform = iterator.state.textTransform.concatenatedWith(iterator.state.transform);
                                placed.width = transform.convertPointFromTransform(JSPoint.Zero).x - placed.origin.x;
                                // TODO: save space width so we can use it to compare later?
                                // TODO: save font or font size so we can use it to compare later?
                                placedStrings.push(placed);
                            }
                            break;
                    }
                    operation = iterator.next();
                }
                iterator.close();
                finish();
            };
            var finish = function PDFPage_getText_finish(){
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

            this.getOperationIterator(handleOperationIterator, this);
            return completion.promise;
        }
    },

    prepareDrawing: {
        value: function(completion, target){
            var drawing = PDFDrawing.init();
            drawing.bounds = this.bounds;
            drawing.resources = this.effectiveResources;
            this.getOperationIterator(function PDFPage_prepareForDrawing_handleIterator(iterator){
                drawing.operationIterator = iterator;
                drawing.resources = iterator.resources;
                completion.call(target, drawing);
            }, this);

            // TODO: annotations
        }
    }
});

var Op = PDFStreamOperation.Operator;

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