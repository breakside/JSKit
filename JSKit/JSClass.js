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
        C.prototype.constructor = function JSClass_constructor(){
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
                if (extensions[i] instanceof JSDynamicProperty){
                    var setterName = extensions[i].setterName || this.nameOfSetMethodForKey(i);
                    var getterName = extensions[i].getterName || this.nameOfGetMethodForKey(i);
                    if (extensions[i].key){
                        Object.defineProperty(this.prototype, extensions[i].key, {
                            configurable: false,
                            enumerable: false,
                            writable: true,
                            value: extensions[i].value
                        });
                    }
                    Object.defineProperty(this.prototype, i, {
                        configurable: true,
                        enumerable: false,
                        get: extensions[getterName] || extensions[this.nameOfBooleanGetMethodForKey(i)],
                        set: extensions[setterName]
                    });
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


function JSDynamicProperty(getterName, setterName, key, value){
    this.getterName = getterName;
    this.setterName = setterName;
    this.key = key;
    this.value = value;
}
