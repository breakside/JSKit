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
        var i, l;
        var parts;
        var line;
        var caller;

        // Look for trace after a run of 1 or more TKAssert.js traces
        var atIndex;
        var url;
        var returnNext = false;
        for (i = 0, l = stack.length; i < l; ++i){
            atIndex = stack[i].indexOf('@');
            if (atIndex >= 0){
                caller = stack[i].substr(atIndex);
            }else{
                caller = stack[i];
            }
            parts = caller.split(':');
            parts.pop();
            line = parts.pop();
            url = parts.join(':');
            parts = url.split('/');
            if (parts[parts.length - 1] == 'TKAssert.js' || parts[parts.length - 1] == 'TKExpectation.js'){
                returnNext = true;
            }else if (returnNext){
                return line;
            }
        }

        // Look for matching test case call
        var chromePrefix = TKAssertion.CurrentTestCase + '(';
        var firefoxPrefix = TKAssertion.CurrentTestCase + '@';
        var nodePrefix = TKAssertion.CurrentTestSuite + '.' + TKAssertion.CurrentTestCase + ' (';
        var prefix;
        for (i = 0, l = stack.length; i < l; ++i){
            caller = stack[i];
            if (caller.substr(0, 14) == '    at Object.'){
                // chrome
                caller = caller.substr(14);
                prefix = chromePrefix;
            }else if (caller.charAt(0) == '.'){
                // firefox
                caller = caller.substr(1);
                prefix = firefoxPrefix;
            }else if (caller.substr(0, 7) == '    at '){
                // node
                caller = caller.substr(7);
                prefix = nodePrefix;
            }else{
                prefix = firefoxPrefix;
            }
            if (caller.substr(0, prefix.length) == prefix){
                caller = caller.substr(prefix.length);
                parts = caller.split(':');
                line = parts[parts.length - 2];
                return line;
            }
        }
    }
    return 0;
};

TKAssertion.CurrentTestSuite = '';
TKAssertion.CurrentTestCase = '';

JSGlobalObject.TKAssert = function(condition, message){
    if (condition !== true){
        message = message || '';
        if (condition !== false){
            throw TKAssertion('TKAssert failed, ' + (condition) + ' is not a boolean. ' + (message || ''));
        }
        throw TKAssertion('TKAssert failed, expression is false. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertEquals = function(a, b, message){
    if (a != b){
        message = message || '';
        throw TKAssertion('TKAssertEquals failed, ' + (a) + ' != ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertNotEquals = function(a, b, message){
    if (a == b){
        message = message || '';
        throw TKAssertion('TKAssertNotEquals failed, ' + (a) + ' == ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertFloatEquals = function(a, b, threshold, message){
    if (threshold === undefined){
        threshold = Math.abs((b || 1) / 1000000);
    }
    if (isNaN(a)){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, first arg is NaN. ' + (message || ''));
    }
    if (isNaN(b)){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, second arg is NaN. ' + (message || ''));
    }
    var x = Math.abs(a - b);
    if (x > threshold){
        message = message || '';
        throw TKAssertion('TKAssertFloatEquals failed, ' + (a) + ' != ' + (b) + ' +/- ' + threshold + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertExactEquals = function(a, b, message){
    if (a !== b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' !== ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertLessThan = function(a, b, message){
    if (a >= b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' >= ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertGreaterThan = function(a, b, message){
    if (a <= b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' ,+ ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertLessThanOrEquals = function(a, b, message){
    if (a > b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' > ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertGreaterThanOrEquals = function(a, b, message){
    if (a < b){
        message = message || '';
        throw TKAssertion('TKAssertExactEquals failed, ' + (a) + ' < ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertNotExactEquals = function(a, b, message){
    if (a === b){
        message = message || '';
        throw TKAssertion('TKAssertNotExactEquals failed, ' + (a) + ' === ' + (b) + '. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertObjectEquals = function(a, b, message){
    if (a === null){
        throw TKAssertion('TKAssertObjectEquals failed, first argument is null. ' + (message || ''));
    }
    if (b === null){
        throw TKAssertion('TKAssertObjectEquals failed, second argument is null. ' + (message || ''));
    }
    if (a === undefined){
        throw TKAssertion('TKAssertObjectEquals failed, first argument is undefined. ' + (message || ''));
    }
    if (b === undefined){
        throw TKAssertion('TKAssertObjectEquals failed, second argument is undefined. ' + (message || ''));
    }
    if (!a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectEquals failed, ' + (a) + ' != ' + (b) + ' (using .isEqual()) ' + (message || ''));
    }
};

JSGlobalObject.TKAssertObjectNotEquals = function(a, b, message){
    if (a.isEqual(b)){
        message = message || '';
        throw TKAssertion('TKAssertObjectNotEquals failed, ' + (a) + ' == ' + (b) + ' (using .isEqual()) ' + (message || ''));
    }
};

JSGlobalObject.TKAssertNotNull = function(expression, message){
    if (expression === null){
        message = message || '';
        throw TKAssertion('TKAssertNotNull failed, expression is null. ' + (message || ''));
    }
};

JSGlobalObject.TKAssertNull = function(expression, message){
    if (expression !== null){
        message = message || '';
        throw TKAssertion('TKAssertNull failed, expression is not null ' + (message || ''));
    }
};

JSGlobalObject.TKAssertUndefined = function(expression, message){
    if (expression !== undefined){
        message = message || '';
        throw TKAssertion('TKAssertUndefined failed, expression is not undefined ' + (message || ''));
    }
};

JSGlobalObject.TKAssertNotUndefined = function(expression, message){
    if (expression === undefined){
        message = message || '';
        throw TKAssertion('TKAssertNotUndefined failed, expression is undefined ' + (message || ''));
    }
};

JSGlobalObject.TKAssertThrows = function(f, message){
    var threw = false;
    try{
        f();
    }catch(e){
        threw = true;
    }
    if (!threw){
        throw TKAssertion('TKAssertThrows failed, no exception thrown for ' + f + (message || ''));
    }
};

JSGlobalObject.TKAssertArrayEquals = function(a, b, message){
    for (var i = 0, l1 = a.length, l2 = b.length; i < l1 && i < l2; ++i){
        if (a[i] !== b[i]){
            throw TKAssertion('TKAssertArrayEquals failed, index ' + i + ', ' + (a[i]) + ' !== ' + (b[i]) + '. '  + (message || ''));
        }
    }
    if (l1 != l2){
        throw TKAssertion('TKAssertArrayEquals failed, length mismatch. '  + (message || ''));
    }
};