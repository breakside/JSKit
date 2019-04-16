// #import Foundation
// #import "SKHTTPError.js"
/* global JSClass, JSObject, SKValidatingObject */
'use strict';

JSClass("SKValidatingObject", JSObject, {

    initWithObject: function(obj){
        this.obj = obj || {};
    },

    obj: null,

    getNumber: function(key, defaultValue, validator){
        var n = this.obj[key];
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

    getNumberInRange: function(key, min, max, defaultValue){
        return this.getNumber(key, defaultValue, function(n){
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error('`%s` must be >= %f'.sprintf(key, min));
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error('`%s` must be <= %f'.sprintf(key, max));
            }
        });
    },

    getInteger: function(key, defaultValue){
        return this.getNumber(key, defaultValue, function(n){
            if (n !== Math.floor(n)){
                throw new SKValidatingObject.Error('`%s` must be an integer'.sprintf(key));
            }
        });
    },

    getIntegerInRange: function(key, min, max, defaultValue){
        return this.getNumber(key, defaultValue, function(n){
            if (n !== Math.floor(n)){
                throw new SKValidatingObject.Error('`%s` must be an integer'.sprintf(key));
            }
            if (min !== undefined && n < min){
                throw new SKValidatingObject.Error('`%s` must be >= %f'.sprintf(key, min));
            }
            if (max !== undefined && n > max){
                throw new SKValidatingObject.Error('`%s` must be <= %f'.sprintf(key, max));
            }
        });
    },

    getString: function(key, defaultValue, validator){
        var value = this.obj[key];
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

    getEmail: function(key, defaultValue){
        return this.getString(key, defaultValue, function(str){
            if (!str.match(/^[^\s]+@[^\s]+$/)){
                throw new SKValidatingObject.Error('`%s` must be an email'.sprintf(key));
            }
        });
    },

    getBoolean: function(key, defaultValue){
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

    getObject: function(key, defaultValue){
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

    getArray: function(key, defaultValue){
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

    getEnum: function(key, optionSet, defaultValue){
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