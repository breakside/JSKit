// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global JSSize, JSPoint, JSRect, JSRange, JSAffineTransform, JSInsets, JSIndexPath, JSCopy */
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
        if (obj instanceof JSSize){
            return JSSize(obj);
        }
        if (obj instanceof JSPoint){
            return JSPoint(obj);
        }
        if (obj instanceof JSRect){
            return JSRect(obj);
        }
        if (obj instanceof JSRange){
            return JSRange(obj);
        }
        if (obj instanceof JSAffineTransform){
            return JSAffineTransform(obj);
        }
        if (obj instanceof JSInsets){
            return JSInsets(obj);
        }
        if (obj instanceof JSIndexPath){
            return JSIndexPath(obj);
        }
        var i, l;
        var _copy;
        if (obj instanceof Array){
            _copy = [];
            for (i = 0, l = obj.length; i < l; ++i){
                _copy.push(obj[i]);
            }
            return _copy;
        }
        _copy = {};
        for (i in obj){
            _copy[i] = obj[i];
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
    obj = JSCopy(obj);
    if (typeof(obj) == 'object'){
        var i, l;
        if (obj instanceof Array){
            for (i = 0, l = obj.length; i < l; ++i){
                obj[i] = JSDeepCopy(obj[i]);
            }
        }else{
            for (i in obj){
                obj[i] = JSDeepCopy(obj[i]);
            }
        }
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
