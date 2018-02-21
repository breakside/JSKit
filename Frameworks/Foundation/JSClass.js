// #feature Object.create
// #feature Object.defineProperty
// #feature Object.getPrototypeOf
// #feature Object.hasOwnProperty
/* global JSGlobalObject, JSClass, JSDynamicProperty, JSCustomProperty, JSReadOnlyProperty, JSLazyInitProperty */
'use strict';

JSGlobalObject.JSClass = function(name, superclass, extensions){
    if (this === undefined){
        if (superclass instanceof JSClass){
            JSGlobalObject[name] = superclass.$extend(extensions, name);
            return JSGlobalObject[name];
        }else{
            throw new Error("JSClass(): superclass must be an instance of JSClass");
        }
    }
};

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
                var superclassMethod = this.prototype[i];
                if (superclassMethod){
                    // We might be providing a function that should override the getter/setter
                    // for a custom dynamic property.  For the the override to work properly,
                    // the original property needs to be redefined on our new class.
                    if (superclassMethod._JSCustomProperty){
                        if (!extensions[superclassMethod._JSCustomPropertyKey] && !Object.hasOwnProperty(this.prototype, superclassMethod._JSCustomPropertyKey)){
                            superclassMethod._JSCustomProperty.define(this, superclassMethod._JSCustomPropertyKey, extensions);
                        }
                    }
                }
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
                var result = obj[methodName].apply(obj, args);
                if (result === undefined){
                    return obj;   
                }
                return result;
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

JSGlobalObject.JSCustomProperty = function(){
};

JSGlobalObject.JSDynamicProperty = function(privateKey, initialValue, getterName, setterName){
    if (this === undefined){
        return new JSDynamicProperty(privateKey, initialValue, getterName, setterName);
    }else{
        this.privateKey = privateKey;
        this.initialValue = initialValue;
        this.getterName = getterName;
        this.setterName = setterName;
    }
};

JSDynamicProperty.prototype = Object.create(JSCustomProperty.prototype);

JSDynamicProperty.prototype.define = function(C, publicKey, extensions){
    var setterName = this.setterName || C.nameOfSetMethodForKey(publicKey);
    var getterName = this.getterName || C.nameOfGetMethodForKey(publicKey);
    if (this.privateKey){
        Object.defineProperty(C.prototype, this.privateKey, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: this.initialValue
        });
    }
    var getter = extensions[getterName] || extensions[C.nameOfBooleanGetMethodForKey(publicKey)];
    var privateKey = this.privateKey;
    if (!getter){
        // getter = C.$super.prototype[getterName] || C.$super.prototype[C.nameOfBooleanGetMethodForKey(publicKey)];
    }
    if (!getter){
        Object.defineProperty(C.prototype, getterName, {
            configurable: true,
            enumerable: false,
            value: function JSDynamicProperty_get(){
                return this[privateKey];
            }
        });
        getter = C.prototype[getterName];
    }
    var setter = extensions[setterName];
    if (!setter){
        // setter = C.$super.prototype[setterName];
    }
    if (!setter){
        Object.defineProperty(C.prototype, setterName, {
            configurable: true,
            enumerable: false,
            value: function JSDynamicProperty_set(value){
                this[privateKey] = value;
            }
        });
        setter = C.prototype[setterName];
    }
    getter._JSCustomProperty = this;
    getter._JSCustomPropertyKey = publicKey;
    setter._JSCustomProperty = this;
    setter._JSCustomPropertyKey = publicKey;
    Object.defineProperty(C.prototype, publicKey, {
        configurable: true,
        enumerable: false,
        get: getter,
        set: setter
    });
};

JSGlobalObject.JSReadOnlyProperty = function(privateKey, initialValue, getterName){
    if (this === undefined){
        return new JSReadOnlyProperty(privateKey, initialValue, getterName);
    }else{
        this.privateKey = privateKey;
        this.initialValue = initialValue;
        this.getterName = getterName;
    }
};

JSReadOnlyProperty.prototype = Object.create(JSCustomProperty.prototype);

JSReadOnlyProperty.prototype.define = function(C, publicKey, extensions){
    var getterName = this.getterName || C.nameOfGetMethodForKey(publicKey);
    if (this.privateKey){
        Object.defineProperty(C.prototype, this.privateKey, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: this.initialValue
        });
    }
    var privateKey = this.privateKey;
    var getter = extensions[getterName] || extensions[C.nameOfBooleanGetMethodForKey(publicKey)];
    if (!getter){
        Object.defineProperty(C.prototype, getterName, {
            configurable: true,
            enumerable: false,
            value: function JSReadOnlyProperty_get(){
                return this[privateKey];
            }
        });
        getter = C.prototype[getterName];
    }
    getter._JSCustomProperty = this;
    getter._JSCustomPropertyKey = publicKey;
    Object.defineProperty(C.prototype, publicKey, {
        configurable: true,
        enumerable: false,
        get: getter
    });
};

JSGlobalObject.JSLazyInitProperty = function(propertyInitMethodName){
    if (this === undefined){
        return new JSLazyInitProperty(propertyInitMethodName);
    }else{
        this.propertyInitMethodName = propertyInitMethodName;
    }
};

JSLazyInitProperty.prototype = Object.create(JSCustomProperty.prototype);

JSLazyInitProperty.prototype.define = function(C, key, extensions){
    var propertyInitMethodName = this.propertyInitMethodName;
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: function(){
            var x = this[propertyInitMethodName]();
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: false,
                value: x
            });
            return x;
        }
    });
};