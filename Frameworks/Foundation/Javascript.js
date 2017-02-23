/* global JSGlobalObject, JSResolveDottedName */
'use strict';
// -----------------------------------------------------------------------------
// MARK: - Utility

JSGlobalObject.JSCopy = function JSCopy(obj){
    if (obj === null || obj === undefined){
        return obj;
    }
    if (typeof(obj) == 'object'){
        var i, l;
        var _copy;
        if (obj instanceof Array){
            _copy = [];
            for (i = 0, l = obj.length; i < l; ++i){
                _copy.push(obj[i]);
            }
        }else{
            _copy = {};
            for (i in obj){
                _copy[i] = obj[i];
            }
        }
        return _copy;
    }
    return obj;
};

JSGlobalObject.JSDeepCopy = function JSDeepCopy(obj){
    if (obj === null || obj === undefined){
        return obj;
    }
    if (typeof(obj) == 'object'){
        var i, l;
        var _copy;
        if (obj instanceof Array){
            _copy = [];
            for (i = 0, l = obj.length; i < l; ++i){
                _copy.push(JSDeepCopy(obj[i]));
            }
        }else{
            _copy = {};
            for (i in obj){
                _copy[i] = JSDeepCopy(obj[i]);
            }
        }
        return _copy;
    }
    return obj;
};

JSGlobalObject.JSResolveDottedName = function JSResolveDottedName(context, name){
    var parts = name.split('.');
    while (name.length && parts.length && context !== null && context !== undefined){
        context = context[parts.shift()];
    }
    return context;
};

JSGlobalObject.JSSetDottedName = function JSSetDottedName(context, name, value){
    var parts = name.split('.');
    while (parts.length > 1 && context !== null && context !== undefined){
        context = context[parts.shift()];
    }
    context[parts[0]] = value;
};

JSGlobalObject.JSClassFromName = function JSClassFromName(className){
    return JSResolveDottedName(JSGlobalObject, className);
};
