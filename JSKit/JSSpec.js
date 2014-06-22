// #import "Foundation/Foundation.js"
// #import "JSKit/JSObject.js"
// #import "JSKit/JSPropertyList.js"

JSClass('JSSpec', JSObject, {

    _plist: null,
    _objectMap: null,

    initWithResource: function(resource){
        JSSpec.$super.init.call(this);
        this._plist = JSPropertyList.initWithResource(resource);
        this._objectMap = {};
    },

    filesOwner: function(){
        var value = this._plist[JSSPecKeyFilesOwner];
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
        if (typeof(value) == 'obj'){
            for (var i in value){
                value[i] = this._resolve[value[i]];
            }
            if (JSSpecKeys.ObjectClass in value){
                var className = value[JSSpecKeys.ObjectClass];
                var obj = JSClassFromName(className).initWithSpec(value);
                return obj;
            }else{
                return value;
            }
        }
        return value;
    }

});

var JSSpecKeys = {
    FilesOwner: "JSFilesOwner",
    ObjectClass: "JSObjectClass"
};