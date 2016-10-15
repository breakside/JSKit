'use strict';

String.prototype.ucFirst = function(){
    return this.charAt(0).toUpperCase() + this.substr(1);
};

if(!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}

String.prototype.parseNumberArray = function(){
    var input = this.split(',');
    var output = [];
    var s;
    for (var i = 0, l = input.length; i < l; ++i){
        try{
            s = parseFloat(input[i].trim());
            output.push(s);
        }catch (e){
        }
    }
    return output;
};

String.prototype.asciiBytes = function(){
    var data = new Uint8Array(this.length);
    for (var i = 0, l = this.length; i < l; ++i){
        data[i] = this.charCodeAt(i);
    }
    return data;
};

String.prototype.sprintf = function(){
    var formatted = "";
    var formatting = false;
    var using_numbered_args = false;
    var found_first_format = false;
    var args = Array.prototype.slice.call(arguments);
    var arg;
    var sub;
    var index;
    var flags = {};
    var width;
    var precision;
    var uppercase;
    var flag_map = {
        "'": 'thousands',
        '-': 'left_justified',
        '+': 'signed',
        ' ': 'space',
        '#': 'alternate',
        '0': 'zero'
    };
    for (var i = 0, l = this.length; i < l; ++i){
        var c = this[i];
        if (formatting){
            if (c == '%'){
                formatted += c;
            }else{
                if (using_numbered_args){
                    while (c != '$'){
                        sub += c;
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + this);
                        }
                        c = this[i];
                        if (c < '0' || c > '9'){
                            throw new Error("Invalid format string, invalid arg index char: " + c + "; " + this);
                        }
                    }
                    index = parseInt(sub, 10) - 1;
                    if (index < 0 || index >= args.length){
                        throw new Error("Invalid format string, unknown arg index: " + index + "; " + this);
                    }
                    arg = args[index];
                }else{
                    if (args.length === 0){
                        throw new Error("Invalid format string, not enough arguments: " + this);
                    }
                    arg = args.shift();
                }
                flags = {};
                while (c in flag_map){
                    flags[flag_map[c]] = true;
                    ++i;
                    if (i >= l){
                        throw new Error("Invalid format string, unexpected end: " + this);
                    }
                    c = this[i];
                }
                width = null;
                if (c >= '1' && c <= '9'){
                    sub = '';
                    do {
                        sub += c;
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + this);
                        }
                        c = this[i];
                    } while (c >= '0' && c <= '9');
                    width = parseInt(sub, 10);
                }
                precision = null;
                if (c == '.'){
                    precision = 0;
                    sub = '';
                    ++i;
                    if (i >= l){
                        throw new Error("Invalid format string, unexpected end: " + this);
                    }
                    c = this[i];
                    while (c >= '0' && c <= '9') {
                        sub += c;
                        ++i;
                        if (i >= l){
                            throw new Error("Invalid format string, unexpected end: " + this);
                        }
                        c = this[i];
                    }
                    if (sub.length){
                        precision = parseInt(sub, 10);
                    }
                }
                uppercase = false;
                switch (c){
                    case 'd':
                        // TODO: obey any other flags
                        sub = arg.toString(10);
                        if (flags.width){
                            sub = sub._padded('0', flags.width);
                        }
                        formatted += sub;
                        break;
                    case 'X':
                        uppercase = true;
                        // intentional fallthrough
                    case 'x':
                        // TODO: obey any other flags
                        sub = arg.toString(16);
                        if (flags.width){
                            sub._padded('0', flags.width);
                        }
                        if (uppercase){
                            sub = sub.toUpperCase();
                        }
                        if (flags.alternate){
                            sub = '0x' + sub;
                        }
                        formatted += sub;
                        break;
                    case 's':
                        // TODO: obey any flags
                        formatted += arg.toString ? arg.toString() : arg;
                        break;
                    case 'f':
                        formatted += arg.toString ? arg.toString() : arg;
                        break;
                    default:
                        throw new Error("Invalid format string, unknown conversion specifier: " + c + "; " + this);
                }
            }
            formatting = false;
        }else{
            switch (c){
                case '%':
                    formatting = true;
                    if (!found_first_format){
                        found_first_format = true;
                        using_numbered_args = this.substr(i + 1, 5).match(/^[1-9][0-9]*\$/);
                    }
                    break;
                default:
                    formatted += c;
                    break;
            }
        }
    }
    if (!using_numbered_args && args.length){
        throw new Error("Invalid format string, unused arguments: " + this);
    }
    return formatted;
};

String.prototype._padded = function(pad_char, width){
    var padded = '';
    var chars = Math.max(0, width - this.length);
    for (var i = 0; i < chars; ++i){
        padded += pad_char;
    }
    padded += this;
    return padded;
};