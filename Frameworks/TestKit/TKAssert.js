'use strict';

function TKAssertion(message){
    if (this === undefined){
        return new TKAssertion(message);
    }
    var line = TKAssertion.LineForCurrentCaseInError(new Error());
    this.message = 'Line ' + line + '. ' + (message || '');
}

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

function TKAssert(condition, message){
    if (!condition){
        message = message || '';
        throw TKAssertion('TKAssert failed, expression is false. ' + message);
    }
}

function TKAssertEquals(a, b, message){
    if (a != b){
        message = message || '';
        throw TKAssertion('TKAssertEquals failed, ' + (a) + ' != ' + (b) + '. ' + message);
    }
}

function TKAssertNotEquals(a, b, message){
    if (a == b){
        message = message || '';
        throw TKAssertion('TKAssertNotEquals failed, ' + (a) + ' == ' + (b) + '. ' + message);
    }
}

function TKAssertExactEquals(a, b, message){
    if (a !== b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' !== ' + (b) + '. ' + message);
    }
}

function TKAssertNotExactEquals(a, b, message){
    if (a === b){
        message = message || '';
        throw TKAssertion('TKAssertNotExactEquals failed, ' + (a) + ' === ' + (b) + '. ' + message);
    }
}

function TKAssertObjectEquals(a, b, message){
    if (!a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectEquals failed, ' + (a) + ' != ' + (b) + ' (using .isEqual()) ' + message);
    }
}

function TKAssertObjectNotEquals(a, b, message){
    if (a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectNotEquals failed, ' + (a) + ' == ' + (b) + ' (using .isEqual()) ' + message);
    }
}

function TKAssertNotNull(expression, message){
    if (expression === null){
        message = message || '';
        throw TKAssertion('TKAssertNotNull failed, expression is null. ' + message);
    }
}

function TKAssertNull(expression, message){
    if (expression !== null){
        message = message || '';
        throw TKAssertion('TKAssertNull failed, expression is not null ' + message);
    }
}

function TKAssertUndefined(expression, message){
    if (expression !== undefined){
        message = message || '';
        throw TKAssertion('TKAssertNull failed, expression is not undefined ' + message);
    }
}

function TKAssertThrows(f){
    var threw = false;
    try{
        f();
    }catch(e){
        threw = true;
    }
    if (!threw){
        throw TKAssertion('TKAssertThrows failed, no exception thrown for ' + f);
    }
}