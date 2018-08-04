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
    _keyForNextObjectInit: null,

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
        if (value === null || value === undefined){
            return value;
        }
        if (typeof(value) == 'string'){
            if (value.length > 0){
                var c = value.charAt(0);
                var _value = value.substr(1);
                switch (c) {
                    case '/':
                        if (!(_value in this._objectMap)){
                            this._keyForNextObjectInit = _value;
                            this._objectMap[_value] = this.resolvedValue(this._plist[_value], defaultClassName, overrides);
                        }
                        return this._objectMap[_value];
                    case '$':
                        return JSResolveDottedName(JSGlobalObject, _value);
                    case '.':
                        if (this._bundle !== null && this._baseName !== null){
                            return this._bundle.localizedString(_value, this._baseName + '.strings');
                        }
                        return value;
                    case '\\':
                        return _value;
                }
            }
            return value;
        }
        if (typeof(value) == 'object'){
            var className = defaultClassName;
            if (JSSpec.Keys.ObjectClass in value){
                className = value[JSSpec.Keys.ObjectClass];
            }
            if (overrides !== null && overrides !== undefined){
                value = JSCopy(value);
                for (var k in overrides){
                    value[k] = overrides[k];
                }
            }

            if (className){
                var obj = JSClass.FromName(className).initWithSpec(this, value);
                return obj;
            }else{
                return value;
            }
        }
        return value;
    },

    willInitObject: function(obj){
        if (this._keyForNextObjectInit === null){
            return;
        }
        this._objectMap[this._keyForNextObjectInit] = obj;
        this._keyForNextObjectInit = null;
    }

});

JSSpec.Keys = {
    FilesOwner: "File's Owner",
    ObjectClass: "class"
};