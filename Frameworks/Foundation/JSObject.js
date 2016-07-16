// #import "Foundation/Foundation.js"
// #import "Foundation/JSClass.js"
/* global JSClass, JSClassForName */
'use strict';

var JSObject = Object.create(JSClass.prototype, {
    ID: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 0
    },
    className: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: 'JSObject'
    }
});

JSObject.prototype = Object.create(Object.prototype, {
    '$class': {
        configurable: false,
        enumerable: false,
        writable: false,
        value: JSObject
    }
});

JSObject.defineInitMethod = function(methodName){
    Object.defineProperty(this, methodName, {
        configurable: false,
        enumerable: false,
        value: function JSObject_createAndInit(){
            var args = Array.prototype.slice.call(arguments, 0);
            var obj = Object.create(this.prototype);
            obj.objectID = ++JSObject.ID;
            obj._observers = [];
            obj._bindings = {};
            obj._observableKeys = {};
            obj[methodName].apply(obj, args);
            return obj;
        }
    });
};

JSObject.definePropertiesFromExtensions({

    objectID    : null,
    _observers  : null,
    _bindings   : null,
    _observableKeys: null,

    automaticallyManagesBindings    : true,


    // -------------------------------------------------------------------------
    // MARK: - Initialization

    init: function(){
    },

    initWithProperties: function(properties){
        for (var i in properties){
            this.setValueForKey(i, properties[i]);
        }
    },

    initWithSpec: function(spec){
        if ("JSBindings" in spec){
            for (var i = 0, l = spec.JSBindings.length; i < l; ++i){
                var bindingSpec = spec.JSBindings[i];
                this.bind(bindingSpec.binding, bindingSpec.toObject, bindingSpec.keyPath, bindingSpec.options);
            }
        }
        if ("JSOutlets" in spec){
            for (var key in spec.JSOutlets){
                this.setValueForKey(key, spec.JSOutlets[key]);
            }
        }
    },

    implementsProtocol: function(protocol){
        for (var method in protocol){
            if (!(method in this)){
                return false;
            }
        }
        return true;
    },

    isKindOfClass: function(referenceClass){
        return this.$class.isSubclassOfClass(referenceClass);
    },

    // -------------------------------------------------------------------------
    // MARK: - Observing

    observeValueForKeyPath: function(keyPath, ofObject, change, context){
    },

    _observeValueForKeyPath: function(keyPath, ofObject, change, context){
        if (this.automaticallyManagesBindings && context && context.type == JSObservingContext.Binding){
            var bindingInfo = context;
            var key;
            var i, l;
            var index;
            if (change.type == JSKeyValueChange.Setting){
                key = bindingInfo.binding;
                if (bindingInfo.options.valueTransformer){
                    var valueTransformer = JSClassForName(bindingInfo.options.valueTransformer).init();
                    this.silentlySetValueForKey(key, valueTransformer.transformValue(change.newValue));
                }else{
                    this.silentlySetValueForKey(key, change.newValue);
                }
            }else if (change.type == JSKeyValueChange.Insertion){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = 0, l = change.indexes.length; i < l; ++i){
                    index = change.indexes[i];
                    this.silentlyInsertObjectInKeyAtIndex(change.sourceObject.objectInKeyAtIndex(change.sourceKey, index), key, index);
                }
            }else if (change.type == JSKeyValueChange.Removal){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = change.indexes.length - 1; i >= 0; --i){
                    index = change.indexes[i];
                    this.silentlyRemoveObjectFromKeyAtIndex(key, index);
                }
            }else if (change.type == JSKeyValueChange.Replacement){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = 0, l = change.indexes.length; i < l; ++i){
                    index = change.indexes[i];
                    this.silentlyReplaceObjectInKeyAtIndexWithObject(key, index, change.sourceObject.objectInKeyAtIndex(change.sourceKey, index));
                }
            }
        }else if (context && context.type == JSObservingContext.Chained){
            var observerInfo = context;
            observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, change, observerInfo.context);
        }
        this.observeValueForKeyPath(keyPath, ofObject, change, context);
    },

    addObserverForKeyPath: function(observer, keyPath, options, context){
        var observerInfo = {
            type                : JSObservingContext.Chained,
            observingObject     : observer,
            observingKeyPath    : keyPath,
            options             : options,
            context             : context
        };
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        this._enableObservingForKey(key);
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
                            value.removeObserverForKeyPath(this, keyParts.join('.'), context);
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
                type            : JSObservingContext.Binding,
                binding         : binding,
                observedObject  : toObject._id,
                observedKeyPath : keyPath,
                options         : options
            };
            this._bindings[binding] = bindingInfo;
            toObject.addObserverForKeyPath(this, keyPath, options, bindingInfo);
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
        var getterName = this.$class.nameOfGetMethodForKey(key);
        if (this[getterName]){
            return this[getterName]();
        }
        getterName = this.$class.nameOfBooleanGetMethodForKey(key);
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
        var setterName = this.$class.nameOfSetMethodForKey(key);
        if (this[setterName]){
            return this[setterName](value);
        }
        var silentKey = this.$class.nameOfSilentPropertyForKey(key);
        if (silentKey in this){
            this[key] = value;
        }else{
            this.willChangeValueForKey(key);
            this[key] = value;
            this.didChangeValueForKey(key);
        }
    },

    silentlySetValueForKey: function(key, value){
        var replacedSetterName = this.$class.nameOfSilentSetMethodForKey(key);
        if (this[replacedSetterName]){
            return this[replacedSetterName](value);
        }
        var setterName = this.$class.nameOfSetMethodForKey(key);
        if (this[setterName]){
            return this[setterName](value);
        }
        var silentKey = this.$class.nameOfSilentPropertyForKey(key);
        if (silentKey in this){
            this[silentKey] = value;
        }else{
            this[key] = value;
        }
    },

    setValueForKeyPath: function(keyPath, value){
        var keyParts = keyPath.split('.');
        var key = keyParts.shift();
        var intermediateValue = this.valueForKey(key);
        if (keyParts.length && (value !== null && value !== undefined)){
            intermediateValue.setValueForKeyPath(keyParts.join('.'), value);
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
        if ((value !== null && value !== undefined) && ('length' in value)){
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
        var insertMethodName = this.$class.nameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Insertion, [index]);
            value.splice(index, 0, obj);
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChange.Insertion, [index]);
        }
    },

    removeObjectFromKeyAtIndex: function(key, index){
        var removeMehodName = this.$class.nameOfRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Removal, [index]);
            value.splice(index, 1);
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChange.Removal, [index]);
        }
    },

    replaceObjectInKeyAtIndexWithObject: function(key, index, obj){
        var replaceMehodName = this.$class.nameOfReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Replacement, [index]);
            value[index] = obj;
            this.didChangeValuesAtIndexesForKey(key, JSKeyValueChange.Replacement, [index]);
        }
    },

    silentlyInsertObjectInKeyAtIndex: function(obj, key, index){
        var insertMethodName = this.$class.nameOfSilentInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        insertMethodName = this.$class.nameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            value.splice(index, 0, obj);
        }
    },

    silentlyRemoveObjectFromKeyAtIndex: function(key, index){
        var removeMehodName = this.$class.nameOfSilentRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        removeMehodName = this.$class.nameOfRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            value.splice(index, 1);
        }
    },

    silentlyReplaceObjectInKeyAtIndexWithObject: function(key, index, obj){
        var replaceMehodName = this.$class.nameOfSilentReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        replaceMehodName = this.$class.nameOfReplaceMethodForKey(key);
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
                observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, {type: JSKeyValueChange.Setting, newValue: value}, observerInfo.context);
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
                var transformedValue = value;
                if (bindingInfo.options.valueTransformer){
                    var valueTransformer = JSClassForName(bindingInfo.options.valueTransformer).init();
                    transformedValue = valueTransformer.reverseTransformValue(value);
                }
                bindingInfo.observedObject.setValueForKeyPath(bindingInfo.observedKeyPath, transformedValue);
            }
        }
    },

    willChangeValuesAtIndexesForKey: function(key, change, indexes){
    },

    didChangeValuesAtIndexesForKey: function(key, change, indexes){
        var i, l;
        if (key in this._observers){
            for (i = 0, l = this._observers[key].length; i < l; ++i){
                var observerInfo = this._observers[key][i];
                observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, {type: change, indexes: indexes, sourceObject: this, sourceKey: key}, observerInfo.context);
            }
        }
        if (this.automaticallyManagesBindings && key in this._bindings){
            var bindingInfo = this._bindings[key];
            var index;
            var obj;
            if (!bindingInfo.options.readOnly){
                var keyParts = bindingInfo.keyPath.split('.');
                var finalKey = keyParts.pop();
                var targetObject = bindingInfo.observedObject;
                if (keyParts.length){
                    targetObject = targetObject.valueForKeyPath(keyParts.join('.'));
                }
                if (targetObject){
                    indexes.sort();
                    if (change == JSKeyValueChange.Insertion){
                        for (i = 0, l = indexes.length; i < l; ++i){
                            index = indexes[i];
                            obj = this.objectInKeyAtIndex(key, index);
                            targetObject.insertObjectInKeyPathAtIndex(obj, finalKey, index);
                        }
                    }else if (change == JSKeyValueChange.Removal){
                        for (i = indexes.length - 1; i >=0; --i){
                            index = indexes[i];
                            targetObject.removeObjectFromKeyPathAtIndex(finalKey, index);
                        }
                    }else if (change == JSKeyValueChange.Replacement){
                        for (i = 0, l = indexes.length; i < l; ++i){
                            index = indexes[i];
                            obj = this.objectInKeyAtIndex(key, index);
                            targetObject.replaceObjectInKeyAtIndexWithObject(finalKey, index, obj);
                        }
                    }
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - KVO swaps

    _enableObservingForKey: function(key){
        if (!(key in this._observableKeys)){
            this._enableSetObservingForKey(key);
            this._enableInsertObservingForKey(key);
            this._enableRemoveObservingForKey(key);
            this._enableReplaceObservingForKey(key);
            this._observableKeys[key] = true;
        }
    },

    _enableSetObservingForKey: function(key){
        var setterName = this.$class.nameOfSetMethodForKey(key);
        if (this[setterName]){
            this.defineObservableSetterForKey(key, setterName);
        }else{
            this.defineObservablePropertyForKey(key, this[key]);
        }
    },

    _enableInsertObservingForKey: function(key){
        var insertMethodName = this.$class.nameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            var silentMethodName = this.$class.nameOfSilentInsertMethodForKey(key);
            var originalMethod = this[insertMethodName];
            Object.defineProperty(this, silentMethodName, {
                configurable: false,
                enumerable: false,
                value: originalMethod
            });
            Object.defineProperty(this, insertMethodName, {
                configurable: false,
                enumerable: false,
                value: function JSObject_observableInsert(obj, index){
                    this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Insertion, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSKeyValueChange.Insertion, [index]);
                }
            });
        }
    },

    _enableRemoveObservingForKey: function(key){
        var removeMethodName = this.$class.nameOfRemoveMethodForKey(key);
        if (this[removeMethodName]){
            var silentMethodName = this.$class.nameOfSilentRemoveMethodForKey(key);
            var originalMethod = this[removeMethodName];
            Object.defineProperty(this, silentMethodName, {
                configurable: false,
                enumerable: false,
                value: originalMethod
            });
            Object.defineProperty(this, removeMethodName, {
                configurable: false,
                enumerable: false,
                value: function JSObject_observableRemove(obj, index){
                    this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Removal, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSKeyValueChange.Removal, [index]);
                }
            });
        }
    },

    _enableReplaceObservingForKey: function(key){
        var replaceMethodName = this.$class.nameOfReplaceMethodForKey(key);
        if (this[replaceMethodName]){
            var silentMethodName = this.$class.nameOfSilentReplaceMethodForKey(key);
            var originalMethod = this[replaceMethodName];
            Object.defineProperty(this, silentMethodName, {
                configurable: false,
                enumerable: false,
                value: originalMethod
            });
            Object.defineProperty(this, replaceMethodName, {
                configurable: false,
                enumerable: false,
                value: function JSObject_observableReplace(obj, index){
                    this.willChangeValuesAtIndexesForKey(key, JSKeyValueChange.Replacement, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSKeyValueChange.Replacement, [index]);
                }
            });
        }
    },

    defineObservableSetterForKey: function(key, setterName){
        var replacedSetterName = this.$class.nameOfSilentSetMethodForKey(key);
        var silentKey = this.$class.nameOfSilentPropertyForKey(key);
        var originalSetter = this[setterName];
        var observableSetter = function JSObject_observableSet(v){
            this.willChangeValueForKey(key);
            originalSetter.call(this, v);
            this.didChangeValueForKey(key);
        };
        Object.defineProperty(this, replacedSetterName, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: originalSetter
        });
        Object.defineProperty(this, setterName, {
            configurable: false,
            enumerable: false,
            value: observableSetter
        });
        Object.defineProperty(this, key, {
            configurable: false,
            enumerable: false,
            get: function JSObject_observableGet(){
                return this[silentKey];
            },
            set: observableSetter
        });
    },

    defineObservablePropertyForKey: function(key, value){
        var silentKey = this.$class.nameOfSilentPropertyForKey(key);
        Object.defineProperty(this, silentKey, {
            configurable: false,
            enumerable: false,
            writable: true,
            value: value
        });
        Object.defineProperty(this, key, {
            configurable: false,
            enumerable: false,
            get: function JSObject_observableGet(){
                return this[silentKey];
            },
            set: function JSObject_observableSet(v){
                this.willChangeValueForKey(key);
                this[silentKey] = v;
                this.didChangeValueForKey(key);
            }
        });
    },

    toString: function(){
        return "[%s #%d]".sprintf(this.$class.name, this.objectID);
    }

});

var JSObservingContext = {
    Binding: "JSObservingContextBinding",
    Chained: "JSObservingContextChained"
};

var JSKeyValueChange = {
    Setting: 1,
    Insertion: 2,
    Removal: 3,
    Replacement: 4
};
