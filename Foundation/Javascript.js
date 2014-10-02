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

function JSSetDottedName(context, name, value){
    parts = name.split('.');
    while (parts.length > 1 && context !== null && context !== undefined){
        context = context[parts.shift()];
    }
    context[parts[0]] = value;
}

function JSClassFromName(className){
    return JSResolveDottedName(JSGlobalObject, className);
}
