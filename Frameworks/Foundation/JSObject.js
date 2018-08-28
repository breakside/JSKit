// #import "Foundation/JSClass.js"
// #import "Foundation/JSValueTransformer.js"
/* global JSGlobalObject, JSObject, JSClass, JSClassForName, JSIsNullValueTransformer, JSIsNotNullValueTransformer, JSIsEmptyValueTransformer, JSIsNotEmptyValueTransformer, JSNegateBooleanValueTransformer */
'use strict';

JSGlobalObject.JSObject = function JSObject(){
    if (this === undefined){
        throw new Error("JSObject cannot be used as a function");
    }
    throw new Error("JSObject cannot be used a constructor, use an init method instead");
};

Object.setPrototypeOf(JSGlobalObject.JSObject, JSClass.prototype);

Object.defineProperties(JSGlobalObject.JSObject, {
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
    },
    constructor: {
        value: JSGlobalObject.JSObject
    }
});

JSObject.allocate = function(){
    var obj = Object.create(this.prototype);
    obj.objectID = ++JSObject.ID;
    obj._observers = {};
    obj._bindings = {};
    obj._observableKeys = {};
    return obj;
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

    initWithSpecName: function(specName){
        var spec = JSSpec.initWithResource(specName);
        var owner = spec.filesOwner;
        if (owner.isKindOfClass(this.$class)){
            return owner;
        }
        return null;
    },

    initWithSpec: function(spec, values){
        if ("outlets" in values){
            this._initSpecOutlets(spec, values.outlets);
        }
    },

    _initSpecOutlets: function(spec, outlets){
        for (var key in outlets){
            this.setValueForKey(key, spec.resolvedValue(outlets[key]));
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
    // MARK: - Comparing

    isEqual: function(other){
        return this === other;
    },

    // -------------------------------------------------------------------------
    // MARK: - Observing

    observeValueForKeyPath: function(keyPath, ofObject, change, context){
    },

    _observeValueForKeyPath: function(keyPath, ofObject, change, context){
        if (context !== null && context === this._ignoreObserationContext){
            return;
        }
        if (this.automaticallyManagesBindings && context && context.type == JSObject.ObservingContext.Binding){
            var bindingInfo = context;
            var key;
            var i, l;
            var index;
            if (change.type == JSObject.KeyValueChange.Setting){
                this._updateValueForBinding(context.binding);
            }else if (change.type == JSObject.KeyValueChange.Insertion){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = 0, l = change.indexes.length; i < l; ++i){
                    index = change.indexes[i];
                    this.silentlyInsertObjectInKeyAtIndex(change.sourceObject.objectInKeyAtIndex(change.sourceKey, index), key, index);
                }
            }else if (change.type == JSObject.KeyValueChange.Removal){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = change.indexes.length - 1; i >= 0; --i){
                    index = change.indexes[i];
                    this.silentlyRemoveObjectFromKeyAtIndex(key, index);
                }
            }else if (change.type == JSObject.KeyValueChange.Replacement){
                key = bindingInfo.binding;
                change.indexes.sort();
                for (i = 0, l = change.indexes.length; i < l; ++i){
                    index = change.indexes[i];
                    this.silentlyReplaceObjectInKeyAtIndexWithObject(key, index, change.sourceObject.objectInKeyAtIndex(change.sourceKey, index));
                }
            }
        }else if (context && context.type == JSObject.ObservingContext.Chained){
            var observerInfo = context;
            observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, change, observerInfo.context);
        }
        this.observeValueForKeyPath(keyPath, ofObject, change, context);
    },

    addObserverForKeyPath: function(observer, keyPath, options, context){
        var observerInfo = {
            type                : JSObject.ObservingContext.Chained,
            observingObject     : observer,
            observingKeyPath    : keyPath,
            options             : options || {},
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
                if (observerInfo.observingObject === observer && observerInfo.observingKeyPath == keyPath){
                    if (context === undefined || context === observerInfo.context){
                        this._observers[key].splice(i,1);
                        if (keyParts.length && value){
                            value.removeObserverForKeyPath(this, keyParts.join('.'), observerInfo);
                        }
                    }
                }
            }
        }
    },

    _ignoreObserationContext: null,

    // -------------------------------------------------------------------------
    // MARK: - Binding

    bind: function(binding, toObject, keyPath, options){
        if (this.automaticallyManagesBindings){
            var ourKey = binding;
            var isBoolean = typeof(this.valueForKeyPath(ourKey)) == "boolean";
            if (!isBoolean && (binding in this._bindings)){
                this.unbind(binding);
            }
            if (options === undefined){
                options = {};
            }
            // We allow some shortcuts in the keyPath string that specify
            // common value transformers.  These make it easier to type out
            // bindings in code or specs
            keyPath = keyPath.replace(/\s+/g, '');
            if (keyPath.startsWith("!")){
                keyPath = keyPath.substr(1);
                options.valueTransformer = JSNegateBooleanValueTransformer;
            }else if (keyPath.endsWith("!=null")){
                keyPath = keyPath.substr(0, keyPath.length - 6);
                options.valueTransformer = JSIsNotNullValueTransformer;
            }else if (keyPath.endsWith("==null")){
                keyPath = keyPath.substr(0, keyPath.length - 6);
                options.valueTransformer = JSIsNullValueTransformer;
            }else if (keyPath.endsWith(".length>0")){
                keyPath = keyPath.substr(0, keyPath.length - 9);
                options.valueTransformer = JSIsNotEmptyValueTransformer;
            }else if (keyPath.endsWith(".length==0")){
                keyPath = keyPath.substr(0, keyPath.length - 10);
                options.valueTransformer = JSIsEmptyValueTransformer;
            }
            if (options.valueTransformer && !options.valueTransformer.canReverseTransform){
                options.readOnly = true;
            }
            var bindingInfo = {
                type            : JSObject.ObservingContext.Binding,
                binding         : binding,
                observedObject  : toObject,
                observedKeyPath : keyPath,
                options         : options,
                isBoolean       : isBoolean,
                next            : null,
                tail            : null,
            };
            bindingInfo.tail = bindingInfo;
            if (isBoolean && (binding in this._bindings)){
                this._bindings[binding].tail.next = bindingInfo;
                this._bindings[binding].tail = bindingInfo;
                // Once there is more than one boolean input, we can't reverse
                // the final value to the multiple sources because any one of them
                // could be false while the others are true.  We could reverse
                // a `true` value, because all would have to be true, but this
                // isn't a common use case.
                this._bindings[binding].options.readOnly = true;
            }else{
                this._bindings[binding] = bindingInfo;
            }
            toObject.addObserverForKeyPath(this, keyPath, options, bindingInfo);
            this._updateValueForBinding(binding);
        }
    },

    unbind: function(binding){
        if (binding in this._bindings){
            var bindingInfo = this._bindings[binding];
            bindingInfo.observedObject.removeObserverForKeyPath(this, bindingInfo.observedKeyPath, bindingInfo);
        }
    },

    _modelValueForBinding: function(binding){
        if (!(binding in this._bindings)){
            return null;
        }
        var bindingInfo = this._bindings[binding];
        var value = bindingInfo.observedObject.valueForKeyPath(bindingInfo.observedKeyPath);
        if (bindingInfo.options.valueTransformer){
            value = bindingInfo.options.valueTransformer.transformValue(value);
        }
        if (bindingInfo.isBoolean){
            var nextValue;
            while (value === true && bindingInfo.next !== null){
                bindingInfo = bindingInfo.next;
                nextValue = bindingInfo.observedObject.valueForKeyPath(bindingInfo.observedKeyPath);
                if (bindingInfo.options.valueTransformer){
                    nextValue = bindingInfo.options.valueTransformer.transformValue(nextValue);
                }
                value = value === true && nextValue === true;
            }
        }
        return value;
    },

    _updateValueForBinding: function(binding){
        var value = this._modelValueForBinding(binding);
        this.silentlySetValueForKey(binding, value);
    },

    didChangeValueForBinding: function(binding){
        var ourKey = binding;
        var bindingInfo = this._bindings[binding];
        if (!bindingInfo){
            return;
        }
        if (bindingInfo.options.readOnly){
            return;
        }
        var value = this.valueForKey(ourKey);
        if (bindingInfo.valueTransformer){
            value = bindingInfo.valueTransformer.reverseTransformValue(value);
        }
        this._ignoreObserationContext = bindingInfo;
        bindingInfo.observedObject.setValueForKeyPath(bindingInfo.observedKeyPath, value);
        this._ignoreObserationContext = null;
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
            return value.valueForKeyPath(keyParts.join('.'));
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
        if (keyParts.length === 0){
            this.setValueForKey(key, value);
        }else{
            var intermediateValue = this.valueForKey(key);
            if (intermediateValue !== null && intermediateValue !== undefined){
                intermediateValue.setValueForKeyPath(keyParts.join('.'), value);
            }
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
            return value.slice(range.location, range.end);
        }
    },

    insertObjectInKeyAtIndex: function(obj, key, index){
        var insertMethodName = this.$class.nameOfInsertMethodForKey(key);
        if (this[insertMethodName]){
            return this[insertMethodName](obj, index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Insertion, [index]);
            value.splice(index, 0, obj);
            this.didChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Insertion, [index]);
        }
    },

    removeObjectFromKeyAtIndex: function(key, index){
        var removeMehodName = this.$class.nameOfRemoveMethodForKey(key);
        if (this[removeMehodName]){
            return this[removeMehodName](index);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Removal, [index]);
            value.splice(index, 1);
            this.didChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Removal, [index]);
        }
    },

    replaceObjectInKeyAtIndexWithObject: function(key, index, obj){
        var replaceMehodName = this.$class.nameOfReplaceMethodForKey(key);
        if (this[replaceMehodName]){
            return this[replaceMehodName](index, obj);
        }
        var value = this.valueForKey(key);
        if (value !== null && value !== undefined){
            this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Replacement, [index]);
            value[index] = obj;
            this.didChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Replacement, [index]);
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
            for (var i = 0, l = this._observers[key].length; i < l; ++i){
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
        var observedValue;
        var keyPath;
        if (key in this._observers){
            for (var i = 0, l = this._observers[key].length; i < l; ++i){
                var observerInfo = this._observers[key][i];
                var keyParts = observerInfo.observingKeyPath.split('.');
                keyParts.shift();
                if (keyParts.length && value){
                    keyPath = keyParts.join('.');
                    value.addObserverForKeyPath(this, keyPath, observerInfo.options, observerInfo);
                    observedValue = value.valueForKeyPath(keyPath);
                }else{
                    observedValue = value;
                }
                observerInfo.observingObject._observeValueForKeyPath(observerInfo.observingKeyPath, this, {type: JSObject.KeyValueChange.Setting, newValue: observedValue}, observerInfo.context);
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
                    if (change == JSObject.KeyValueChange.Insertion){
                        for (i = 0, l = indexes.length; i < l; ++i){
                            index = indexes[i];
                            obj = this.objectInKeyAtIndex(key, index);
                            targetObject.insertObjectInKeyPathAtIndex(obj, finalKey, index);
                        }
                    }else if (change == JSObject.KeyValueChange.Removal){
                        for (i = indexes.length - 1; i >=0; --i){
                            index = indexes[i];
                            targetObject.removeObjectFromKeyPathAtIndex(finalKey, index);
                        }
                    }else if (change == JSObject.KeyValueChange.Replacement){
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
                    this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Insertion, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSObject.KeyValueChange.Insertion, [index]);
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
                configurable: true,
                enumerable: false,
                value: originalMethod
            });
            Object.defineProperty(this, removeMethodName, {
                configurable: true,
                enumerable: false,
                value: function JSObject_observableRemove(obj, index){
                    this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Removal, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSObject.KeyValueChange.Removal, [index]);
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
                configurable: true,
                enumerable: false,
                value: originalMethod
            });
            Object.defineProperty(this, replaceMethodName, {
                configurable: true,
                enumerable: false,
                value: function JSObject_observableReplace(obj, index){
                    this.willChangeValuesAtIndexesForKey(key, JSObject.KeyValueChange.Replacement, [index]);
                    originalMethod.call(this, obj, index);
                    this.didChangeValueForKey(key, JSObject.KeyValueChange.Replacement, [index]);
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
            configurable: true,
            enumerable: false,
            writable: false,
            value: originalSetter
        });
        Object.defineProperty(this, setterName, {
            configurable: true,
            enumerable: false,
            value: observableSetter
        });
        Object.defineProperty(this, key, {
            configurable: true,
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
            configurable: true,
            enumerable: false,
            writable: true,
            value: value
        });
        Object.defineProperty(this, key, {
            configurable: true,
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
        return "[%s #%d]".sprintf(this.$class.className, this.objectID || -1);
    }

});

JSObject.initialize();

delete JSObject.$super;

JSObject.ObservingContext = {
    Binding: "Binding",
    Chained: "Chained"
};

JSObject.KeyValueChange = {
    Setting: 1,
    Insertion: 2,
    Removal: 3,
    Replacement: 4
};
