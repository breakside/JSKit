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

// #import "Javascript.js"
// #import "String+JS.js"
// #import "Promise+JS.js"
// #feature Object.create
// #feature Object.defineProperty
// #feature Object.getPrototypeOf
// #feature Object.prototype.hasOwnProperty
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

JSClass._registry = {};

JSClass.FromName = function(className){
    var cls = JSResolveDottedName(JSClass._registry, className);
    if (!cls){
        throw new Error("Class not found: %s.  Missing include?  Typo?".sprintf(className));
    }
    return cls;
};

JSClass.prototype = {

    constructor: function JSClass(){
    },

    className: '',

    $extend: function(extensions, className){
        var superclass = this;
        if (!className){
            throw new Error('Classes must have names');
        }
        var C = new Function("return function " + className + "(){ 'use strict'; if (this === undefined){ throw new Error('Cannot use " + className + " as a function'); } throw new Error('Cannot use " + className + " as a constructor.  Use an init method instead.') }")();
        Object.setPrototypeOf(C, superclass);
        C.prototype = Object.create(superclass.prototype, {
            constructor: {value: C}
        });
        Object.defineProperties(C, {
            className: {
                value: className
            }
        });
        C.definePropertiesFromExtensions(extensions);
        C.initialize();
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

    initialize: function(){
        Object.defineProperties(this, {
            '$super': {
                configurable: true,
                value: Object.getPrototypeOf(this.prototype)
            }
        });
        if (!this.hasOwnProperty('className')){
            Object.defineProperties(this, {
                className: {
                    value: this.name
                }
            });
        }
        Object.defineProperties(this.prototype, {
            '$class': {
                configurable: false,
                enumerable: false,
                writable: false,
                value: this
            }
        });
        var properties = Object.getOwnPropertyNames(this.prototype);
        var name;
        for (var i = 0, l = properties.length; i < l; ++i){
            name = properties[i];
            if (name.length >= 4 && name.substr(0, 4) === 'init' && (name.length == 4 || name.substr(4,1).toUpperCase() == name.substr(4, 1))){
                this.defineInitMethod(name);
            }
        }
        JSClass._registry[this.className] = this;
    },

    definePropertiesFromExtensions: function(extensions){
        for (var i in extensions){
            if (typeof(extensions[i]) == 'function' && !(extensions[i] instanceof JSClass)){
                var superclassMethod = this.prototype[i];
                if (superclassMethod){
                    // We might be providing a function that should override the getter/setter
                    // for a custom dynamic property.  For the the override to work properly,
                    // the original property needs to be redefined on our new class.
                    if (superclassMethod._JSCustomProperty){
                        if (!extensions[superclassMethod._JSCustomPropertyKey] && !this.prototype.hasOwnProperty(superclassMethod._JSCustomPropertyKey)){
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

    allocate: function(){
        return Object.create(this.prototype);
    },

    defineInitMethod: function(methodName){
        Object.defineProperty(this, methodName, {
            configurable: true,
            enumerable: false,
            value: function JSClass_createAndInit(){
                var obj = this.allocate();
                var args = Array.prototype.slice.call(arguments, 0);
                var result = obj[methodName].apply(obj, args);
                if (result === undefined){
                    return obj;   
                }
                if (result instanceof Promise){
                    return result.then(function(promiseResult){
                        return promiseResult || obj;
                    }, function(){
                        return null;
                    });
                }
                return result;
            }
        });
    },

    // -----------------------------------------------------------------------------
    // MARK: - Name Resolvers

    nameOfSetMethodForKey: function(key){
        return 'set' + key.capitalizedString();
    },

    nameOfGetMethodForKey: function(key){
        return 'get' + key.capitalizedString();
    },

    nameOfBooleanGetMethodForKey: function(key){
        return 'is' + key.capitalizedString();
    },

    nameOfSilentSetMethodForKey: function(key){
        return '_' + this.nameOfSetMethodForKey(key);
    },

    nameOfInsertMethodForKey: function(key){
        return 'insertObjectIn' + key.capitalizedString() + 'AtIndex';
    },

    nameOfSilentInsertMethodForKey: function(key){
        return '_' + this.nameOfInsertMethodForKey(key);
    },

    nameOfRemoveMethodForKey: function(key){
        return 'removeObjectFrom' + key.capitalizedString() + 'AtIndex';
    },

    nameOfSilentRemoveMethodForKey: function(key){
        return '_' + this.nameOfRemoveMethodForKey(key);
    },

    nameOfReplaceMethodForKey: function(key){
        return 'replaceObjectIn' + key.capitalizedString() + 'AtIndexWithObject';
    },

    nameOfSilentReplaceMethodForKey: function(key){
        return '_' + this.nameOfReplaceMethodForKey(key);
    },

    nameOfSilentPropertyForKey: function(key){
        return '_' + key;
    },

    nameOfOutletConnectionMethod: function(key){
        return '_connectOutlet' + key.capitalizedString();
    },

    toString: function(){
        return this.className;
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

JSGlobalObject.JSLazyInitProperty = function(propertyInitMethodName, privateKey){
    if (this === undefined){
        return new JSLazyInitProperty(propertyInitMethodName, privateKey);
    }else{
        this.propertyInitMethodName = propertyInitMethodName;
        this.privateKey = privateKey;
    }
};

JSLazyInitProperty.prototype = Object.create(JSCustomProperty.prototype);

JSLazyInitProperty.prototype.define = function(C, key, extensions){
    var propertyInitMethodName = this.propertyInitMethodName;
    var privateKey = this.privateKey;
    if (privateKey){
        Object.defineProperty(C.prototype, privateKey, {configurable: true, writable: true, value: null});
    }
    Object.defineProperty(C.prototype, key, {
        configurable: true,
        enumerable: false,
        get: function(){
            var x = this[propertyInitMethodName]();
            Object.defineProperty(this, key, {
                configurable: true,
                enumerable: false,
                value: x
            });
            if (privateKey){
                this[privateKey] = x;
            }
            return x;
        }
    });
};

JSGlobalObject.JSOutlet = function(){
    if (this === undefined){
        return new JSOutlet();
    }
};

JSOutlet.prototype = Object.create(JSCustomProperty.prototype);

JSOutlet.prototype.define = function(C, key, extensions){
    Object.defineProperty(C.prototype, key, {
        writable: true,
        configurable: true,
        value: null
    });
    var connectionName = C.nameOfOutletConnectionMethod(key);
    Object.defineProperty(C.prototype, connectionName, {
        value: function JSOutlet_connect(outlets){
            Object.defineProperty(this, key, {
                configurable: true,
                get: function JSOutlet_get(){
                    var value = outlets.valueForKey(key);
                    Object.defineProperty(this, key, {configurable: true, writable: true, value: value});
                    return value;
                }
            });
        }
    });
};