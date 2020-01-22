// #import Foundation
// #import "PDFStream.js"
// #import "PDFOperationIterator.js"
'use strict';

(function(){

JSGlobalObject.PDFFunctionSampled = function(){
    if (this === undefined){
        return new PDFFunctionSampled();
    }
};

JSGlobalObject.PDFFunctionSampled.prototype = Object.create(PDFStream.prototype, {
    FunctionType:       PDFObjectProperty,
    Domain:             PDFObjectProperty,
    Range:              PDFObjectProperty,
    Size:               PDFObjectProperty,
    BitsPerSample:      PDFObjectProperty,
    Order:              PDFObjectProperty,
    Encode:             PDFObjectProperty,
    Decode:             PDFObjectProperty,

    call: {
        value: function PDFFunctionSampled_call(x){
            var i, l;
            x = x.slice(0); // copy input so we don't change original
            var d = 0;
            for (i = 0, l = x.length; i < l; ++i, d += 2){
                x[i] = Math.min(Math.max(x[i], this.Domain[d]), this.Domain[d + 1]);
                x[i] = interpolate(x[i], this.Domain[d], this.Domain[d + 1], this.Encode[d], this.Encode[d + 1]);
                x[i] = Math.min(Math.max(x[i], 0), this.Size[i] - 1);
            }
            var n = this.Range.length / 2;
            var s = 0;
            for (i = 0, l = x.length; i < l; ++i){
                s += Math.round(x[i]); // TODO: should actually interpolate
                s *= n;
            }
            var y = [];
            var max = 1;
            d = 0;
            for (i = 0; i < n; ++i, d += 2){
                y[i] = this._samples[s++];
                y[i] = interpolate(y[i], 0, this.maxY, this.Decode[d], this.Decode[d + 1]);
                y[i] = Math.min(Math.max(y[i], this.Range[d]), this.Range[d + 1]);
            }
            return y;
        }
    },

    _samples: {
        writable: true,
        value: null
    },

    maxY: {
        writable: true,
        value: 0
    },

    load: {
        value: function PDFFunctionSampled_load(completion, target){
            switch (this.BitsPerSample){
                case 1:
                    this.maxY = 0x1;
                    break;
                case 2:
                    this.maxY = 0x3;
                    break;
                case 4:
                    this.maxY = 0xF;
                    break;
                case 8:
                    this.maxY = 0xFF;
                    break;
                case 16:
                    this.maxY = 0xFFFF;
                    break;
                case 32:
                    this.maxY = 0xFFFFFFFF;
                    break;
            }
            this.getData(function(data){
                this._samples = dataToSampleArray(data, this.BitsPerSample);
                completion.call(target);
            }, this);
        }
    }
});

var dataToSampleArray = function(data, bitsPerSample){
    var i, l;
    var s = 0;
    var samples;
    switch (bitsPerSample){
        case 1:
            samples = JSData.dataWithLength(data.length * 8);
            for (i = 0, l = data.length; i < l; ++i){
                samples[s++] = (data[i] & 0x80) >> 7;
                samples[s++] = (data[i] & 0x40) >> 6;
                samples[s++] = (data[i] & 0x20) >> 5;
                samples[s++] = (data[i] & 0x10) >> 4;
                samples[s++] = (data[i] & 0x8) >> 3;
                samples[s++] = (data[i] & 0x4) >> 2;
                samples[s++] = (data[i] & 0x2) >> 1;
                samples[s++] = (data[i] & 0x1);
            }
            return samples;
        case 2:
            samples = JSData.dataWithLength(data.length * 4);
            for (i = 0, l = data.length; i < l; ++i){
                samples[s++] = (data[i] & 0xC0) >> 6;
                samples[s++] = (data[i] & 0x30) >> 4;
                samples[s++] = (data[i] & 0xC) >> 2;
                samples[s++] = (data[i] & 0x3);
            }
            return samples;
        case 4:
            samples = JSData.dataWithLength(data.length * 2);
            for (i = 0, l = data.length; i < l; ++i){
                samples[s++] = (data[i] & 0xF0) >> 4;
                samples[s++] = (data[i] & 0xF);
            }
            return samples;
        case 8:
            return data;
        case 16:
            return new Uint16Array(data.buffer, data.byteOffset, data.byteLength);
        case 32:
            return new Uint32Array(data.buffer, data.byteOffset, data.byteLength);
    }
};

var interpolate = function(x, xMin, xMax, yMin, yMax){
    return yMin + ((x - xMin) * ((yMax - yMin) / (xMax - xMin)));
};


JSGlobalObject.PDFFunctionExponential = function(){
    if (this === undefined){
        return new PDFFunctionExponential();
    }
};

JSGlobalObject.PDFFunctionExponential.prototype = Object.create(PDFObject.prototype, {
    FunctionType:       PDFObjectProperty,
    Domain:             PDFObjectProperty,
    Range:              PDFObjectProperty,
    C0:                 PDFObjectProperty,
    C1:                 PDFObjectProperty,
    N:                  PDFObjectProperty,

    call: {
        value: function PDFFunctionExponential_call(x){
            var i, l;
            x = x.slice(0);
            var y = [];
            var d = 0;
            var e;
            for (i = 0, l = x.length; i < l; ++i, d += 2){
                x[i] = Math.min(Math.max(x[i], this.Domain[d]), this.Domain[d + 1]);
                e = Math.pow(x[i], this.N);
                for (var j = 0, k = this._C0.length; j < k; ++j){
                    y.push(this._C0[j] + e * (this._C1[j] - this._C0[j]));
                }
            }
            if (this.Range){
                d = 0;
                for (i = 0, l = y.length; i < l; ++i, d += 2){
                    y[i] = Math.min(Math.max(y[i], this.Range[d]), this.Range[d + 1]);
                }
            }
            return y;
        }
    },

    _C0: {
        writable: true,
        value: null
    },

    _C1: {
        writable: true,
        value: null
    },

    load: {
        value: function PDFFunctionExponential_load(completion, target){
            if (this.C0){
                this._C0 = this.C0;
            }else{
                this._C0 = [0];
            }
            if (this.C1){
                this._C1 = this.C1;
            }else{
                this._C1 = [1];
            }
            completion.call(target);
        }
    }
});



JSGlobalObject.PDFFunctionStitching = function(){
    if (this === undefined){
        return new PDFFunctionStitching();
    }
};

JSGlobalObject.PDFFunctionStitching.prototype = Object.create(PDFObject.prototype, {
    FunctionType:       PDFObjectProperty,
    Domain:             PDFObjectProperty,
    Range:              PDFObjectProperty,
    Functions:          PDFObjectProperty,
    Bounds:             PDFObjectProperty,
    Encode:             PDFObjectProperty,

    call: {
        value: function PDFFunctionStitching_call(x){
            var i, l;
            var index = this.Functions.length - 1;
            x = Math.min(Math.max(x[0], this.Domain[0]), this.Domain[1]);
            for (i = 0; i < index; ++i){
                if (x < this.Bounds[i + 1]){
                    index = i;
                    break;
                }
            }
            var fn = this.Functions[index];
            var min = index > 0 ? this.Bounds[index - 1] : this.Domain[0];
            var max = index < this.Bounds.length ? this.Bounds[index] : this.Domain[1];
            if (this.Bounds[this.Bounds.length - 1] == this.Domain[1]){
                x = this.Encode[2 * index];
            }else{
                x = interpolate(x, min, max, this.Encode[2 * index], this.Encode[2 * index + 1]);
            }
            var y = fn.call(x);
            if (this.Range){
                var d = 0;
                for (i = 0, l = y.length; i < l; ++i, d += 2){
                    y[i] = Math.min(Math.max(y[i], this.Range[d]), this.Range[d + 1]);
                }
            }
            return y;
        }
    },

    load: {
        value: function PDFFunctionStitching_load(completion, target){
            var functions = this.Functions;
            var remaining = functions.length;
            if (remaining === 0){
                completion.call(this);
                return;
            }
            var handleLoad = function(){
                --remaining;
                if (remaining === 0){
                    completion.call(target);
                }
            };
            for (var i = 0, l = functions.length; i < l; ++i){
                functions[i].load(handleLoad, this);
            }
        }
    }
});



JSGlobalObject.PDFFunctionCalculator = function(){
    if (this === undefined){
        return new PDFFunctionCalculator();
    }
};

JSGlobalObject.PDFFunctionCalculator.prototype = Object.create(PDFStream.prototype, {
    FunctionType:       PDFObjectProperty,
    Domain:             PDFObjectProperty,
    Range:              PDFObjectProperty,

    call: {
        value: function PDFFunctionCalculator_call(x){
            var i, l;
            var operation = this._operationIterator.next();
            var handler;
            x = x.slice(0);
            var d = 0;
            for (i = 0, l = x.length; i < l; ++i, d += 2){
                x[i] = Math.min(Math.max(x[i], this.Domain[d]), this.Domain[d + 1]);
            }
            var stack = x;
            var open = 0;
            var block = null;
            while (operation !== null){
                if (operation.operator == Op.beginFunction){
                    if (open == 1){
                        block = [];
                        stack.push(block);
                    }
                    ++open;
                }else if (operation.operator == Op.endFunction){
                    --open;
                    if (open == 1){
                        block = null;
                    }
                }else{
                    if (open == 1){
                        handler = operationHandler[operation.operator];
                        for (i = 0, l = operation.operands.length; i < l; ++i){
                            stack.push(operation.operands[i]);
                        }
                        if (handler){
                            handler.call(undefined, stack);
                        }
                    }else if (open > 1){
                        block.push(operation);
                    }
                }
                operation = this._operationIterator.next();
            }
            var y = stack;
            if (this.Range){
                d = 0;
                for (i = 0, l = y.length; i < l; ++i, d += 2){
                    y[i] = Math.min(Math.max(y[i], this.Range[d]), this.Range[d + 1]);
                }
            }
            return y;
        }
    },

    _operationIterator: {
        writable: true,
        value: null
    },

    load: {
        value: function PDFFunctionCalculator_load(completion, target){
            this.getData(function(data){
                if (data){
                    this._operationIterator = PDFOperationIterator.initWithData(data);
                }
            }, this);
        }
    }
});

var Op = PDFStreamOperation.Operator;

var operationHandler = {

    // Arithmetic

    abs: function(stack){
        var x = stack.pop();
        stack.push(Math.abs(x));
    },

    add: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a + b);
    },

    atan: function(stack){
        var x = stack.pop();
        stack.push(Math.atan(x));
    },

    ceiling: function(stack){
        var x = stack.pop();
        stack.push(Math.ceil(x));
    },

    cos: function(stack){
        var x = stack.pop();
        stack.push(Math.cos(x));
    },

    cvi: function(stack){
        var x = stack.pop();
        var i = parseInt(x);
        if (isNaN(i)){
            i = 0;
        }
        stack.push(i);
    },

    cvr: function(stack){
        var x = stack.pop();
        var i = parseFloat(x);
        if (isNaN(i)){
            i = 0;
        }
        stack.push(i);
    },

    div: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a / b);
    },

    exp: function(stack){
        var e = stack.pop();
        var x = stack.pop();
        stack.push(Math.pow(x, e));
    },

    floor: function(stack){
        var x = stack.pop();
        stack.push(Math.floor(x));
    },

    idiv: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        var x = a / b;
        if (x < 0){
            stack.push(Math.ceil(x));
        }else{
            stack.push(Math.floor(x));
        }
    },

    ln: function(stack){
        var x = stack.pop();
        stack.push(Math.log(x));
    },

    log: function(stack){
        var x = stack.pop();
        stack.push(Math.log(x) * Math.LOG10E);
    },

    mod: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a % b);
    },

    mul: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a * b);
    },

    neg: function(stack){
        var x = stack.pop();
        stack.push(-x);
    },

    round: function(stack){
        var x = stack.pop();
        stack.push(Math.round(x));
    },

    sin: function(stack){
        var x = stack.pop();
        stack.push(Math.sin(x));
    },

    sqrt: function(stack){
        var x = stack.pop();
        stack.push(Math.sqrt(x));
    },

    sub: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a - b);
    },

    truncate: function(stack){
        var x = stack.pop();
        if (x < 0){
            stack.push(Math.ceil(x));
        }else{
            stack.push(Math.floor(x));
        }
    },

    // Boolean

    and: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        if (typeof(a) == "boolean"){
            stack.push(a && b);
        }else{
            stack.push(a & b);
        }
    },

    bitshift: function(stack){
        var n = stack.pop();
        var x = stack.pop();
        if (n > 0){
            stack.push(x << n);
        }else{
            stack.push(x >>> n);
        }
    },

    eq: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a == b);
    },

    false: function(stack){
        stack.push(false);
    },

    ge: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a >= b);
    },

    gt: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a > b);
    },

    le: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a <= b);
    },

    lt: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a < b);
    },

    ne: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        stack.push(a != b);
    },

    not: function(stack){
        var a = stack.pop();
        if (typeof(a) == "boolean"){
            stack.push(!a);
        }else{
            stack.push(~a);
        }
    },

    or: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        if (typeof(a) == "boolean"){
            stack.push(a || b);
        }else{
            stack.push(a | b);
        }
    },

    true: function(stack){
        stack.push(true);
    },

    xor: function(stack){
        var b = stack.pop();
        var a = stack.pop();
        if (typeof(a) == "boolean"){
            stack.push((a || b) && !(a && b));
        }else{
            stack.push(a ^ b);
        }
    },

    // Conditionals

    if: function(stack){
        var operations = stack.pop();
        var condition = stack.pop();
        if (condition){
            operationHandler._block.call(undefined, operations, stack);
        }
    },

    ifelse: function(stack){
        var elseOperations = stack.pop();
        var operations = stack.pop();
        var condition = stack.pop();
        if (condition){
            operationHandler._block.call(undefined, operations, stack);
        }else{
            operationHandler._block.call(undefined, elseOperations, stack);
        }
    },

    _block: function(operations, stack){
        var operation;
        var open = 0;
        var block = null;
        var handler;
        for (var i = 0, l = operations.length; i < l; ++i){
            operation = operations[i];
            if (operation.operator == Op.beginFunction){
                if (open === 0){
                    block = [];
                    stack.push(block);
                }
                ++open;
            }else if (operation.operator == Op.endFunction){
                --open;
                if (open == 1){
                    block = null;
                }
            }else{
                if (open === 0){
                    handler = operationHandler[operation.operator];
                    for (i = 0, l = operation.operands.length; i < l; ++i){
                        stack.push(operation.operands[i]);
                    }
                    if (handler){
                        handler.call(undefined, stack);
                    }
                }else{
                    block.push(operation);
                }
            }
        }
    },

    // Stack

    copy: function(stack){
        var n = stack.pop();
        for (var i = stack.length - n, l = stack.length; i < l; ++i){
            stack.push(stack[i]);
        }
    },

    dup: function(stack){
        stack.push(stack[stack.length - 1]);
    },

    exch: function(stack){
        var tmp = stack[stack.length - 1];
        stack[stack.length - 1] = stack[stack.length - 2];
        stack[stack.length - 2] = tmp;
    },

    index: function(stack){
        var i = stack.pop();
        stack.push(stack[stack.length - 1 - i]);
    },

    pop: function(stack){
        stack.pop();
    },

    roll: function(stack){
        var j = stack.pop();
        var n = stack.pop();
        var slice = stack.splice(stack.length - n, n);
        var i;
        for (i = 0; i < j; ++i){
            slice.push(slice.shift());
        }
        for (i = 0; i < slice.length; ++i){
            stack.push(slice[i]);
        }
    }

};

})();