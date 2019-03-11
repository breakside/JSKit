// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFName.js"
// #import "PDFKit/PDFStream.js"
// #import "PDFKit/PDFImage.js"
// #import "PDFKit/PDFStreamOperation.js"
// #import "PDFKit/PDFGraphicsState.js"
// #import "PDFKit/PDFColorSpace.js"
/* global JSGlobalObject, JSClass, JSObject, JSFont, JSData, JSPoint, JSSize, JSRect, JSColor, JSAffineTransform, JSContext, PDFObject, PDFColorSpace, PDFObjectProperty, PDFPage, PDFName, PDFResources, PDFStream, PDFStreamOperation, PDFGraphicsState, PDFOperationIterator, PDFPageDrawing, PDFImage */
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
        }
    },

    getOperationIterator: {
        value: function PDFPage_getOperationIterator(completion, target){
            this.getContentsData(function(data){
                if (data === null){
                    completion.call(target, null);
                    return;
                }
                var iterator = PDFOperationIterator.initWithData(data);
                completion.call(target, iterator);
            }, this);
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
            var placedStrings = [];
            var resources = this.effectiveResources;
            var handleOperationIterator = function PDFPage_getText_handleOperationIterator(iterator){
                if (iterator === null){
                    finish();
                    return;
                }
                var operation = iterator.next();
                var text;
                var stack = PDFGraphicsState.stack();
                stack.resources = resources;
                var transform;
                var placed;
                var font;
                while (operation !== null){
                    switch (operation.operator){
                        case Op.text:
                            font = stack.state.font;
                            if (font && font.Subtype != "Type3"){
                                transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                                text = font.stringFromData(operation.operands[0]);
                                // TODO: expand characters like fi and fl
                                placed = {
                                    origin: transform.convertPointFromTransform(JSPoint.Zero),
                                    width: 0,
                                    text: text
                                };
                                stack.handleOperation(operation);
                                transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                                placed.width = transform.convertPointFromTransform(JSPoint.Zero).x - placed.origin.x;
                                // TODO: save space width so we can use it to compare later?
                                // TODO: save font or font size so we can use it to compare later?
                                placedStrings.push(placed);
                            }
                            break;
                        default:
                            stack.handleOperation(operation);
                            break;
                    }
                    operation = iterator.next();
                }
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

                resources.unload();

                completion.call(target, text);
            };

            resources.load(function PDFPage_getText_loadResources(){
                this.getOperationIterator(handleOperationIterator, this);
            }, this);
        }
    },

    prepareDrawing: {
        value: function(completion, target){
            var drawing = PDFPageDrawing.init();
            drawing.page = this;
            drawing.resources = this.effectiveResources;
            drawing.resources.load(function PDFPage_prepareForDrawing_handleResources(){
                this.getOperationIterator(function PDFPage_prepareForDrawing_handleIterator(iterator){
                    drawing.operationIterator = iterator;
                    completion.call(target, drawing);
                }, this);
            }, this);

            // TODO: annotations
        }
    }
});

JSClass("PDFPageDrawing", JSObject, {

    page: null,
    resources: null,
    operationIterator: null,

    drawInContext: function(context, rect){
        // Scale to given rect (flipping coordinates in the process)
        context.save();
        var bounds = this.page.bounds;
        context.translateBy(rect.origin.x, rect.origin.y + rect.size.height);
        var sx = rect.size.width / bounds.size.width;
        var sy = rect.size.height / bounds.size.height;
        context.scaleBy(sx, -sy);
        context.translateBy(-bounds.origin.x, -bounds.origin.y);

        // Clip to bounds
        context.addRect(bounds);
        context.clip();
        context.beginPath();
        context.save();

        // Make page background white
        context.save();
        context.setFillColor(JSColor.whiteColor);
        context.fillRect(bounds);
        context.restore();

        if (this.operationIterator !== null){
            var handler;
            var stack = PDFGraphicsState.stack();
            stack.resources = this.resources;
            var obj = {
                context: context,
                stack: stack,
                resources: this.resources,
                font: null,
                fontStack: []
            };
            var operation = this.operationIterator.next();
            while (operation !== null){
                handler = contextOperationHandler[operation.operator];
                if (handler){
                    handler.apply(obj, operation.operands);
                }
                stack.handleOperation(operation);
                operation = this.operationIterator.next();
            }
            this.operationIterator.reset();
        }

        context.restore();
        context.restore();
    },

    finish: function(){
        this.resources.unload();
    }

});

