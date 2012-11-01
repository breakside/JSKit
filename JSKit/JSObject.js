// #import "Foundation/Javascript.js"

JSObservingContextBinding = "JSObservingContextBinding";
JSObservingContextChained = "JSObservingContextChained";

JSKeyValueChangeSetting     = 1;
JSKeyValueChangeInsertion   = 2;
JSKeyValueChangeRemoval     = 3;
JSKeyValueChangeReplacement = 4;

function JSObject(){
}

JSObject.ID = 0;

JSObject.alloc = function(){
    return new this();
};

JSObject.prototype = {
    
    _id         : null,
    _observers  : null,
    _bindings   : null,
    
    automaticallyManagesBindings    : true,
    
    
    // -------------------------------------------------------------------------
    // MARK: - Initialization
    
    init: function(){
        this._id = ++JSObject.ID;
        this._observers = [];
        this._bindings = {};
        return this;
    },
    
    initWithSpec: function(spec){
        JSObject.init.call(this);
        if ("JSBindings" in spec){
            for (var i = 0, l = spec.JSBindings.length; i < l; ++i){
                var bindingSpec = spec.JSBindings[i];
                this.bind(bindingSpec.binding, bindingSpec.toObject, bindingSpec.keyPath, bindingSpec.options);
            }
        }
        if ("JSOutlets" in spec){
            for (var key in spec.JSOutlets){
                this.setValueForKey(spec.JSOutlets[key], key);
            }
        }
        return this;
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Observing
    
    observeValueForKeyPath: function(keyPath, ofObject, change, context){
    },
    
    _observeValueForKeyPath: function(keyPath, ofObject, change, context){
        if (this.automaticallyManagesBindings && context && context.type == JSObservingContextBinding){
            var bindingInfo = context;
            if (change.type == JSKeyValueChangeSetting){
                var key = bidningInfo.binding;
                if (bindingInfo.options.valueTransformer){
                    var vt = JSClassForName(bindingInfo.options.valueTransformer).alloc().init();
                    this.silentlySetValueForKey(key, vt.transformValue(change.newValue));
                }else{
                    this.silentlySetValueForKey(key, change.newValue);
                }
            }else if (change.type == JSKeyValueChangeInsertion){
                var key = bindingInfo.binding;
                change.indexes.sort();
                for (var i = 0, l = change.indexes.length; i < l; ++i){
                    var index = change.indexes[i];
                    this.silentlyInsertObjectInKeyAtIndex(change.sourceObject.objectInKeyAtIndex(change.sourceKey, index), key, index);
                }
            }else if (change.type == JSKeyValueChangeRemoval){
                var key = bindingInfo.binding;
                change.indexes.sort();
                for (var i = change.indexes.length - 1; i >= 0; --i){
                    var index = change.indexes[i];
                    this.silentlyRemoveObjectFromKeyAtIndex(key, index);
                }
            }else if (change.type == JSKeyValueChangeReplacement){
                var key = bindingInfo.binding;
                change.indexes.sort();
                for (var i = 0, l = change.indexes.length; i < l; ++i){
                    var index = change.indexes[i];
                    this.silentlyReplaceObjectInKeyAtIndexWithObject(key, index, change.sourceObject.objectInKeyAtIndex(change.sourceKey, index));
                }
            }
        }else if (context && context.type == JSObservingContextChained){
            var observerInfo = context;
            observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, change, observerInfo.context);
        }
        this.observeValueForKeyPath(keyPath, ofObject, change, context);
    },
    
    addObserverForKeyPath: function(observer, keyPath, options, context){
        var observerInfo = {
            type                : JSObservingContextChained,
            observingObject     : observer,
            observingKeyPath    : keyPath,
            options             : options,
            context             : context
        };
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        this._swapSetMethodForKey(key);
        this._swapInsertMethodForKey(key);
        this._swapRemoveMethodForKey(key);
        this._swapReplaceMethodForKey(key);
        if (!this._observers[key]){
            this._observers[key] = [];
        }
        this._observers[key].push(observerInfo);
        if (keyParts.length){
            var value = this.valueForKey(keyParts[0]);
            if (value){
                value.addObserverForKeyPath(this, keyParts.join('.'), options, observerInfo);
            }
        }
    },
    
    removeObserverForKeyPath: function(observer, keyPath, context){
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        var value = this.valueForKey(key);
        if (key in this._observers){
            for (var i = this._observers[key].length - 1; i >=0; --i){
                var observerInfo = this._observers[key][i];
                if (observerInfo.observingObject._id == observer._id && observerInfo.observingKeyPath == keyPath){
                    if (context === undefined || context === observerInfo.context){
                        this._observers[key].splice(i,1);
                        if (keyParts.length && value){
                            value.removeObserverForKeyPath(this, keyParts.join('.'), bindingInfo);
                        }
                    }
                }
            }
        }
    },
    
    // -------------------------------------------------------------------------
    // MARK: - Binding
    
    bind: function(binding, toObject, keyPath, options){
        if (this.automaticallyManagesBindings){
            if (binding in this._bindings){
                this.unbind(binding);
            }
            var bindingInfo = {
                type            : JSObservingContextBinding,
                binding         : binding,
                observedObject  : toObject._id,
                observedKeyPath : keyPath,
                options         : options
            };
            this._bindings[bidning] = bindingInfo;
            target.addObserverForKeyPath(this, keyPath, observingOptions, bindingInfo);
        }
    },
    
    unbind: function(binding){
        if (binding in this._bindings){
            var bindingInfo = this._bindings[binding];
            bindingInfo.observedObject.removeObserverForKeyPath(bindingInfo.observedKeyPath, bindingInfo);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Accessing and Manipulating Properties
    
    valueForKey: function(key){
        var getterName = 'get' + key.ucFirst();
        if (this[getterName]){
            return this[getterName]();
        }
        var getterName = 'is' + key.ucFirst();
        if (this[getterName]){
            return this[getterName]();
        }
        return this[key];
    },
    
    valueForKeyPath: function(keyPath){
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        var value = this.valueForKey(key);
        if ((value !== null && value !== undefined) && keyParts.length){
            return value.valueForKeyPath(keyParts.length);
        }
        return value;
    },
    
    setValueForKey: function(key, value){
        var setterName = JSNameOfSetMethodForKey(key);
        if (this[setterName]){
            return this[setterName](value);
        }
        this.willChangeValueForKey(key);
        this[key] = value;
        this.didChangeValueForKey(key);
    },
    
    silentlySetValueForKey: function(key, value){
        var replacedSetterName = JSNameOfSilentSetMethodForKey(key);
        if (this[replacedSetterName]){
            return this[replacedSetterName](value);
        }
        var setterName = JSNameOfSetMethodForKey(key);
        if (this[setterName]){
            return this[setterName](value);
        }
        this[key] = value;
    },
    
    setValueForKeyPath: function(keyPath, value){
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        var value = this.valueForKey(key);
        if (keyParts.length && (value !== null && value !== undefined)){
            value.setValueForKeyPath(keyParts.join('.'), value);
        }
    },
    
    // -------------------------------------------------------------------------
    // MARK: To-Many Properties
    
    countOfKey: function(key){
        var countMethodName = 'countOf' + key.ucFirst();
        if (this[countMethodName]){
            return this[countMethodName]();
        }
        var value = this.valueForKey(key);
        if ((value !== null && value !== undefined) && (length in value)){
            return value.length;
        }
        return null;
    },
    
    objectInKeyAtIndex: function(key, index){
        var objectMethodName = 'objectIn' + key.ucFirst() + 'AtIndex';
        if (this[objectMethodName]){
            return this[objectMethodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            return value[index];
        }
    },
    
    getKeyRange: function(key, range){
        var rangeMethodName = 'get' + key.ucFirst() + 'Range';
        if (this[rangeMethodName]){
            return this[rangeMethodName]();
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            return value.slice(range.location, range.location + range.length);
        }
    },
    
    insertObjectInKeyAtIndex: function(obj, key, index){
        var insertMethodName = JSNameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeInsertion, [index]);
            value.splice(index, 0, obj);
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChangeInsertion, [index]);
        }
    },
    
    removeObjectFromKeyAtIndex: function(key, index){
        var removeMehodName = JSNameOfRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeRemoval, [index]);
            value.splice(index, 1);
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChangeRemoval, [index]);
        }
    },
    
    replaceObjectInKeyAtIndexWithObject: function(key, index, obj){
        var replaceMehodName = JSNameOfReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeReplacement, [index]);
            value[index] = obj;
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChangeReplacement, [index]);
        }
    },
        
    silentlyInsertObjectInKeyAtIndex: function(obj, key, index){
        var insertMethodName = JSNameOfSilentInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var insertMethodName = JSNameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            value.splice(index, 0, obj);
        }
    },
        
    silentlyRemoveObjectFromKeyAtIndex: function(key, index){
        var removeMehodName = JSNameOfSilentRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var removeMehodName = JSNameOfRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            value.splice(index, 1);
        }
    },
        
    silentlyReplaceObjectInKeyAtIndexWithObject: function(key, index, obj){
        var replaceMehodName = JSNameOfSilentReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        var replaceMehodName = JSNameOfReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            value[index] = obj;
        }
    },
    
    // -------------------------------------------------------------------------
    // MARK: Notifications
    
    willChangeValueForKey: function(key){
        var value = this.valueForKey(key);
        if (value && key in this._observers){
            for (var i = 0, l = this._observers[key]; i < l; ++i){
                var observerInfo = this._observers[key][i];
                var keyParts = observerInfo.observingKeyPath.split('.');
                keyParts.shift();
                if (keyParts.length){
                    value.removeObserverForKeyPath(this, keyParts.join('.'), observerInfo);
                }
            }
        }
    },
        
    didChangeValueForKey: function(key){
        var value = this.valueForKey(key);
        if (key in this._observers){
            for (var i = 0, l = this._observers[key].length; i < l; ++i){
                var observerInfo = this._observers[key][i];
                observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, {type: JSKeyValueChangeSetting, newValue: value}, observerInfo.context);
                var keyParts = observerInfo.observingKeyPath.split('.');
                keyParts.shift();
                if (keyParts.length && value){
                    value.addObserverForKeyPath(this, keyParts.join('.'), observerInfo.options, observerInfo);
                }
            }
        }
        if (this.automaticallyManagesBindings && key in this._bindings){
            var bindingInfo = this._bindings[key];
            if (!bindingInfo.options.readOnly){
                transformedValue = value;
                if (bindingInfo.options.valueTransformer){
                    var vt = JSClassForName(bindingInfo.options.valueTransformer).alloc().init();
                    transformedValue = vt.reverseTransformValue(value);
                }
                bindingInfo.observedObject.setValueForKeyPath(bindingInfo.observedKeyPath, transformedValue);
            }
        }
    },
        
    willChangeValuesAtIndexesForKey: function(key, change, indexes){
    },
        
    didChangeValuesAtIndexesForKey: function(key, change, indexes){
        if (key in this._observers){
            for (var i = 0, l = this._observers[key].length; i < l; ++i){
                var observerInfo = this._observers[key][i];
                observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, {type: change, indexes: indexes, sourceObject: this, sourceKey: key}, observerInfo.context);
            }
        }
        if (this.automaticallyManagesBindings && key in this._bindings){
            var bindingInfo = this._bindings[key];
            if (!bindingInfo.options.readOnly){
                var keyParts = bindingInfo.keyPath.split('.');
                var finalKey = keyParts.pop();
                var targetObject = bidningInfo.observedObject;
                if (keyParts.length){
                    targetObject = targetObject.valueForKeyPath(keyParts.join('.'));
                }
                if (targetObject){
                    indexes.sort();
                    if (change == JSKeyValueChangeInsertion){
                        for (var i = 0, l = indexes.length; i < l; ++i){
                            var index = indexes[i];
                            var obj = this.objectInKeyAtIndex(key, index);
                            targetObject.insertObjectInKeyPathAtIndex(obj, finalKey, index);
                        }
                    }else if (change == JSKeyValueChangeRemoval){
                        for (var i = indexes.length - 1; i >=0; --i){
                            var index = indexes[i];
                            targetObject.removeObjectFromKeyPathAtIndex(finalKey, index);
                        }
                    }else if (change == JSKeyValueChangeReplacement){
                        for (var i = 0, l = indexes.length; i < l; ++i){
                            var index = indexes[i];
                            var obj = this.objectInKeyAtIndex(key, index);
                            targetObject.replaceObjectInKeyAtIndexWithObject(finalKey, index, obj);
                        }
                    }
                }
            }
        }
    },
    
    // -------------------------------------------------------------------------
    // MARK: - KVO swaps
    
    _swapSetMethodForKey: function(key){
        var setterName = JSNameOfSetMethodForKey(key);
        var replacedSetterName = JSNameOfSilentSetMethodForKey(key);
        if (this[setterName] && !this[replacedSetterName]){
            var originalSetter = this[setterName];
            this[replacedSetterName] = originalSetter;
            this[setterName] = function(x){
                this.willChangeValueForKey(key);
                originalSetter.call(this, x);
                this.didChangeValueForKey(key);
            };
        }
    },
    
    _swapInsertMethodForKey: function(key){
        var insertMethodName = JSNameOfInsertMethodForKey(key);
        var silentMethodName = JSNameOfSilentInsertMethodForKey(key);
        if (this[insertMethodName] && !this[silentMethodName]){
            var originalMethod = this[insertMethodName];
            this[silentMethodName] = originalMethod;
            this[insertMethodName] = function(obj, index){
                this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeInsertion, [index]);
                originalMethod.call(this, obj, index);
                this.didChangeValueForKey(key, JSKeyValueChangeInsertion, [index]);
            };
        }
    },
    
    _swapRemoveMethodForKey: function(key){
        var removeMethodName = JSNameOfRemoveMethodForKey(key);
        var silentMethodName = JSNameOfSilentRemoveMethodForKey(key);
        if (this[removeMethodName] && !this[silentMethodName]){
            var originalMethod = this[removeMethodName];
            this[silentMethodName] = originalMethod;
            this[removeMethodName] = function(obj, index){
                this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeRemoval, [index]);
                originalMethod.call(this, obj, index);
                this.didChangeValueForKey(key, JSKeyValueChangeRemoval, [index]);
            };
        }
    },
    
    _swapReplaceMethodForKey: function(key){
        var replaceMethodName = JSNameOfReplaceMethodForKey(key);
        var silentMethodName = JSNameOfSilentReplaceMethodForKey(key);
        if (this[replaceMethodName] && !this[silentMethodName]){
            var originalMethod = this[replaceMethodName];
            this[silentMethodName] = originalMethod;
            this[replaceMethodName] = function(obj, index){
                this.willChangeValuesAtIndexesForKey(key, JSKeyValueChangeReplacement, [index]);
                originalMethod.call(this, obj, index);
                this.didChangeValueForKey(key, JSKeyValueChangeReplacement, [index]);
            };
        }
    },
    
};
