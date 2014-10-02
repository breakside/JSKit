function JSClass(name, superclass, extensions){
    if (this === JSGlobalObject){
        this[name] = superclass.$extend(extensions, name);
        return this[name];
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
            throw Error('Classes must have names');
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
        C.prototype.constructor = function(){
            throw Error('Use init method, not constructor for: %s'.sprintf(className));
        };
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
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: extensions[i]
                });
                if (i.length >= 4 && i.substr(0, 4) === 'init'){
                    this.defineInitMethod(i);
                }
            }else if (i.charAt(0) == '_'){
                Object.defineProperty(this.prototype, i, {
                    configurable: false,
                    enumerable: false,
                    writable: true,
                    value: extensions[i]
                });
            }else{
                if (extensions[i] instanceof JSCustomProperty){
                    extensions[i].define(this, i, extensions[i], extensions);
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
            configurable: false,
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
        return '_' + nameOfSetMethodForKey(key);
    },

    nameOfInsertMethodForKey: function(key){
        return 'insertObjectIn' + key.ucFirst() + 'AtIndex';
    },

    nameOfSilentInsertMethodForKey: function(key){
        return '_' + nameOfInsertMethodForKey(key);
    },

    nameOfRemoveMethodForKey: function(key){
        return 'removeObjectFrom' + key.ucFirst() + 'AtIndex';
    },

    nameOfSilentRemoveMethodForKey: function(key){
        return '_' + nameOfRemoveMethodForKey(key);
    },

    nameOfReplaceMethodForKey: function(key){
        return 'replaceObjectIn' + key.ucFirst() + 'AtIndexWithObject';
    },

    nameOfSilentReplaceMethodForKey: function(key){
        return '_' + nameOfReplaceMethodForKey(key);
    },

    nameOfSilentPropertyForKey: function(key){
        return '_' + key;
    }
};

function JSCustomProperty(){
}

function JSDynamicProperty(key, value, getterName, setterName){
    var prop = Object.create(JSCustomProperty.prototype);
    prop.key = key;
    prop.value = value;
    prop.getterName = getterName;
    prop.setterName = setterName;
    prop.define = JSDynamicProperty_define;
    return prop;
}

function JSDynamicProperty_define(C, key, prop, extensions){
    var setterName = prop.setterName || C.nameOfSetMethodForKey(key);
    var getterName = prop.getterName || C.nameOfGetMethodForKey(key);
    if (prop.key){
        Object.defineProperty(C.prototype, prop.key, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: prop.value
        });
    }
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: extensions[getterName] || extensions[C.nameOfBooleanGetMethodForKey(name)],
        set: extensions[setterName]
    });
}

function JSLazyInitProperty(methodName){
    var prop = Object.create(JSCustomProperty.prototype);
    prop.methodName = methodName;
    prop.define = JSLazyInitProperty_define;
    return prop;
}

function JSLazyInitProperty_define(C, key, prop, extensions){
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
}