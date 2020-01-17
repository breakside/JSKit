// #import Foundation
// #import "PDFName.js"
// #import "PDFTokenizer.js"
// #import "PDFStreamOperation.js"
// #import "PDFGraphicsState.js"
/* global JSClass, JSObject, JSLog, JSReadOnlyProperty, PDFReader, PDFTokenizer, PDFOperationIterator, JSData, PDFStreamOperation, PDFName, PDFGraphicsStateStack */
'use strict';

(function(){

var logger = JSLog("PDFKit", "OpIterator");

JSClass('PDFOperationIterator', JSObject, {

    tokenizer: null,
    queue: null,

    _lastOperation: null,

    initWithData: function(data, resources){
        this.tokenizer = PDFTokenizer.initWithData(data);
        this.queue = [];
        this.stateStack = PDFGraphicsStateStack();
        this.resources = this.stateStack.resources = resources;
    },

    resources: null,
    stateStack: null,
    state: null,

    updateState: function(){
        if (this._lastOperation !== null){
            this.stateStack.handleOperation(this._lastOperation);
            this._lastOperation = null;
            this.state = this.stateStack.state;
        }
    },

    reset: function(){
        this.tokenizer.stream.seek(0);
    },

    next: function(){
        this.updateState();
        var operands = [];
        var compatibilityLevel = 0;
        var obj;
        // Certain operators are really just shortcut combinations of other
        // operations.  To simplify the set of operations that callers need
        // to worry about, we'll convert the shortcuts into the their longer
        // combinations.  A queue helps manage this expansion, as one token
        // may add several operations to the queue; only the first operation
        // gets returned, and remaining items are dequeued on subsequent calls
        // to next() before continuing reading tokens.
        while (this.queue.length === 0){
            var token = this.tokenizer.readMeaningfulToken();
            switch (token.toString()){

                // Operands

                case Token.true:
                    if (compatibilityLevel === 0){
                        operands.push(true);
                    }
                    break;
                case Token.false:
                    if (compatibilityLevel === 0){
                        operands.push(false);
                    }
                    break;
                case Token.integer:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.real:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.stringStart:
                case Token.hexStringStart:
                case Token.dictionaryStart:
                case Token.arrayStart:
                    obj = this.tokenizer.finishReadingObject(token);
                    if (compatibilityLevel === 0){
                        operands.push(obj);
                    }
                    break;
                case Token.commentStart:
                    this.tokenizer.finishReadingComment();
                    break;
                case Token.name:
                    if (compatibilityLevel === 0){
                        operands.push(token.pdfObject);
                    }
                    break;
                case Token.null:
                    if (compatibilityLevel === 0){
                        operands.push(null);
                    }
                    break;

                // Errors
                // (will appear to consumers like the stream ended)

                case Token.stringEnd:
                case Token.hexStringEnd:
                case Token.arrayEnd:
                case Token.dictionaryEnd:
                case Token.endOfFileComment:
                case Token.stream:
                case Token.endstream:
                case Token.obj:
                case Token.endobj:
                case Token.xref:
                case Token.trailer:
                case Token.startxref:
                case Token.indirect:
                case Op.imageData:
                case Op.endImage:
                    logger.warn("Unexpected token in stream: %{public} @ 0x%08X", token, this.tokenizer.stream.offset);
                    this.queue.push(null);
                    break;
                case Token.endOfData:
                    this.queue.push(null);
                    break;

                // Compatibility

                case Op.beginCompatibility:
                    ++compatibilityLevel;
                    break;
                case Op.endCompatibility:
                    if (compatibilityLevel === 0){
                        this._lastOperation = null;
                        return null;
                    }
                    --compatibilityLevel;
                    break;

                // Inline Images

                case Op.beginImage:
                    if (compatibilityLevel === 0){
                        try{
                            obj = this.finishReadingInlineImage();
                            if (obj === null){
                                this._lastOperation = null;
                                return null;
                            }
                        }catch (e){
                            this._lastOperation = null;
                            return null;
                        }
                        this.queue.push(PDFStreamOperation(Op.endImage, [obj]));
                    }
                    break;

                // Text
                // Special cases that are really just combinations of other
                // operators.  Handling them here makes it easier on readers
                // since they'll only have to handle the simpler cases.

                case Op.nextLineText:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(Op.nextLine, []));
                        this.queue.push(PDFStreamOperation(Op.text, operands));
                    }
                    break;
                case Op.nextLineTextSpacing:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(Op.wordSpacing, [operands[0]]));
                        this.queue.push(PDFStreamOperation(Op.characterSpacing, [operands[1]]));
                        this.queue.push(PDFStreamOperation(Op.nextLine, []));
                        this.queue.push(PDFStreamOperation(Op.text, [operands[2]]));
                    }
                    break;
                case Op.textArray:
                    // For `[(abc) 1 (def) 2 (ghi) 3] TJ` operations, we'll make up a new
                    // operator, `xTextAdvance`, that should adjust the text matrix, but
                    // not the text line matrix.  The Tm operator won't do because it uses
                    // absolute instead of relative values and update the line matrix too.
                    // This way, consumers of operations will only ever see a single kind
                    // of text drawing operator, Tj, simplifying their logic.
                    if (compatibilityLevel === 0){
                        for (var i = 0, l = operands[0].length; i < l; ++i){
                            var op = operands[0][i];
                            if (typeof(op) == 'number'){
                                // TODO: consider vertical writing direction and set y instead of x if applicable (should be negative to move down)
                                // TODO: consider RTL writing direction and set x to negative to move left
                                this.queue.push(PDFStreamOperation(Op.xTextAdvance, [op, 0]));
                            }else{
                                this.queue.push(PDFStreamOperation(Op.text, [op]));
                            }
                        }
                    }
                    break;

                // Aliases
                // (operators that are really just aliases for others)

                case Token.fillPathAlias:
                    this.queue.push(PDFStreamOperation(Op.fillPath));
                    break;

                // Functions

                case Token.functionStart:
                    this.queue.push(PDFStreamOperation(Op.beginFunction, operands));
                    break;
                case Token.functionEnd:
                    this.queue.push(PDFStreamOperation(Op.endFunction, operands));
                    break;

                // TODO: Marked Content

                // Operators
                // (allowing any operator, even unknown, to be read by caller)

                default:
                    if (compatibilityLevel === 0){
                        this.queue.push(PDFStreamOperation(token, operands));
                    }
                    break;
            }
        }
        // TODO: validate known operations (argument lengths and types)
        this._lastOperation = this.queue.shift();
        return this._lastOperation;
    },

    finishReadingInlineImage: function(){
        var token = this.tokenizer.readMeaningfulToken(Token.name, Op.imageData);
        var parameters = {};
        var key;
        var value;
        var data = null;
        while (token != Op.imageData){
            key = token.pdfObject;
            value = this.tokenizer.readObject();
            parameters[key] = value;
            token = this.tokenizer.readMeaningfulToken(Token.name, Op.imageData);
        }

        var filters = parameters.Filter || parameters.F;
        if (!filters){
            var w = parameters.Width || parameters.W || 0;
            var h = parameters.Height || parameters.H || 0;
            var bitsPerComponent = parameters.BitsPerComponent || parameters.BPC || 8;
            var colorSpace = parameters.ColorSpace || parameters.CS || null;
            var components = 0;
            if (colorSpace !== null){
                switch (colorSpace.toString()){
                    case "DeviceGray":
                    case "G":
                        components = 1;
                        break;
                    case "DeviceRGB":
                    case "RGB":
                        components = 3;
                        break;
                    case "DeviceCMYK":
                    case "CMYK":
                        components = 4;
                        break;
                    default:
                        // Ugh, need to lookup in resources, which we don't have
                        break;
                }
            }
            var count;
            if (components !== 0){
                count = w * h * components * bitsPerComponent / 8;
                data = this.tokenizer.stream.read(count);
                this.tokenizer.readMeaningfulToken(Op.endImage);
            }else{
                // We don't know the number of components, but it should be 1..4
                count = w * h * bitsPerComponent / 8;

                // Trying 1...
                data = this.tokenizer.stream.read(count);
                var offset = this.tokenizer.stream.offset;
                try{
                    this.tokenizer.readMeaningfulToken(Op.endImage);
                }catch (e){
                    // Trying 2...
                    this.tokenizer.stream.seek(offset);
                    var data2 = this.tokenizer.stream.read(count);
                    offset = this.tokenizer.stream.offset;
                    try{
                        this.tokenizer.readMeaningfulToken(Op.endImage);
                        data = JSData.initWithChunks([data, data2]);
                    }catch (e2){
                        // Trying 3...
                        this.tokenizer.stream.seek(offset);
                        var data3 = this.tokenizer.stream.read(count);
                        offset = this.tokenizer.stream.offset;
                        try{
                            this.tokenizer.readMeaningfulToken(Op.endImage);
                            data = JSData.initWithChunks([data, data2, data3]);
                        }catch (e3){
                            // Trying 4...
                            this.tokenizer.stream.seek(offset);
                            var data4 = this.tokenizer.stream.read(count);
                            data = JSData.initWithChunks([data, data2, data3, data4]);
                            this.tokenizer.readMeaningfulToken(Op.endImage);
                        }
                    }
                }
            }
        }else{
            if (filters instanceof PDFName){
                filters = [filters];
            }
            switch (filters[0]){
                case "ASCIIHexDecode":
                case "AHx":
                case "ASCII85Decode":
                case "A85":
                    // TODO: scan for >
                    break;
                default:
                    // TODO: scan for EI?
                    // Filters should be able to tell when the reach their end of data
                    // perhaps the filter code needs to be updated to be more incremental
                    // so it can tell us when it's done rather than us having to know the
                    // length of the input data
                    break;
            }
        }
        var byte = this.tokenizer.stream.byte();
        var foundE = false;
        while (byte !== null){
            if (foundE && byte == 0x49){
                break;
            }
            foundE = byte == 0x45;
            byte = this.tokenizer.stream.byte();
        }
        // FIXME: should collect data, decode, and return
        return {parameters: parameters, data: data};
    },

    close: function(){
        if (this.resources){
            this.resources.unload();
        }
    }

});

var Token = PDFTokenizer.Token;
var Op = PDFStreamOperation.Operator;

})();