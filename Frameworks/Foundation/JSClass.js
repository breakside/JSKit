// #feature Object.create
// #feature Object.defineProperty
// #feature Object.getPrototypeOf
// #feature Object.hasOwnProperty
/* global JSGlobalObject */
'use strict';

function JSClass(name, superclass, extensions){
    if (this === undefined){
        if (superclass instanceof JSClass){
            JSGlobalObject[name] = superclass.$extend(extensions, name);
            return JSGlobalObject[name];
        }else{
            throw new Error("JSClass(): superclass must be an instance of JSClass");
        }
    }
}

JSClass.prototype = {
    className: '',

    $extend: function(extensions, className){
        var superclass = this;
        var C = Object.create(superclass, {
            '$super': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: superclass.prototype
            }
        });
        if (!className){
            throw new Error('Classes must have names');
        }
        C.className = className;
        C.prototype = Object.create(superclass.prototype, {
            '$class': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: C
            }
        });
        C.definePropertiesFromExtensions(extensions);
        return C;
    },

    isSubclassOfClass: function(referenceClass){
        var cls = this;
        do {
            if (cls === referenceClass){
                return true;
            }
            cls = cls.$super ? cls.$super.$class : null;
        } while (cls);
        return false;
    },

    definePropertiesFromExtensions: function(extensions){
        for (var i in extensions){
            if (typeof(extensions[i]) == 'function'){
                Object.defineProperty(this.prototype, i, {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: extensions[i]
                });
                if (i.length >= 4 && i.substr(0, 4) === 'init'){
                    this.defineInitMethod(i);
                }
            }else if (i.charAt(0) == '_'){
                if (extensions[i] instanceof JSCustomProperty){
                    extensions[i].define(this, i, extensions);
                }else{
                    Object.defineProperty(this.prototype, i, {
                        configurable: false,
                        enumerable: false,
                        writable: true,
                        value: extensions[i]
                    });
                }
            }else{
                if (extensions[i] instanceof JSCustomProperty){
                    extensions[i].define(this, i, extensions);
                }else{
                    Object.defineProperty(this.prototype, i, {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: extensions[i]
                    });
                }
            }
        }
    },

    defineInitMethod: function(methodName){
        Object.defineProperty(this, methodName, {
            configurable: true,
            enumerable: false,
            value: function JSClass_createAndInit(){
                var args = Array.prototype.slice.call(arguments, 0);
                var obj = Object.create(this.prototype);
                obj[methodName].apply(obj, args);
                return obj;
            }
        });
    },

    // -----------------------------------------------------------------------------
    // MARK: - Name Resolvers

    nameOfSetMethodForKey: function(key){
        return 'set' + key.ucFirst();
    },

    nameOfGetMethodForKey: function(key){
        return 'get' + key.ucFirst();
    },

    nameOfBooleanGetMethodForKey: function(key){
        return 'is' + key.ucFirst();
    },

    nameOfSilentSetMethodForKey: function(key){
        return '_' + this.nameOfSetMethodForKey(key);
    },

    nameOfInsertMethodForKey: function(key){
        return 'insertObjectIn' + key.ucFirst() + 'AtIndex';
    },

    nameOfSilentInsertMethodForKey: function(key){
        return '_' + this.nameOfInsertMethodForKey(key);
    },

    nameOfRemoveMethodForKey: function(key){
        return 'removeObjectFrom' + key.ucFirst() + 'AtIndex';
    },

    nameOfSilentRemoveMethodForKey: function(key){
        return '_' + this.nameOfRemoveMethodForKey(key);
    },

    nameOfReplaceMethodForKey: function(key){
        return 'replaceObjectIn' + key.ucFirst() + 'AtIndexWithObject';
    },

    nameOfSilentReplaceMethodForKey: function(key){
        return '_' + this.nameOfReplaceMethodForKey(key);
    },

    nameOfSilentPropertyForKey: function(key){
        return '_' + key;
    }
};

function JSCustomProperty(){
}

function JSDynamicProperty(key, value, getterName, setterName){
    if (this === undefined){
        return new JSDynamicProperty(key, value, getterName, setterName);
    }else{
        this.key = key;
        this.value = value;
        this.getterName = getterName;
        this.setterName = setterName;
    }
}

JSDynamicProperty.prototype = Object.create(JSCustomProperty.prototype);

JSDynamicProperty.prototype.define = function(C, key, extensions){
    var setterName = this.setterName || C.nameOfSetMethodForKey(key);
    var getterName = this.getterName || C.nameOfGetMethodForKey(key);
    if (this.key){
        Object.defineProperty(C.prototype, this.key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: this.value
        });
    }
    var getter = extensions[getterName] || extensions[C.nameOfBooleanGetMethodForKey(key)];
    if (!getter){
        getter = function JSDynamicProperty_get(){
            return this[key];
        };
    }
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: getter,
        set: extensions[setterName]
    });
};

function JSCustomProperty(){
}

function JSReadOnlyProperty(key, value, getterName){
    if (this === undefined){
        return new JSReadOnlyProperty(key, value, getterName);
    }else{
        this.key = key;
        this.value = value;
        this.getterName = getterName;
    }
}

JSReadOnlyProperty.prototype = Object.create(JSCustomProperty.prototype);

JSReadOnlyProperty.prototype.define = function(C, key, extensions){
    var getterName = this.getterName || C.nameOfGetMethodForKey(key);
    if (this.key){
        Object.defineProperty(C.prototype, this.key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: this.value
        });
    }
    var privateKey = this.key;
    var getter = extensions[getterName] || extensions[C.nameOfBooleanGetMethodForKey(key)];
    if (!getter){
        getter = function JSReadOnlyProperty_get(){
            return this[privateKey];
        };
    }
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: getter
    });
};

function JSLazyInitProperty(methodName){
    if (this === undefined){
        return new JSLazyInitProperty(methodName);
    }else{
        this.methodName = methodName;
    }
}

JSLazyInitProperty.prototype = Object.create(JSCustomProperty.prototype);

JSLazyInitProperty.prototype.define = function(C, key, extensions){
    var methodName = this.methodName;
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: function(){
            var x = this[methodName]();
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: false,
                value: x
            });
            return x;
        }
    });
};