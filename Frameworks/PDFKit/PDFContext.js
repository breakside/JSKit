// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFWriter.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/JSColor+PDF.js"
/* global JSClass, JSContext, PDFContext, PDFWriter, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFNameObject, PDFStreamObject, JSAffineTransform */
'use strict';

JSClass("PDFContext", JSContext, {

    _document: null,
    _pages: null,
    _page: null,
    _content: null,
    _writer: null,

    // ----------------------------------------------------------------------
    // MARK: - Creating a PDF Context

    initWithFilename: function(filename){
        // TODO: create file stream and initWithStream
    },

    initWithStream: function(stream){
        PDFContext.$super.init.call(this);
        this._writer = PDFWriter.initWithStream(stream);
        this._document = PDFDocumentObject();
        this._pages = PDFPageTreeNodeObject();
        this._writer.indirect(this._pages);
        this._document.Pages = this._pages.indirect;
    },

    // ----------------------------------------------------------------------
    // MARK: - Managing Pages & Document

    beginPage: function(){
        this.endPage();
        this._page = PDFPageObject();
        this._page.Parent = this._pages.indirect;
        this._page.Resources = PDFResourcesObject();
        this._createNewContentStream();
        this._writer.indirect(this._page, this._page.Resources);
    },

    endPage: function(){
        if (this._page === null){
            return;
        }

        this._endContentStream();
        this._page.normalizeContent();
        this._writer.writeObject(this._page.Resources);
        this._writer.writeObject(this._page);

        this._pages.Kids.push(this._page.indirect);
        this._pages.Count += 1;
        this._page = null;
    },

    endDocument: function(callback){
        this.endPage();
        this._writer.writeObject(this._pages);
        this._writer.writeObject(this._document);
        this._writer.close(callback);
    },

    _createNewContentStream: function(){
        this._endContentStream();
        this._content = PDFStreamObject();
        this._content.Length = this._writer.createIndirect();
        this._writer.beginStreamObject(this._content);
        this._page.Contents.push(this._content.indirect);
        this._content.Length.resolvedValue = 0;
    },

    _endContentStream: function(){
        if (this._content === null){
            return;
        }
        this._writer.endStreamObject();
        this._writer.writeObject(this._content.Length);
        this._content = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    beginPath: function(){
        PDFContext.$super.beginPath.call(this);
        this._writeStreamData("n ");
    },

    moveToPoint: function(x, y){
        PDFContext.$super.moveToPoint.call(this, x, y);
        this._writeStreamData("%n %n m ", x, y);
    },

    addLineToPoint: function(x, y){
        PDFContext.$super.addLineToPoint.call(this, x, y);
        this._writeStreamData("%n %n l ", x, y);
    },

    addRect: function(rect){
        this._rememberPoint(rect.origin);
        this._writeStreamData("%n %n %n %n re ", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    addCurveToPoint: function(point, control1, control2){
        PDFContext.$super.addCurveToPoint.call(this, point, control1, control2);
        this._writeStreamData("%n %n %n %n %n %n c ", control1.x, control1.y, control2.x, control2.y, point.x, point.y);
    },

    addQuadraticCurveToPoint: function(point, control){
        this._rememberPoint(point);
        this._writeStreamData("%n %n %n %n y ", control.x, control.y, point.x, point.y);
    },

    closePath: function(){
        PDFContext.$super.closePath.call(this);
        this._writeStreamData("h ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this.fillPath(JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFill:
                this.fillPath(JSContext.FillRule.evenOdd);
                break;
            case JSContext.DrawingMode.stroke:
                this.strokePath();
                break;
            case JSContext.DrawingMode.fillStroke:
                this._writeStreamData("B ");
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this._writeStreamData("B* ");
                break;
        }
    },

    fillPath: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this._writeStreamData("f* ");
        }else{
            this._writeStreamData("f ");
        }
    },

    strokePath: function(){
        this._writeStreamData("S ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        // TODO: overpaint with white?  Throw exception?  Shouldn't really be called for PDFs
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        // TODO:
        // 1. Add imgage data to PDF ad a resource
        // 2. /ImageName Do
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        // TODO: (Section 8.7.4, Shading)
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO: (Section 8.7.4, Shading)
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    setTextMatrix: function(textMatrix){
        PDFContext.$super.setTextMatrix.call(this, textMatrix);
        // TODO: PDF command
    },

    setTextPosition: function(textPosition){
        PDFContext.$super.setTextPosition.call(this, textPosition);
        // TODO: PDF command
    },

    setFont: function(font){
        // TODO: PDF command
    },

    setTextDrawingMode: function(textDrawingMode){
        // TODO: PDF command
    },

    showGlyphs: function(glyphs, points){
        // TODO: PDF command
        // TODO: remember which glyphs are used so we can slice the font
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    setAlpha: function(alpha){
        // TODO: adjust state parameter dictionary with alpha
    },

    setFillColor: function(fillColor){
        this._writeStreamData(fillColor.pdfFillColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setStrokeColor: function(strokeColor){
        this._writeStreamData(strokeColor.pdfStrokeColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setShadow: function(offset, blur, color){
        // Doesn't seem to be a supported operation in PDF
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this._writeStreamData("W* ");
        }else{
            this._writeStreamData("W ");
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        this.concatenate(JSAffineTransform.Scaled(sx, sy));
    },

    rotateBy: function(angle){
        this.concatenate(JSAffineTransform.Rotated(angle));
    },

    translateBy: function(tx, ty){
        this.concatenate(JSAffineTransform.Translated(tx, ty));
    },

    concatenate: function(tm){
        this._writeStreamData("%n %n %n %n %n %n cm ", tm.a, tm.b, tm.c, tm.d, tm.tx, tm.ty);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this._writeStreamData("%s w ".sprintf(lineWidth));
    },

    setLineCap: function(lineCap){
        switch (lineCap){
            case JSContext.LineCap.butt:
                this._writeStreamData("0 J ");
                break;
            case JSContext.LineCap.round:
                this._writeStreamData("1 J ");
                break;
            case JSContext.LineCap.square:
                this._writeStreamData("2 J ");
                break;
        }
    },

    setLineJoin: function(lineJoin){
        switch (lineJoin){
            case JSContext.LineJoin.miter:
                this._writeStreamData("0 j ");
                break;
            case JSContext.LineJoin.round:
                this._writeStreamData("1 j ");
                break;
            case JSContext.LineJoin.bevel:
                this._writeStreamData("2 j ");
                break;
        }
    },

    setMiterLimit: function(miterLimit){
        this._writeStreamData("%n M ", miterLimit);
    },

    setLineDash: function(phase, lengths){
        var lengthsStr = "";
        for (var i = 0, l = lengths.length; i < l; ++i){
            lengthsStr += this._writer.format("%n ", lengths[i]);
        }
        this._writeStreamData("[ %s] %n d ", lengthsStr, phase);
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        this._writeStreamData("q ");
    },

    restore: function(){
        this._writeStreamData("Q ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Private Helpers

    _writeStreamData: function(data){
        if (typeof(data) === 'string'){
            if (data.charAt(data.length - 1) != " "){
                data += " ";
            }
            if (arguments.length > 1){
                data = this._writer.format.apply(this._writer, arguments);
            }
            data = data.utf8();
        }
        this._writer.writeStreamData(data);
        this._content.Length.resolvedValue += data.length;
    },

});