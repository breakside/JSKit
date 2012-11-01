JSGlobalObject = window;

// -----------------------------------------------------------------------------
// MARK: - Utility

function JSCopy(obj){
    if (typeof(obj) == 'obj'){
        var _copy = {};
        for (var i in obj){
            _copy[i] = obj[i];
        }
        return _copy;
    }
    return obj;
}

function JSDeepCopy(obj){
    if (typeof(obj) == 'obj'){
        var _copy = {};
        for (var i in obj){
            _copy[i] = JSDeepCopy(obj[i]);
        }
        return _copy;
    }
    return obj;
}

// -----------------------------------------------------------------------------
// MARK: - Name Resolvers

function JSClassFromName(className){
    if (className in JSGlobalObject){
        return JSGlobalObject[className];
    }
    return null;
}

function JSNameOfSetMethodForKey(key){
    return 'set' + key.ucFirst();
}

function JSNameOfSilentSetMethodForKey(key){
    return '_' + JSNameOfSetMethodForKey(key);
}

function JSNameOfInsertMethodForKey(key){
    return 'insertObjectIn' + key.ucFirst() + 'AtIndex';
}

function JSNameOfSilentInsertMethodForKey(key){
    return '_' + JSNameOfInsertMethodForKey(key);
}

function JSNameOfRemoveMethodForKey(key){
    return 'removeObjectFrom' + key.ucFirst() + 'AtIndex';
}

function JSNameOfSilentRemoveMethodForKey(key){
    return '_' + JSNameOfRemoveMethodForKey(key);
}

function JSNameOfReplaceMethodForKey(key){
    return 'replaceObjectIn' + key.ucFirst() + 'AtIndexWithObject';
}

function JSNameOfSilentReplaceMethodForKey(key){
    return '_' + JSNameOfReplaceMethodForKey(key);
}

// -----------------------------------------------------------------------------
// MARK: - Inheritence

/**
 * Addition to standard Function objects to support class inheritence.
 * 
 * @property {Function}  superclass
 */
Function.prototype.$extends = function(superclass){
    this.alloc = superclass.alloc;
    this.$super = superclass;
    this.$protocols = [];
    this.prototype.$super = superclass.prototype;
    this.prototype.$class = this;
    if (this.prototype.__proto__){
        this.prototype.__proto__ = superclass.prototype;
    }else{
        var tmpPrototype = this.prototype;
        this.prototype = new superclass();
        for (var i in tmpPrototype){
            this.prototype[i] = tmpPrototype[i];
        }
    }
    if (superclass.subclassDidExtend){
        superclass.subclassDidExtend(this);
    }
    return this;
};

Function.prototype.$implements = function(protocol){
    this.$protocols.push(protocol);
    if (protocol.subclassDidImplement){
        protocol.subclassDidImplement(this);
    }
    return this;
};

// -----------------------------------------------------------------------------
// MARK: - String Helpers

String.prototype.ucFirst = function(){
    return this.charAt(0).toUpperCase() + this.substr(1);
};

if(!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}

String.prototype.parseNumberArray = function(){
    var input = self.split(',');
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
            numberString = '';
            if (c >= '1' && c <= '9'){
                while (c >= '0' && c <= '9'){
                    numberString += c;
                    c = this[++i];
                }
            }
            if (numberString !== ''){
                if (c == '$'){
                    position = parseInt(numberString) - 1;
                    c = this[++i];
                }else{
                    width = parseInt(numberString);
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
                    width = parseInt(numberString);
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
                    precision = parseInt(numberString);
                }
            }
            switch (c){
                default:
                case 's':
                    s += args[position];
                    break;
                case 'd':
                    s += args[position];
                    break;
                case '%':
                    s += c;
                    break;
                // TODO: all the other cases
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
