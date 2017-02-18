// #import "Foundation/Javascript.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSPropertyList.js"
/* global JSClass, JSObject, JSPropertyList, JSSpec, JSClassFromName, JSGlobalObject, JSResolveDottedName */
'use strict';

JSClass('JSSpec', JSObject, {

    _plist: null,
    _objectMap: null,

    initWithResource: function(resource){
        this._plist = JSPropertyList.initWithResource(resource);
        this._objectMap = {};
    },

    filesOwner: function(){
        var value = this._plist[JSSpec.Keys.FilesOwner];
        return this.resolvedValue(value);
    },

    resolvedValue: function(value){
        if (typeof(value) == 'string'){
            if (value.length > 0){
                var c = value.charAt(0);
                var _value = value.substr(1);
                switch (c) {
                    case '#':
                        if (!(_value in this._objectMap)){
                            this._objectMap[_value] = this.resolvedValue(this._plist[_value]);
                        }
                        return this._objectMap[_value];
                    case '$':
                        return JSResolveDottedName(JSGlobalObject, _value);
                    case '\\':
                        return _value;
                }
            }
            return value;
        }
        if (typeof(value) == 'object'){
            if (JSSpec.Keys.ObjectClass in value){
                var className = value[JSSpec.Keys.ObjectClass];
                var obj = JSClassFromName(className).initWithSpec(this, value);
                return obj;
            }else{
                return value;
            }
        }
        return value;
    }

});

JSSpec.Keys = {
    FilesOwner: "JSFilesOwner",
    ObjectClass: "JSObjectClass"
};