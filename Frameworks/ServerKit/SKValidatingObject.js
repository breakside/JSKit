// #import Foundation
// #import "SKHTTPError.js"
'use strict';

JSClass("SKValidatingObject", JSObject, {

    length: JSReadOnlyProperty(),

    initWithObject: function(obj){
        this.obj = obj || {};
    },

    obj: null,

    getLength: function(){
        if (this.obj instanceof Array){
            return this.obj.length;
        }
        return null;
    },

    numberForKey: function(key, defaultValue, validator){
        var n = this.obj[key];
        if (typeof(defaultValue) == 'function'){
            validator = defaultValue;
            defaultValue = undefined;
        }
        if (n === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (isNaN(n)){
            throw new SKValidatingObject.Error('`%s` must be a number'.sprintf(key));
        }
        if (validator){
            validator(n);
        }
        return n;
    },

    numberForKeyInRange: function(key, min, max, defaultValue){
        return this.numberForKey(key, defaultValue, function(n){
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error('`%s` must be >= %f'.sprintf(key, min));
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error('`%s` must be <= %f'.sprintf(key, max));
            }
        });
    },

    integerForKey: function(key, defaultValue){
        return this.numberForKey(key, defaultValue, function(n){
            if (n !== Math.floor(n)){
                throw new SKValidatingObject.Error('`%s` must be an integer'.sprintf(key));
            }
        });
    },

    integerForKeyInRange: function(key, min, max, defaultValue){
        return this.integerForKey(key, defaultValue, function(n){
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error('`%s` must be >= %f'.sprintf(key, min));
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error('`%s` must be <= %f'.sprintf(key, max));
            }
        });
    },

    stringForKey: function(key, defaultValue, validator){
        var value = this.obj[key];
        if (typeof(defaultValue) == 'function'){
            validator = defaultValue;
            defaultValue = undefined;
        }
        if (value === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (typeof(value) !== "string"){
            throw new SKValidatingObject.Error('`%s` must be a string'.sprintf(key));
        }
        if (validator){
            validator(value);
        }
        return value;
    },

    emailForKey: function(key, defaultValue){
        return this.stringForKey(key, defaultValue, function(str){
            if (!str.match(/^[^\s]+@[^\s]+$/)){
                throw new SKValidatingObject.Error('`%s` must be an email'.sprintf(key));
            }
        });
    },

    phoneForKey: function(key, defaultValue){
        return this.stringForKey(key, defaultValue, function(str){
            if (!str.match(/^\+?[\d\.\(\)\-\s]+$/)){
                throw new SKValidatingObject.Error('`%s` must be a phone number'.sprintf(key));
            }
            var digits = str.replace(/[^\d]/g, '');
            if (digits.length > 15){
                throw new SKValidatingObject.Error('`%s` must be a phone number'.sprintf(key));
            }
            if (digits.length < 7){
                throw new SKValidatingObject.Error('`%s` must be a phone number'.sprintf(key));   
            }
        });
    },

    booleanForKey: function(key, defaultValue){
        var b = this.obj[key];
        if (b === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (b !== true && b !== false){
            throw new SKValidatingObject.Error('`%s` must be a boolean'.sprintf(key));
        }
        return b;
    },

    objectForKey: function(key, defaultValue){
        var obj = this.obj[key];
        if (obj === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (typeof(obj) !== "object"){
            throw new Error('`%s` must be an object'.sprintf(key));
        }
        return SKValidatingObject.initWithObject(obj);
    },

    validObjectForKey: function(key, validatingClass, defaultValue){
        var obj = this.obj[key];
        if (obj === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (typeof(obj) !== "object"){
            throw new Error('`%s` must be an object'.sprintf(key));
        }
        var validator = SKValidatingObject.initWithObject(obj);
        return validatingClass.initWithValidatingObject(validator);
    },

    arrayForKey: function(key, defaultValue){
        var obj = this.obj[key];
        if (obj === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (typeof(obj) !== "object" || !(obj instanceof Array)){
            throw new Error('`%s` must be an array'.sprintf(key));
        }
        return SKValidatingObject.initWithObject(obj);
    },

    optionForKey: function(key, optionSet, defaultValue){
        var value = this.obj[key];
        if (value === undefined){
            if (defaultValue === undefined){
                throw new SKValidatingObject.Error('`%s` is required'.sprintf(key));
            }
            return defaultValue;
        }
        if (!optionSet.has(value)){
            throw new SKValidatingObject.Error('`%s` must be one of [%s]'.sprintf(key, Array.from(optionSet).join(', ')));
        }
        return value;
    }

});

SKValidatingObject.Error = function(message){
    if (this === undefined){
        return new SKValidatingObject.Error(message);
    }
    if (message instanceof SKValidatingObject.Error){
        this.message = message.message;
    }else{
        this.message = message;
    }
};