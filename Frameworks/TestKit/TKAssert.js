/* global JSGlobalObject, TKAssertion */
/* global TKAssert, TKAssertEquals, TKAssertNotEquals, TKAssertFloatEquals, TKAssertExactEquals, TKAssertNotExactEquals, TKAssertObjectEquals, TKAssertObjectNotEquals, TKAssertNotNull, TKAssertNull, TKAssertUndefined, TKAssertThrows */
'use strict';

JSGlobalObject.TKAssertion = function(message){
    if (this === undefined){
        return new TKAssertion(message);
    }
    var line = TKAssertion.LineForCurrentCaseInError(new Error());
    this.message = 'Line ' + line + '. ' + (message || '');
};

TKAssertion.LineForCurrentCaseInError = function(error){
    if (error.stack){
        var stack = error.stack.split("\n");
        var prefix = TKAssertion.CurrentTestCase + '@';
        for (var i = 0, l = stack.length; i < l; ++i){
            var caller = stack[i];
            if (caller.substr(0, 14) == '    at Object.'){
                // chrome
                caller = caller.substr(14);
                prefix = TKAssertion.CurrentTestCase + ' (';
            }else if (caller.charAt(0) == '.'){
                // firefox
                caller = caller.substr(1);
            }
            if (caller.substr(0, prefix.length) == prefix){
                caller = caller.substr(prefix.length);
                var parts = caller.split(':');
                var line = parts[parts.length - 2];
                return line;
            }
        }
    }
    return 0;
};

TKAssertion.CurrentTestCase = '';

JSGlobalObject.TKAssert = function(condition, message){
    if (condition !== true){
        message = message || '';
        if (condition !== false){
            throw TKAssertion('TKAssert failed, ' + (condition) + ' is not a boolean. ' + message);
        }
        throw TKAssertion('TKAssert failed, expression is false. ' + message);
    }
};

JSGlobalObject.TKAssertEquals = function(a, b, message){
    if (a != b){
        message = message || '';
        throw TKAssertion('TKAssertEquals failed, ' + (a) + ' != ' + (b) + '. ' + message);
    }
};

JSGlobalObject.TKAssertNotEquals = function(a, b, message){
    if (a == b){
        message = message || '';
        throw TKAssertion('TKAssertNotEquals failed, ' + (a) + ' == ' + (b) + '. ' + message);
    }
};

JSGlobalObject.TKAssertFloatEquals = function(a, b, threshold, message){
    if (threshold === undefined){
        threshold = Math.abs((b || 1) / 1000000);
    }
    if (isNaN(a)){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, first arg is NaN. ' + message);
    }
    if (isNaN(b)){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, second arg is NaN. ' + message);
    }
    var x = Math.abs(a - b);
    if (x > threshold){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, ' + (a) + ' != ' + (b) + ' +/- ' + threshold + '. ' + message);
    }
};

JSGlobalObject.TKAssertExactEquals = function(a, b, message){
    if (a !== b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' !== ' + (b) + '. ' + message);
    }
};

JSGlobalObject.TKAssertNotExactEquals = function(a, b, message){
    if (a === b){
        message = message || '';
        throw TKAssertion('TKAssertNotExactEquals failed, ' + (a) + ' === ' + (b) + '. ' + message);
    }
};

JSGlobalObject.TKAssertObjectEquals = function(a, b, message){
    if (!a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectEquals failed, ' + (a) + ' != ' + (b) + ' (using .isEqual()) ' + message);
    }
};

JSGlobalObject.TKAssertObjectNotEquals = function(a, b, message){
    if (a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectNotEquals failed, ' + (a) + ' == ' + (b) + ' (using .isEqual()) ' + message);
    }
};

JSGlobalObject.TKAssertNotNull = function(expression, message){
    if (expression === null){
        message = message || '';
        throw TKAssertion('TKAssertNotNull failed, expression is null. ' + message);
    }
};

JSGlobalObject.TKAssertNull = function(expression, message){
    if (expression !== null){
        message = message || '';
        throw TKAssertion('TKAssertNull failed, expression is not null ' + message);
    }
};

JSGlobalObject.TKAssertUndefined = function(expression, message){
    if (expression !== undefined){
        message = message || '';
        throw TKAssertion('TKAssertNull failed, expression is not undefined ' + message);
    }
};

JSGlobalObject.TKAssertThrows = function(f){
    var threw = false;
    try{
        f();
    }catch(e){
        threw = true;
    }
    if (!threw){
        throw TKAssertion('TKAssertThrows failed, no exception thrown for ' + f);
    }
};