JSContext.definePropertiesFromExtensions({

    setPDFLineCap: function(pdfLineCap){
        switch (pdfLineCap){
            case PDFGraphicsState.LineCap.butt:
                this.setLineCap(JSContext.LineCap.butt);
                break;
            case PDFGraphicsState.LineCap.round:
                this.setLineCap(JSContext.LineCap.round);
                break;
            case PDFGraphicsState.LineCap.square:
                this.setLineCap(JSContext.LineCap.square);
                break;
        }
    },

    setPDFLineJoin: function(pdfLineJoin){
        switch (pdfLineJoin){
            case PDFGraphicsState.LineJoin.miter:
                this.setLineJoin(JSContext.LineJoin.miter);
                break;
            case PDFGraphicsState.LineJoin.round:
                this.setLineJoin(JSContext.LineJoin.round);
                break;
            case PDFGraphicsState.LineJoin.bevel:
                this.setLineJoin(JSContext.LineJoin.bevel);
                break;
        }
    }

});

var contextOperationHandler = {

    // MARK: - Graphics State

    q: function(){
        this.context.save();
        this.fontStack.push(this.font);
    },

    Q: function(){
        this.context.restore();
        if (this.fontStack.length > 0){
            this.font = this.fontStack.pop();
        }
    },

    cm: function(a, b, c, d, e, f){
        var transform = JSAffineTransform(a, b, c, d, e, f);
        this.context.concatenate(transform);
    },

    w: function(lineWidth){
        this.context.setLineWidth(lineWidth);
    },

    J: function(lineCap){
        this.context.setPDFLineCap(lineCap);
    },

    j: function(lineJoin){
        this.context.setPDFLineJoin(lineJoin);
    },

    M: function(miterLimit){
        this.context.setMiterLimit(miterLimit);
    },

    d: function(array, phase){
        this.context.setLineDash(phase, Array.prototype.slice.call(array, 0));
    },

    ri: function(renderingIntent){
        // TODO: 
    },

    i: function(flatness){
        // TODO: ?
    },

    gs: function(name){
        var params = this.resources.graphicsState(name);
        if (!params){
            return;
        }
        var updater;
        for (var key in params){
            updater = contextStateUpdater[key];
            if (updater){
                updater.call(this, params[key]);
            }
        }
    },

    // MARK: - Path Construction

    m: function(x, y){
        this.context.moveToPoint(x, y);
    },

    l: function(x, y){
        this.context.addLineToPoint(x, y);
    },

    c: function(c1x, c1y, c2x, c2y, x, y){
        var point = JSPoint(x, y);
        var control1 = JSPoint(c1x, c1y);
        var control2 = JSPoint(c2x, c2y);
        this.context.addCurveToPoint(point, control1, control2);
    },

    v: function(c2x, c2y, x, y){
        var point = JSPoint(x, y);
        var control1 = this.stack.state.lastPoint;
        if (!control1){
            return;
        }
        var control2 = JSPoint(c2x, c2y);
        this.context.addCurveToPoint(point, control1, control2);
    },

    y: function(c1x, c1y, x, y){
        var point = JSPoint(x, y);
        var control1 = JSPoint(c1x, c1y);
        var control2 = point;
        this.context.addCurveToPoint(point, control1, control2);
    },

    h: function(){
        this.context.closePath();
    },

    re: function(x, y, w, h){
        var rect = JSRect(x, y, w, h);
        this.context.addRect(rect);
    },

    n: function(){
        this.context.beginPath();
    },

    W: function(){
        this.context.clip(JSContext.FillRule.winding);
    },

    'W*': function(){
        this.context.clip(JSContext.FillRule.evenOdd);
    },

    // MARK: - Path Painting

    S: function(){
        this.context.strokePath();
    },

    s: function(){
        this.context.closePath();
        this.context.strokePath();
    },

    f: function(){
        this.context.fillPath(JSContext.FillRule.winding);
    },

    'f*': function(){
        this.context.fillPath(JSContext.FillRule.evenOdd);
    },

    B: function(){
        this.context.drawPath(JSContext.DrawingMode.fillStroke);
    },

    'B*': function(){
        this.context.drawPath(JSContext.DrawingMode.evenOddFillStroke);
    },

    b: function(){
        this.context.closePath();
        this.context.drawPath(JSContext.DrawingMode.fillStroke);
    },

    'b*': function(){
        this.context.closePath();
        this.context.drawPath(JSContext.DrawingMode.evenOddFillStroke);
    },

    // MARK: - Colors

    CS: function(name){
        // changing color space always defaults the color black
        this.context.setStrokeColor(JSColor.blackColor);
    },

    cs: function(name){
        // changing color space always defaults the color black
        this.context.setFillColor(JSColor.blackColor);
    },

    SC: function(){
        var space = this.stack.state.strokeColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setStrokeColor(color);
    },

    sc: function(){
        var space = this.stack.state.fillColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setFillColor(color);
    },

    SCN: function(){
        var space = this.stack.state.strokeColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setStrokeColor(color);
    },

    scn: function(){
        var space = this.stack.state.fillColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setFillColor(color);
    },

    G: function(w){
        var color = PDFColorSpace.deviceGray.colorFromComponents([w]);
        this.context.setStrokeColor(color);
    },

    g: function(w){
        var color = PDFColorSpace.deviceGray.colorFromComponents([w]);
        this.context.setFillColor(color);
    },

    RG: function(r, g, b){
        var color = PDFColorSpace.deviceRGB.colorFromComponents([r, g, b]);
        this.context.setStrokeColor(color);
    },

    rg: function(r, g, b){
        var color = PDFColorSpace.deviceRGB.colorFromComponents([r, g, b]);
        this.context.setFillColor(color);
    },

    K: function(c, m, y, k){
        var color = PDFColorSpace.deviceCMYK.colorFromComponents([c, m, y, k]);
        this.context.setFillColor(color);
    },

    k: function(c, m, y, k){
        var color = PDFColorSpace.deviceCMYK.colorFromComponents([c, m, y, k]);
        this.context.setFillColor(color);
    },

    // MARK: - External Objects (images, etc)

    Do: function(name){
        var obj = this.resources.xObject(name);
        if (!obj){
            return;
        }
        if (obj instanceof PDFImage){
            var image = obj.foundationImage;
            if (image){
                // Images are drawn at 0,0 in a 1x1 unit rect
                // We need to un-flip the coordinates first
                this.context.save();
                this.context.setFillColor(JSColor.greenColor);
                this.context.concatenate(JSAffineTransform(1, 0, 0, -1, 0, 1));
                this.context.fillRect(JSRect(0, 0, 0.5, 0.5));
                this.context.drawImage(image, JSRect(JSPoint.Zero, JSSize(1, 1)));
                this.context.restore();
            }
        }
        // TODO: other objects
    },

    EI: function(){
        // TODO: inline image
    },

    // MARK: - Text

    Tf: function(name, size){
        var pdfFont = this.resources.font(name);
        var font = pdfFont.foundationFontOfSize(size);
        this.font = font;
        if (font){
            this.context.setFont(font);
        }
    },

    Tc: function(spacing){
        this.context.setCharacterSpacing(spacing);
    },

    Tr: function(renderingMode){
        switch (renderingMode){
            case PDFGraphicsState.TextRenderingMode.fill:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fill);
                break;
            case PDFGraphicsState.TextRenderingMode.stroke:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.stroke);
                break;
            case PDFGraphicsState.TextRenderingMode.fillStroke:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fillStroke);
                break;
            case PDFGraphicsState.TextRenderingMode.invisible:
                break;
            case PDFGraphicsState.TextRenderingMode.fillAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fill);
                break;
            case PDFGraphicsState.TextRenderingMode.strokeAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.stroke);
                break;
            case PDFGraphicsState.TextRenderingMode.fillStrokeAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fillStroke);
                break;
            case PDFGraphicsState.TextRenderingMode.addPath:
                break;
        }
    },

    Tj: function(data){
        if (this.stack.state.textRenderingMode == PDFGraphicsState.TextRenderingMode.invisible){
            return;
        }
        var pdfFont = this.stack.state.font;
        if (pdfFont.Subtype == "Type3"){
            // TODO: read streams and do drawing
            return;
        }
        var font = this.font;
        if (!font){
            // FIXME: We don't have a valid font...use fallback?
            return;
        }
        // if (this.stack.state.wordSpacing !== 0){
        //     if (pdfFont.Subtype == "Type1" || pdfFont.Subtype == "TrueType" || pdfFont.Subtype == "MMType1"){
        //         contextOperationHandler._textWithSimpleWordSpacing.call(this, data, pdfFont);
        //         return;
        //     }
        //     // TODO: word spacing with Type0 fonts
        // }
        var text = pdfFont.fontCompatibleStringFromData(data);
        var textMatrix = this.stack.state.textTransform.scaledBy(this.stack.state.textHorizontalScaling, -1);
        this.context.setTextMatrix(textMatrix);
        this.context.showText(text);
        if (this.stack.state.textRenderingMode >= PDFGraphicsState.TextRenderingMode.fillAddPath && this.stack.state.textRenderingMode <= PDFGraphicsState.TextRenderingMode.addPath){
            // TODO: add glyphs to clipping path
        }
    },

    _textWithSimpleWordSpacing: function(data, pdfFont){
        var chunks = [];
        var start = 0;
        var i, l;
        for (i = 0, l = data.length; i < l; ++i){
            if (data[i] == 0x20){
                chunks.push(data.subdataInRange(JSRange(start, i - start + 1)));
                start = i + 1;
            }
        }
        if (start < data.length - 1){
            chunks.push(data.subdataInRange(JSRange(start, i - start)));
        }

        var chunk;
        var text;
        var textMatrix = this.stack.state.textTransform.scaledBy(this.stack.state.textHorizontalScaling, -1);
        var width;
        for (i = 0, l = chunks.length; i < l; ++i){
            chunk = chunks[i];
            text = pdfFont.fontCompatibleStringFromData(chunk);
            this.context.setTextMatrix(textMatrix);
            this.context.showText(text);
            width = pdfFont.widthOfData(chunk, this.stack.state.characterSpacing, this.stack.state.wordSpacing);
            textMatrix = textMatrix.translatedBy(width, 0);
        }
    }

};

var contextStateUpdater = {
    LW: function(value){
        this.context.setLineWidth(value);
    },
    LC: function(value){
        this.context.setPDFLineCap(value);
    },
    LJ: function(value){
        this.context.setPDFLineJoin(value);
    },
    ML: function(value){
        this.context.setMiterLimit(value);
    },
    D: function(value){
        this.context.setLineDash(value[1], Array.prototype.slice.call(value[0], 0));
    },
    RI: function(value){
        // TODO: ?
    },
    Font: function(value){
        var pdfFont = value[0];
        var size = value[1];
        var font = pdfFont.foundationFontOfSize(size);
        this.font = font;
        if (font){
            this.context.setFont(font);
        }
    },
    FL: function(value){
        // TODO: ?
    },
    SA: function(value){
        // TODO: ?
    },
    BM: function(value){
        // TODO: ?
    },
    CA: function(value){
        // TODO: ?
    },
    ca: function(value){
        // TODO: ?
    },
    AIS: function(value){
        // TODO: ?
    }
};


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