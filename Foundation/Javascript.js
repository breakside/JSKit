// -----------------------------------------------------------------------------
// MARK: - Utility

function JSCopy(obj){
    if (typeof(obj) == 'obj'){
        var _copy = {};
        for (var i in obj){
            _copy[i] = obj[i];
        }
        return _copy;
    }
    return obj;
}

function JSDeepCopy(obj){
    if (typeof(obj) == 'obj'){
        var _copy = {};
        for (var i in obj){
            _copy[i] = JSDeepCopy(obj[i]);
        }
        return _copy;
    }
    return obj;
}

function JSClassFromName(className){
    if (className in JSGlobalObject){
        return JSGlobalObject[className];
    }
    return null;
}
