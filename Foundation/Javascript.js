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

function JSResolveDottedName(context, name){
    parts = name.split('.');
    while (parts.length && context !== null && context !== undefined){
        context = context[parts.shift()];
    }
    return context;
}

function JSClassFromName(className){
    return JSResolveDottedName(JSGlobalObject, className);
}
