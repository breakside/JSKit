/* global JSGlobalObject, JSResolveDottedName */
'use strict';

// -----------------------------------------------------------------------------
// MARK: - Utility

/// Shallow copy an object of any type
///
/// Make a copy of an object or array by instantiating a new top level object
/// and populating memebers by reference to match the original object.
///
/// Since javascript objects are always passed by reference, a shallow copy
/// can be useful when receiving an object/array that you need to modify without
/// changing the original object received.
///
/// - Parameter obj: The object of which to make a shallow copy
/// - Returns: A shallow copy of the given object that can be changed at the top
///   level without modifying the original
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

/// Deep copy an object of any type
///
/// Make a copy of an object or array by intantiating a new top level object
/// and populating members by recursively making copies.
///
/// Deep copies are useful when you need to modify an object more than one
/// level deep without changing the original object received.
///
/// - Parameter obj: The object of which ot make a deep copy
/// - Returns: A deep copy of the given object that can be changed at any level
///   without modifying the original
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
