// #import "Foundation/Javascript.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSPropertyList.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSLazyInitProperty, JSCopy, JSReadOnlyProperty, JSPropertyList, JSSpec, JSGlobalObject, JSResolveDottedName, JSBundle */
'use strict';

JSClass('JSSpec', JSObject, {

    bundle: JSReadOnlyProperty('_bundle', null),
    filesOwner: JSLazyInitProperty('_getFilesOwner'),
    _plist: null,
    _objectMap: null,
    _baseName: null,
    _keysForNextObjectInit: null,

    initWithResource: function(resource, bundle){
        var extIndex = resource.lastIndexOf('.');
        if (extIndex > 0 && extIndex < resource.length - 1){
            this._baseName = resource.substr(0, extIndex);
        }else{
            this._baseName = resource;
        }
        this._bundle = bundle || JSBundle.mainBundle;
        var plist = JSPropertyList.initWithResource(resource, this._bundle);
        this.initWithPropertyList(plist);
    },

    initWithPropertyList: function(plist){
        this._plist = plist;
        this._objectMap = {};
    },

    _getFilesOwner: function(){
        return this.resolvedValue("/File's Owner", "JSObject");
    },

    resolvedValue: function(value, defaultClassName, overrides){
        var i, l;
        if (value !== null && value !== undefined){
            if (typeof(value) == 'string'){
                if (value.length > 0){
                    var c = value.charAt(0);
                    var key = value.substr(1);
                    switch (c) {
                        case '/':
                            if (!(key in this._objectMap)){
                                if (this._keysForNextObjectInit === null){
                                    this._keysForNextObjectInit = [];
                                }
                                this._keysForNextObjectInit.push(key);
                                this._objectMap[key] = this.resolvedValue(this._plist[key], defaultClassName, overrides);
                            }
                            value = this._objectMap[key];
                            break;
                        case '$':
                            value = JSResolveDottedName(JSGlobalObject, key);
                            break;
                        case '.':
                            if (this._bundle !== null && this._baseName !== null){
                                value = this._bundle.localizedString(key, this._baseName + '.strings');
                            }
                            break;
                        case '\\':
                            value = key;
                            break;
                    }
                }
            }else if (typeof(value) == 'object'){
                var className = defaultClassName;
                if (JSSpec.Keys.ObjectClass in value){
                    className = value[JSSpec.Keys.ObjectClass];
                }
                if (className){
                    if (overrides !== null && overrides !== undefined){
                        value = JSCopy(value);
                        for (var k in overrides){
                            value[k] = overrides[k];
                        }
                    }
                    var cls = JSClass.FromName(className);
                    var obj = cls.allocate();
                    // Since initWithSpec may resolve objects that reference back
                    // to us, we need to set our entry in the object map before
                    // calling init.
                    // NOTE: If there's a double-refeference like /File's Owner: /SomeObject,
                    // we'll add this newly allocated object under both names.
                    if (this._keysForNextObjectInit !== null){
                        for (i = 0, l = this._keysForNextObjectInit.length; i < l; ++i){
                            this._objectMap[this._keysForNextObjectInit[i]] = obj;
                        }
                        this._keysForNextObjectInit = null;
                    }
                    obj.initWithSpec(this, value);
                    // Set the bindings after the object has been initialized
                    if ('bindings' in value){
                        this._setObjectBindings(obj, value.bindings);
                    }
                    value = obj;
                }
            }
        }
        return value;
    },

    _setObjectBindings: function(obj, bindings){
        var descriptors;
        var descriptor;
        for (var binding in bindings){
            descriptors = bindings[binding];
            if (!(descriptors instanceof Array)){
                descriptors = [descriptors];
            }
            for (var i = 0, l = descriptors.length; i < l; ++i){
                descriptor = descriptors[i];
                var options = {};
                if (descriptor.transformer){
                    options.valueTransformer = this.resolvedValue(descriptor.transformer);
                }
                var to = this.resolvedValue(descriptor.to);
                obj.bind(binding, to, descriptor.value, options);
            }
        }
    },

});

JSSpec.Keys = {
    FilesOwner: "File's Owner",
    ObjectClass: "class"
};