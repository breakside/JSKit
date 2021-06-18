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
// #import ImageKit
// #import "PDFWriter.js"
// #import "PDFTypes.js"
// #import "JSColor+PDF.js"
// #import "JSRect+PDF.js"
'use strict';

(function(){

// Note: PDF coordinates default to 0,0 in the lower left corner.
// However, this context will automatically flip the coordinates so
// 0,0 is in the upper left corner, like the default for the other 
// drawing contexts in JSKit.  This also includes flipping text
// and images automatically, too.  So even if you were to unflip
// back to default PDF coordinates, text and images would then
// be upside down (just as if you were to flip an HTML canvas context,
// for example).  Overall, it made more sense to change this PDF
// context to match the others than to change the others to match PDF.

JSClass("PDFContext", JSContext, {

    _document: null,
    _pages: null,
    _page: null,
    _content: null,
    _writer: null,
    _dpi: 72,
    _defaultPageWidthInInches: 8.5,
    _defaultPageHeightInInches: 11,

    _fontInfo: null,
    _nextFontNumber: 1,

    _imageInfo: null,
    _nextImageNumber: 1,

    // ----------------------------------------------------------------------
    // MARK: - Creating a PDF Context

    initWithURL: function(url, mediaBox){
        var stream = PDFWriterFileStream.initWithURL(url);
        this.initWithStream(stream, mediaBox);
    },

    initWithStream: function(stream, mediaBox){
        PDFContext.$super.init.call(this);
        this._fontInfo = {};
        this._imageInfo = {};
        if (mediaBox === undefined){
            mediaBox = JSRect(0, 0, this._dpi * this._defaultPageWidthInInches, this._dpi * this._defaultPageHeightInInches);
        }
        this._writer = PDFWriter.initWithStream(stream);
        this._document = PDFDocument();
        this._pages = PDFPages();
        this._pages.Resources = PDFResources();
        this._pages.MediaBox = mediaBox.pdfRectangle();
        this._writer.indirect(this._pages, this._pages.Resources);
        this._document.Pages = this._pages.indirect;
    },

    // ----------------------------------------------------------------------
    // MARK: - Adjusting Default coordinates

    flipCoordinates: function(){
        if (this._page === null){
            throw new Error("Invlaid state.  Make sure to call beginPage() first");
        }
        var mediaBox = this._page.MediaBox || this._pages.MediaBox;
        this.concatenate(JSAffineTransform.Flipped(mediaBox[3] - mediaBox[1]));
    },

    // ----------------------------------------------------------------------
    // MARK: - Managing Pages & Document

    beginPage: function(options){
        if (options === undefined){
            options = {};
        }
        this.endPage();
        this._page = PDFPage();
        this._page.Parent = this._pages.indirect;
        this._page.Resources = PDFResources();
        if (options.mediaBox !== undefined){
            this._page.MediaBox = options.mediaBox.pdfRectangle();
        }
        this._createNewContentStream();
        this._writer.indirect(this._page, this._page.Resources);
        this.save();

        // exact equivalence to false means the default (undefined) is true
        if (options.usePDFCoordinates !== true){
            this.flipCoordinates();
        }
    },

    endPage: function(){
        if (this._page === null){
            return;
        }

        this.restore();
        this._endContentStream();
        this._writer.writeObject(this._page.Resources);
        this._writer.writeObject(this._page);

        this._pages.Kids.push(this._page.indirect);
        this._pages.Count += 1;
        this._page = null;
    },

    endDocument: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.endPage();
        var writer = this._writer;
        var queue = PDFJobQueue();
        queue.addJob(this, this._populateFontResources);
        queue.addJob(this, this._populateImageResources);
        queue.addJob(this, this._finalizeDocument);
        queue.done = queue.error = function(){
            writer.close(completion, target);
        };
        queue.execute();
        return completion.promise;
    },

    _populateImageResources: function(job){
        var infos = [];
        for (var objId in this._imageInfo){
            infos.push(this._imageInfo[objId]);
        }
        if (infos.length > 0){
            if (this._pages.Resources.XObject === null){
                this._pages.Resources.XObject = {};
            }
            var imageJob;
            for (var i = infos.length - 1; i >= 0; --i){
                imageJob = job.queue.insertJob(this, this._populateImageResource);
                imageJob.imageInfo = infos[i];
            }
        }
        job.complete();
    },

    _populateImageResource: function(job){
        var info = job.imageInfo;
        var image = info.image;
        var xobjects = this._pages.Resources.XObject;
        var writer = this._writer;
        var pdfimage = PDFImage();
        pdfimage.Length = writer.createIndirect();
        image.getBitmap(function(bitmap){
            if (bitmap === null){
                throw new Error("null bitmap");
            }
            pdfimage.Width = bitmap.size.width;
            pdfimage.Height = bitmap.size.height;
            // TODO: embed icc profile from bitmap, if present
            pdfimage.ColorSpace = PDFName("DeviceRGB");
            pdfimage.BitsPerComponent = 8;
            writer.beginStreamObject(pdfimage);
            // TODO: compress the stream
            var length = 0;
            var offset = 0;
            var stream = writer.stream;
            for (var row = 0; row < bitmap.size.height; ++row){
                for (var col = 0; col < bitmap.size.width; ++col){
                    // FIXME: doesn't advance writer._offset
                    stream.write(bitmap.data, offset, 3);
                    offset += 4;
                    length += 3;
                }
            }
            writer.endStreamObject();
            pdfimage.Length.resolvedValue = length;
            writer.writeObject(pdfimage.Length);
            xobjects[info.resourceName] = pdfimage.indirect;
            job.complete();
        });
    },

    _populateFontResources: function(job){
        var infos = [];
        var i, l;
        for (var postScriptName in this._fontInfo){
            for (i = 0, l = this._fontInfo[postScriptName].length; i < l; ++i){
                infos.push(this._fontInfo[postScriptName][i]);
            }
        }
        if (infos.length > 0){
            this._pages.Resources.Font = {};
            var fontJob;
            for (i = infos.length - 1; i >= 0; --i){
                fontJob = job.queue.insertJob(this, this._populateFontResource);
                fontJob.fontInfo = infos[i];
            }
        }
        job.complete();
    },

    _populateFontResource: function(job){
        var info = job.fontInfo;
        info.descriptor.getData(function(otfData){
            var fullOTF = FNTOpenTypeFont.initWithData(otfData);
            var cmap = FNTOpenTypeFontCmap0.initWithSingleByteEncoding(info.singleByteEncoding);
            fullOTF.getFontSubsetWithGlyphs(info.baseGlyphs, info.postScriptName, [[1, 0, cmap]], function(subsetOTF){
                var pdfFontFile = PDFFontFileStream();
                pdfFontFile.Subtype = PDFName("OpenType");
                pdfFontFile.Length = this._writer.createIndirect();
                pdfFontFile.Length1 = subsetOTF.data.length;
                this._writer.beginStreamObject(pdfFontFile);
                this._writer.writeStreamData(subsetOTF.data);
                this._writer.endStreamObject();
                pdfFontFile.Length.resolvedValue = subsetOTF.data.length;
                this._writer.writeObject(pdfFontFile.Length);

                var os2 = subsetOTF.tables["OS/2"];
                var head = subsetOTF.tables.head;
                var pdfDescriptor = PDFFontDescriptor();
                pdfDescriptor.FontName = PDFName(info.postScriptName);
                switch (os2.usWidthClass){
                    case 1:
                        pdfDescriptor.FontStretch = PDFName("UltraCondensed");
                        break;
                    case 2:
                        pdfDescriptor.FontStretch = PDFName("ExtraCondensed");
                        break;
                    case 3:
                        pdfDescriptor.FontStretch = PDFName("Condensed");
                        break;
                    case 4:
                        pdfDescriptor.FontStretch = PDFName("SemiCondensed");
                        break;
                    case 5:
                        pdfDescriptor.FontStretch = PDFName("Normal");
                        break;
                    case 6:
                        pdfDescriptor.FontStretch = PDFName("SemiExpanded");
                        break;
                    case 7:
                        pdfDescriptor.FontStretch = PDFName("Expanded");
                        break;
                    case 8:
                        pdfDescriptor.FontStretch = PDFName("ExtraExpanded");
                        break;
                    case 9:
                        pdfDescriptor.FontStretch = PDFName("UltraExpanded");
                        break;
                }
                pdfDescriptor.FontWeight = os2.usWeightClass;
                pdfDescriptor.Flags = 0;
                pdfDescriptor.ItalicAngle = 0;
                if ((os2.fsSelection & 0x0001) === 0x0001){
                    pdfDescriptor.Falgs |= PDFFontDescriptor.Flags.italic;
                    pdfDescriptor.ItalicAngle = -30;
                }
                pdfDescriptor.FontBBox = PDFArray([
                    head.xMin,
                    head.yMin,
                    head.xMax,
                    head.yMax
                ]);
                pdfDescriptor.Ascent = os2.sTypoAscender;
                pdfDescriptor.Descent = os2.sTypoDescender;
                pdfDescriptor.CapHeight = os2.sCapHeight;
                pdfDescriptor.XHeight = os2.sxHeight;
                pdfDescriptor.StemV = info.estimatedStemV;
                pdfDescriptor.FontFile3 = pdfFontFile.indirect;
                this._writer.writeObject(pdfDescriptor);

                var widthValues = [];
                for (var i = info.firstCode; i <= info.lastCode; ++i){
                    widthValues.push(info.pdfWidthOfGlyph(info.singleByteEncoding[i]));
                }
                var pdfWidths = PDFArray(widthValues);
                this._writer.writeObject(pdfWidths);

                var pdfFont = PDFTrueTypeFont();
                pdfFont.BaseFont = PDFName(info.postScriptName);
                pdfFont.FirstChar = info.firstCode;
                pdfFont.LastChar = info.lastCode;
                pdfFont.Widths = pdfWidths.indirect;
                pdfFont.FontDescriptor = pdfDescriptor.indirect;
                this._writer.writeObject(pdfFont);
                this._pages.Resources.Font[info.resourceName] = pdfFont.indirect;
                job.complete();

            }, this);
        }, this);
    },

    _finalizeDocument: function(job){
        this._writer.writeObject(this._pages.Resources);
        this._writer.writeObject(this._pages);
        this._writer.writeObject(this._document);
        job.complete();
    },

    _createNewContentStream: function(){
        this._endContentStream();
        this._content = PDFStream();
        this._content.Length = this._writer.createIndirect();
        this._writer.beginStreamObject(this._content);
        this._page.Contents = this._content.indirect;
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

    createPath: function(){
        return PDFContextPath.initWritingToPDFContext(this);
    },

    beginPath: function(){
        PDFContext.$super.beginPath.call(this);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this._writeStreamData("f ");
                break;
            case JSContext.DrawingMode.evenOddFill:
                this._writeStreamData("f* ");
                break;
            case JSContext.DrawingMode.stroke:
                this._writeStreamData("S ");
                break;
            case JSContext.DrawingMode.fillStroke:
                this._writeStreamData("B ");
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this._writeStreamData("B* ");
                break;
        }
        this.beginPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        // TODO: overpaint with white?  Throw exception?  Shouldn't really be called for PDFs
    },

    fillMaskedRect: function(rect, maskImage){
        // TODO:
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        // TODO: pdf images
        // TODO: support svg images (perhaps by compiling them to PDF)
        // TODO: stretchable images
        var info = this._infoForImage(image);
        this.save();
        var transform = JSAffineTransform.Translated(rect.origin.x, rect.origin.y + rect.size.height).scaledBy(rect.size.width, -rect.size.height);
        this.concatenate(transform);
        this._writeStreamData("%N Do ", info.resourceName);
        this.restore();
    },

    _infoForImage: function(image){
        var info = this._imageInfo[image.objectID];
        if (!info){
            info = this._imageInfo[image.objectID] = PDFImageInfo(image);
            info.resourceName = PDFName("IM%d".sprintf(this._nextImageNumber++));
        }
        return info;
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

    setTextDrawingMode: function(textDrawingMode){
        this._writeStreamData("%n Tr ", textDrawingMode);
    },

    showGlyphs: function(glyphs){
        // TODO: if any glyphs are bitmaps (like in emoji fonts), might need to draw them as images
        var operation = this._textOperationForShowingGlyphs(glyphs, this.state.font.descriptor);
        var tm = this.state.textMatrix;
        this._writeStreamData("BT %N %n Tf ", operation.fontResourceName, this.state.font.pointSize);
        this._writeStreamData("%n %n %n %n %n %n Tm ", tm.a, tm.b, tm.c, -tm.d, tm.tx, tm.ty);
        this._writeStreamData("%S Tj ", operation.string);
        this._writeStreamData("ET ");
    },

    _textOperationForShowingGlyphs: function(glyphs, descriptor){
        var info = this._fontInfoForGlyphs(glyphs, descriptor);
        var operation = {
            fontResourceName: info.resourceName,
            string: ""
        };
        var character;
        for (var i = 0, l = glyphs.length; i < l; ++i){
            character = info.codeForBaseGlyph(glyphs[i]);
            operation.string += String.fromCharCode(character);
        }
        return operation;
    },

    _fontInfoForGlyphs: function(glyphs, descriptor){
        var infos = this._fontInfo[descriptor.postScriptName];
        if (!infos){
            this._fontInfo[descriptor.postScriptName] = infos = [];
        }
        var info = null;
        var candidate;
        for (var i = 0, l = infos.length; i < l && info === null; ++i){
            candidate = infos[i];
            if (candidate.includeBaseGlyphs(glyphs)){
                info = candidate;
            }
        }
        if (info === null){
            info = PDFFontInfo(descriptor);
            if (info.includeBaseGlyphs(glyphs)){
                info.resourceName = PDFName("F%d".sprintf(this._nextFontNumber++));
                infos.push(info);
            }else{
                // TODO: support CID fonts
                throw new Error("Cannot represent all glyphs with a simple font");
            }
        }
        return info;
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    setAlpha: function(alpha){
        PDFContext.$super.setAlpha.call(this, alpha);
        // TODO: adjust state parameter dictionary with alpha
    },

    setFillColor: function(fillColor){
        PDFContext.$super.setFillColor.call(this, fillColor);
        this._writeStreamData(fillColor.pdfFillColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setStrokeColor: function(strokeColor){
        PDFContext.$super.setStrokeColor.call(this, strokeColor);
        this._writeStreamData(strokeColor.pdfStrokeColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setShadow: function(offset, blur, color){
        PDFContext.$super.setShadow.call(this, offset, blur, color);
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

    concatenate: function(tm){
        PDFContext.$super.concatenate.call(this, tm);
        this._writeStreamData("%n %n %n %n %n %n cm ", tm.a, tm.b, tm.c, tm.d, tm.tx, tm.ty);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        PDFContext.$super.setLineWidth.call(this, lineWidth);
        this._writeStreamData("%s w ".sprintf(lineWidth));
    },

    setLineCap: function(lineCap){
        PDFContext.$super.setLineCap.call(this, lineCap);
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
        PDFContext.$super.setLineJoin.call(this, lineJoin);
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
        PDFContext.$super.setMiterLimit.call(this, miterLimit);
        this._writeStreamData("%n M ", miterLimit);
    },

    setLineDash: function(phase, lengths){
        PDFContext.$super.setLineDash.call(this, phase, lengths);
        var lengthsStr = "";
        for (var i = 0, l = lengths.length; i < l; ++i){
            lengthsStr += this._writer.format("%n ", lengths[i]);
        }
        this._writeStreamData("[ %s] %n d ", lengthsStr, phase);
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        PDFContext.$super.save.call(this);
        this._writeStreamData("q ");
    },

    restore: function(){
        PDFContext.$super.restore.call(this);
        this._writeStreamData("Q ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Private Helpers

    _writeStreamData: function(data){
        if (this._content === null){
            throw new Error("Cannot perform operation, invalid state.  Make sure to call beginPage() first.");
        }
        if (typeof(data) === 'string'){
            if (arguments.length > 1){
                data = this._writer.format.apply(this._writer, arguments);
            }
            if (data[data.length - 1] != " "){
                data += " ";
            }
            data = data.utf8();
        }
        this._writer.writeStreamData(data);
        this._content.Length.resolvedValue += data.length;
    },

});

var PDFFontInfo = function(descriptor){
    if (this === undefined){
        return new PDFFontInfo(descriptor);
    }
    this.descriptor = descriptor;
    // For a font subset, the PostScript name of the font -- 
    // the value of the font’s BaseFont entry and the font 
    // descriptor’s FontName entry -- shall begin with a tag 
    // followed by a plus sign (+). The tag shall consist of exactly
    // six uppercase letters; the choice of letters is arbitrary, 
    // but different subsets in the same PDF file shall have
    // different tags.
    this.postScriptName = "%s+%s".sprintf(PDFFontInfo.subsetPrefix(), descriptor.postScriptName);
    this.baseGlyphs = [0];
    this.firstCode = 0;
    this.lastCode = 0;
    this.codesByBaseGlyph = {};
    this.resourceName = null;
    this.singleByteEncoding = [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ];
    this.nextCode = 0x80;
    this.estimatedStemV = 50 + Math.round((Math.max(100, Math.min(900, descriptor.weight)) - 100) / 4);
};

PDFFontInfo.subsetPrefix = function(){
    var str = "";
    for (var i = 0; i < 6; ++i){
        str += String.fromCharCode(0x41 + Math.floor(Math.random() * 26));
    }
    return str;
};

PDFFontInfo.prototype = {

    pdfWidthOfBaseGlyph: function(baseGlyph){
        var emWidth = this.descriptor.widthOfGlyph(baseGlyph);
        return emWidth * 1000 / this.descriptor.unitsPerEM;
    },

    pdfWidthOfGlyph: function(glyph){
        return this.pdfWidthOfBaseGlyph(this.baseGlyphs[glyph]);
    },

    includeBaseGlyphs: function(baseGlyphs){
        for (var i = 0, l = baseGlyphs.length; i < l; ++i){
            if (!this._includeBaseGlyph(baseGlyphs[i])){
                return false;
            }
        }
        return true;
    },

    codeForBaseGlyph: function(baseGlyph){
        return this.codesByBaseGlyph[baseGlyph] || 0;
    },

    _allocateCodeForBaseGlyph: function(baseGlyph){
        var character = this.descriptor.characterForGlyph(baseGlyph);
        if (character.code < 0x80){
            return character.code;
        }
        return this.nextCode++;
    },

    _includeBaseGlyph: function(baseGlyph){
        if (baseGlyph === 0){
            return true;
        }
        var code = this.codesByBaseGlyph[baseGlyph];
        if (code !== undefined){
            return true;
        }
        code = this._allocateCodeForBaseGlyph(baseGlyph);
        if (code > 0xFF){
            return false;
        }
        var glyph = this.baseGlyphs.length;
        this.codesByBaseGlyph[baseGlyph] = code;
        this.baseGlyphs.push(baseGlyph);
        this.singleByteEncoding[code] = glyph;
        if (this.firstCode === 0 && this.lastCode === 0){
            this.firstCode = this.lastCode = code;
        }else if (code < this.firstCode){
            this.firstCode = code;
        }else if (code > this.lastCode){
            this.lastCode = code;
        }
        return true;
    }
};

var PDFImageInfo = function(image){
    if (this === undefined){
        return new PDFImageInfo(image);
    }
    this.image = image;
    this.resourceName = null;
};

PDFImageInfo.prototype = {
};

var PDFJobQueue = function(){
    if (this === undefined){
        return new PDFJobQueue();
    }
    this._currentJobIndex = -1;
    this._jobs = [];
};

PDFJobQueue.prototype = {

    error: function(){
    },

    done: function(){
    },

    addJob: function(target, action){
        var job = PDFJob(this, target, action);
        this._jobs.push(job);
        return job;
    },

    insertJob: function(target, action){
        var job = PDFJob(this, target, action);
        this._jobs.splice(this._currentJobIndex + 1, 0, job);
        return job;
    },

    execute: function(){
        this._runNextJob();
    },

    _runNextJob: function(){
        ++this._currentJobIndex;
        if (this._currentJobIndex == this._jobs.length){
            this._cleanup();
            this.done();
            return;
        }
        this._jobs[this._currentJobIndex].run();
    },

    _jobDidComplete: function(){
        this._runNextJob();
    },

    _jobDidError: function(){
        this._cleanup();
        this.error();
    },

    _cleanup: function(){
        this._jobs = [];
        this._currentJobIndex = -1;
    }

};

var PDFJob = function(queue, target, action){
    if (this === undefined){
        return new PDFJob(queue, target, action);
    }
    this.queue = queue;
    this.resourceName = null;
    this._target = target;
    this._action = action;
};

PDFJob.prototype = {
    run: function(){
        this._action.call(this._target, this);
    },

    complete: function(){
        this.queue._jobDidComplete();
    },

    error: function(){
        this.queue._jobDidError();
    }
};

JSClass("PDFContextPath", JSPath, {

    initWritingToPDFContext: function(context){
        PDFContextPath.$super.init.call(this);
        this.context = context;
        this.context._writeStreamData("n ");
    },

    moveToPoint: function(point, transform){
        PDFContextPath.$super.moveToPoint.call(this, point, transform);
        this.context._writeStreamData("%n %n m ", point.x, point.y);
    },

    addLineToPoint: function(point, transform){
        PDFContextPath.$super.addLineToPoint.call(this, point, transform);
        this.context._writeStreamData("%n %n l ", point.x, point.y);
    },

    addCurveToPoint: function(point, control1, control2, transform){
        PDFContextPath.$super.addCurveToPoint.call(this, point, control1, control2, transform);
        this.context._writeStreamData("%n %n %n %n %n %n c ", control1.x, control1.y, control2.x, control2.y, point.x, point.y);
    },

    closeSubpath: function(){
        PDFContextPath.$super.closeSubpath.call(this);
        this.context._writeStreamData("h ");
    }

});

})();