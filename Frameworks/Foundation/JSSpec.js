// #import "Foundation/Foundation.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSPropertyList.js"
/* global JSClass, JSObject, JSPropertyList, JSSpec, JSClassFromName, JSGlobalObject */
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
        return this._resolve(value);
    },

    _resolve: function(value){
        if (typeof(value) == 'string'){
            if (value.length > 0){
                var c = value.charAt(0);
                var _value = value.substr(1);
                switch (c) {
                    case '#':
                        if (!(_value in this._objectMap)){
                            this._objectMap[_value] = this._resolve(this._plist[_value]);
                        }
                        return this._objectMap[_value];
                    case '$':
                        return JSGlobalObject[_value];
                    case '\\':
                        return _value;
                }
            }
            return value;
        }
        if (typeof(value) == 'object'){
            for (var i in value){
                value[i] = this._resolve(value[i]);
            }
            if (JSSpec.Keys.ObjectClass in value){
                var className = value[JSSpec.Keys.ObjectClass];
                var obj = JSClassFromName(className).initWithSpec(value);
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