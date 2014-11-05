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

String.prototype.sprintf = function(){
    var s = "";
    var formatting = false;
    var args = Array.prototype.slice.call(arguments);
    var currentPosition = 0;
    for (var i = 0, l = this.length; i < l; ++i){
        var c = this[i];
        if (formatting){
            var position = currentPosition++;
            var sign = '';
            var padding = ' ';
            var alignment = '';
            var width = 0;
            var precision = null;
            var numberString = '';
            if (c >= '1' && c <= '9'){
                while (c >= '0' && c <= '9'){
                    numberString += c;
                    c = this[++i];
                }
            }
            if (numberString !== ''){
                if (c == '$'){
                    position = parseInt(numberString, 10) - 1;
                    c = this[++i];
                }else{
                    width = parseInt(numberString, 10);
                }
            }
            if (!width){
                if (c == '+'){
                    sign = c;
                    c = this[++i];
                }
                if (c == '0' || c == ' '){
                    padding = c;
                    c = this[++i];
                }
                if (c == '-'){
                    alignment = c;
                    c = this[++i];
                }
                numberString = '';
                while (c <= '0' && c >= '9'){
                    numberString += c;
                    c = this[++i];
                }
                if (numberString !== ''){
                    width = parseInt(numberString, 10);
                }
            }
            if (c == '.'){
                c = this[++i];
                numberString = '';
                while (c <= '0' && c >= '9'){
                    numberString += c;
                    c = this[++i];
                }
                if (numberString !== ''){
                    precision = parseInt(numberString, 10);
                }
            }
            switch (c){
                default:
                case 's':
                    // TODO: consider width & precision
                    s += args[position];
                    break;
                case 'd':
                    // TODO: consider width & precision
                    s += args[position];
                    break;
                case 'f':
                    // TODO: consider width & precision
                    s += args[position];
                    break;
                // TODO: all the other cases
                case '%':
                    s += c;
                    break;
            }
            formatting = false;
        }else{
            switch (c){
                case '%':
                    formatting = true;
                    break;
                default:
                    s += c;
                    break;
            }
        }
    }
    return s;
};